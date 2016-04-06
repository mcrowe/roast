'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Repo = function () {
  function Repo(schema) {
    _classCallCheck(this, Repo);

    this.schema = schema;
    this.db = {};
  }

  _createClass(Repo, [{
    key: 'get',
    value: function get(table, id) {
      this._requireTable(table);

      var record = this.db[table] && _.find(this.db[table], { id: id });

      if (!record) {
        throw new Error('Record not found \'' + table + ':' + id + '\'');
      }

      return _.clone(record);
    }
  }, {
    key: 'insert',
    value: function insert(table, record) {
      this._requireTable(table);

      record = applyDefaults(this.schema[table], this.db[table], record);

      var errors = tableErrors(this.schema[table], record);
      if (!_.isEmpty(errors)) {
        throw new Error('Record invalid ' + JSON.stringify(errors));
      }

      if (this.db[table]) {
        this.db[table] = this.db[table].concat(record);
      } else {
        this.db[table] = [record];
      }

      return _.clone(record);
    }
  }, {
    key: 'delete',
    value: function _delete(table, id) {
      this._requireTable(table);

      // Ensure that the record exists
      var previous = this.get(table, id);

      this.db[table] = _.reject(this.db[table], { id: id });

      return previous;
    }
  }, {
    key: 'update',
    value: function update(table, id, values) {
      this._requireTable(table);

      var record = this.get(table, id);

      var previous = record;

      record = _.merge({}, record, values);
      record = applyDefaults(this.schema[table], this.db[table], record);

      var errors = tableErrors(this.schema[table], record);
      if (!_.isEmpty(errors)) {
        throw new Error('Record invalid ' + JSON.stringify(errors));
      }

      this.db[table] = _.map(this.db[table], function (row) {
        return row.id == id ? record : row;
      });

      return record;
    }
  }, {
    key: 'all',
    value: function all(table, where) {
      this._requireTable(table);

      if (!this.db[table]) {
        return [];
      }

      // Handle when 'where is not provided'
      if (_.isUndefined(where)) {
        return this.db[table];
      }

      if (!_.isFunction(where)) {
        throw new Error("The second parameter must be a function to filter on, or undefined");
      }

      return _.filter(this.db[table], where);
    }
  }, {
    key: 'one',
    value: function one(table, where) {
      var records = this.all(table, where);

      if (records.length == 0) {
        throw new Error('Expected one, but found no records in \'' + table + ' matched the query.');
      } else if (records.length > 1) {
        throw new Error('Expected one, but found ' + records.length + ' records in \'' + table + ' matched the query.');
      }

      return records[0];
    }
  }, {
    key: '_applyChange',
    value: function _applyChange(change) {
      var table = change.table;

      switch (change.action) {
        case 'insert':
          if (this.db[table]) {
            this.db[table] = this.db[table].concat(change.record);
          } else {
            this.db[table] = [change.record];
          }
          return;

        case 'update':
          this.db[table] = _.map(this.db[table], function (row) {
            return row.id == change.id ? change.record : row;
          });
          return;

        case 'delete':
          this.db[table] = _.reject(this.db[table], { id: change.id });
          return;
      }
    }
  }, {
    key: '_requireTable',
    value: function _requireTable(table) {
      if (!this.schema[table]) {
        throw new Error('Table doesn\'t exist \'' + table + '\'');
      }
    }
  }]);

  return Repo;
}();

Roast.createRepo = function (schema) {
  return new Repo(schema);
};

module.exports = Roast;