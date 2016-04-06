'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _ = require('lodash');
var uuid = require('uuid');

var Roast = {};

Roast.string = 'string';
Roast.integer = 'integer';
Roast.number = 'number';

Roast.autoIncrement = function (table) {
  var max = _.maxBy(table, 'id');
  return max ? max.id + 1 : 1;
};

Roast.uuid = function (_table) {
  return uuid.v4();
};

function setRow(db, table, id, record) {
  return _extends({}, db, _defineProperty({}, table, _.map(db[table], function (r) {
    return r.id == id ? record : r;
  })));
}

function insertRow(db, table, record) {
  return _extends({}, db, _defineProperty({}, table, db[table] ? db[table].concat(record) : [record]));
}

function deleteRow(db, table, id) {
  return _extends({}, db, _defineProperty({}, table, _.reject(db[table], { id: id })));
}

function tableChanges(fromTable, toTable, tableName) {
  var changes = [];

  var ids = _.uniq(_.map(fromTable, function (r) {
    return r.id;
  }).concat(_.map(toTable, function (r) {
    return r.id;
  })));

  _.each(ids, function (id) {

    var fromRow = _.find(fromTable, { id: id });
    var toRow = _.find(toTable, { id: id });

    if (toRow && !fromRow) {
      // Any rows in toDb not in fromDb should be inserted.
      changes.push({ action: 'insert', table: tableName, record: toRow });
    } else if (fromRow && !toRow) {
      // Any rows in fromDb not in toDb should be deleted.
      changes.push({ action: 'delete', table: tableName, id: fromRow.id });
    } else {
      // Any rows with the same 'id' but different values should be set.
      if (!_.isEqual(fromRow, toRow)) {
        changes.push({ action: 'set', table: tableName, id: toRow.id, record: toRow });
      }
    }
  });

  return changes;
}

Roast.transaction = function (fromDb, toDb) {
  var tables = _.uniq(Object.keys(fromDb).concat(Object.keys(toDb)));

  return _.flatMap(tables, function (table) {
    return tableChanges(fromDb[table], toDb[table], table);
  });
};

Roast.executeTransaction = function (db, tx) {
  return _.reduce(tx, function (db, change) {
    switch (change.action) {
      case 'insert':
        return insertRow(db, change.table, change.record);
      case 'delete':
        return deleteRow(db, change.table, change.id);
      case 'set':
        return setRow(db, change.table, change.id, change.record);
    }
  }, db);
};

function columnErrors(columnSchema, value) {
  var errors = [];
  if (_.isNil(value) && _.has(columnSchema, 'null') && !columnSchema.null) {
    errors.push('must be present');
  }

  if (columnSchema.type == Roast.string && !(_.isString(value) || _.isNil(value))) {
    errors.push('must be a string');
  }

  if (columnSchema.type == Roast.integer && !(_.isInteger(value) || _.isNil(value))) {
    errors.push('must be an integer');
  }

  if (columnSchema.type == Roast.number && !(_.isNumber(value) || _.isNil(value))) {
    errors.push('must be a number');
  }

  return errors;
}

function tableErrors(tableSchema, record) {
  var errors = {};

  _.each(_.keys(tableSchema), function (col) {
    var colErrors = columnErrors(tableSchema[col], record[col]);
    if (!_.isEmpty(colErrors)) {
      errors[col] = colErrors;
    }
  });

  return errors;
}

function applyDefaults(tableSchema, table, record) {
  var result = record;

  _.each(_.keys(tableSchema), function (col) {
    var colDefault = tableSchema[col].default;

    if (_.isNil(record[col]) && !_.isNil(colDefault)) {
      var val = _.isFunction(colDefault) ? colDefault(table) : colDefault;
      result = _extends({}, result, _defineProperty({}, col, val));
    }
  });

  return result;
}

Roast.createRepo = function (schema) {

  function requireTable(table) {
    if (!schema[table]) {
      throw new Error('Table doesn\'t exist \'' + table + '\'');
    }
  }

  return {
    get: function get(db, table, id) {
      requireTable(table);

      var record = db[table] && _.find(db[table], { id: id });

      if (!record) {
        throw new Error('Record not found \'' + table + ':' + id + '\'');
      }

      return _extends({}, record);
    },
    all: function all(db, table, where) {
      requireTable(table);

      if (!db[table]) {
        return [];
      }

      // Handle when 'where is not provided'
      if (_.isUndefined(where)) {
        return db[table];
      }

      if (!_.isFunction(where)) {
        throw new Error("The second parameter must be a function to filter on, or undefined");
      }

      return _.filter(db[table], where);
    },
    one: function one(db, table, where) {
      var records = this.all(db, table, where);

      if (records.length == 0) {
        throw new Error('Expected one, but found no records in \'' + table + ' matched the query.');
      } else if (records.length > 1) {
        throw new Error('Expected one, but found ' + records.length + ' records in \'' + table + ' matched the query.');
      }

      return records[0];
    },
    insert: function insert(db, table, record) {
      requireTable(table);

      record = applyDefaults(schema[table], db[table], record);

      var errors = tableErrors(schema[table], record);
      if (!_.isEmpty(errors)) {
        throw new Error('Record invalid ' + JSON.stringify(errors));
      }

      db = insertRow(db, table, record);

      return [db, record];
    },
    delete: function _delete(db, table, id) {
      requireTable(table);

      // Ensure that the record exists
      var previous = this.get(db, table, id);

      db = deleteRow(db, table, id);

      return [db, previous];
    },
    update: function update(db, table, id, values) {
      requireTable(table);

      var record = this.get(db, table, id);

      var previous = record;

      record = _extends({}, record, values);
      record = applyDefaults(schema[table], db[table], record);

      var errors = tableErrors(schema[table], record);
      if (!_.isEmpty(errors)) {
        throw new Error('Record invalid ' + JSON.stringify(errors));
      }

      db = setRow(db, table, id, record);

      return [db, record];
    }
  };
};

module.exports = Roast;