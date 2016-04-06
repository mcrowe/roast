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
    this.transactionListeners = {};
  }

  _createClass(Repo, [{
    key: 'addTransactionListener',
    value: function addTransactionListener(listener) {
      if (!_.isFunction(listener)) {
        throw new Error('You must provide a function to listen for transactions');
      }

      var id = uuid.v4();
      this.transactionListeners[id] = listener;
      return id;
    }
  }, {
    key: 'removeTransactionListener',
    value: function removeTransactionListener(id) {
      if (!_.isString(id)) {
        throw new Error('You must provide the id of the listener to remove it');
      }
      delete this.transactionListeners[id];
    }
  }, {
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

      this.transaction([{
        action: 'insert',
        table: table,
        record: record
      }]);

      return _.clone(record);
    }
  }, {
    key: 'delete',
    value: function _delete(table, id) {
      this._requireTable(table);

      // Ensure that the record exists
      var previous = this.get(table, id);

      this.transaction([{
        action: 'delete',
        table: table,
        id: id,
        previous: previous
      }]);

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

      this.transaction([{
        action: 'update',
        table: table,
        id: id,
        previous: previous,
        record: record
      }]);

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
    key: 'transaction',
    value: function transaction(changes) {
      var tx = this._createTransaction(changes);
      this.applyTransaction(tx);
      this._notifyTransaction(tx);
    }
  }, {
    key: 'applyTransaction',
    value: function applyTransaction(transaction) {
      _.each(transaction.changes, this._applyChange.bind(this));
    }
  }, {
    key: 'revertTransaction',
    value: function revertTransaction(transaction) {
      _.each(transaction.changes, this._revertChange.bind(this));
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
    key: '_revertChange',
    value: function _revertChange(change) {
      var table = change.table;

      switch (change.action) {
        case 'insert':
          this.db[table] = _.reject(this.db[table], { id: change.record.id });
          return;

        case 'update':
          this.db[table] = _.map(this.db[table], function (row) {
            return row.id == change.id ? change.previous : row;
          });
          return;

        case 'delete':
          if (this.db[table]) {
            this.db[table] = this.db[table].concat(change.previous);
          } else {
            this.db[table] = [change.previous];
          }
          return;
      }
    }
  }, {
    key: '_createTransaction',
    value: function _createTransaction(changes) {
      return {
        id: uuid.v4(),
        changes: changes
      };
    }
  }, {
    key: '_notifyTransaction',
    value: function _notifyTransaction(transaction) {
      _.each(this.transactionListeners, function (listener, _id) {
        return listener(transaction);
      });
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