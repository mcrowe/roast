'use strict'

const _ = require('lodash')
const uuid = require('uuid')

const Roast = {}

Roast.string = 'string'
Roast.integer = 'integer'
Roast.number = 'number'
Roast.boolean = 'boolean'


Roast.autoIncrement = function(table) {
  const max = _.maxBy(table, 'id')
  return max ? max.id + 1 : 1
}

Roast.uuid = function(_table) {
  return uuid.v4()
}


function setRow(db, table, id, record) {
  return {
    ...db,
    [table]: _.map(db[table], r => r.id == id ? record : r)
  }
}


function insertRow(db, table, record) {
  return {
    ...db,
    [table]: db[table] ? db[table].concat(record) : [record]
  }
}


function deleteRow(db, table, id) {
  return {
    ...db,
    [table]: _.reject(db[table], {id: id})
  }
}


function tableChanges(fromTable, toTable, tableName) {
  const changes = []

  const ids = _.uniq( _.map(fromTable, r => r.id).concat( _.map(toTable, r => r.id) ) )

  _.each(ids, id => {

    const fromRow = _.find(fromTable, {id: id})
    const toRow = _.find(toTable, {id: id})

    if (toRow && !fromRow) {
      // Any rows in toDb not in fromDb should be inserted.
      changes.push({action: 'insert', table: tableName, record: toRow})
    } else if (fromRow && !toRow) {
      // Any rows in fromDb not in toDb should be deleted.
      changes.push({action: 'delete', table: tableName, id: fromRow.id})
    } else {
      // Any rows with the same 'id' but different values should be set.
      if (!_.isEqual(fromRow, toRow)) {
        changes.push({action: 'set', table: tableName, id: toRow.id, record: toRow})
      }
    }

  })

  return changes
}


Roast.transaction = function(fromDb, toDb) {
  const tables = _.uniq( Object.keys(fromDb).concat(Object.keys(toDb)) )

  return _.flatMap(tables, table =>
    tableChanges(fromDb[table], toDb[table], table)
  )
}


Roast.executeTransaction = function(db, tx) {
  return _.reduce(tx, (db, change) => {
    switch (change.action) {
      case 'insert':
        return insertRow(db, change.table, change.record)
      case 'delete':
        return deleteRow(db, change.table, change.id)
      case 'set':
        return setRow(db, change.table, change.id, change.record)
    }
  }, db)
}


function columnErrors(columnSchema, value) {
  let errors = []
  if (_.isNil(value) && _.has(columnSchema, 'null') && !columnSchema.null) {
    errors.push(`must be present`)
  }

  if (columnSchema.type == Roast.string && !(_.isString(value) || _.isNil(value))) {
    errors.push(`must be a string`)
  }

  if (columnSchema.type == Roast.integer && !(_.isInteger(value) || _.isNil(value))) {
    errors.push(`must be an integer`)
  }

  if (columnSchema.type == Roast.number && !(_.isNumber(value) || _.isNil(value))) {
    errors.push(`must be a number`)
  }

  if (columnSchema.type == Roast.boolean && !(_.isBoolean(value) || _.isNil(value))) {
    errors.push(`must be a boolean`)
  }

  return errors
}


function tableErrors(tableSchema, record) {
  let errors = {}

  _.each(_.keys(tableSchema), col => {
    const colErrors = columnErrors(tableSchema[col], record[col])
    if (!_.isEmpty(colErrors)) {
      errors[col] = colErrors
    }
  })

  return errors
}


function applyDefaults(tableSchema, table, record) {
  let result = record

  _.each(_.keys(tableSchema), col => {
    const colDefault = tableSchema[col].default

    if (_.isNil(record[col]) && !_.isNil(colDefault)) {
      const val = _.isFunction(colDefault) ? colDefault(table) : colDefault
      result = {...result, [col]: val}
    }
  })

  return result
}


Roast.createRepo = schema => {

  function requireTable(table) {
    if (!schema[table]) {
      throw new Error(`Table doesn't exist '${table}'`)
    }
  }

  return {

    get(db, table, id) {
      requireTable(table)

      const record = db[table] && _.find(db[table], {id: id})

      if (!record) {
        throw new Error(`Record not found '${table}:${id}'`)
      }

      return {...record}
    },

    all(db, table, where) {
      requireTable(table)

      if (!db[table]) {
        return []
      }

      // Handle when 'where is not provided'
      if (_.isUndefined(where)) {
        return db[table]
      }

      if (!_.isFunction(where)) {
        throw new Error("The second parameter must be a function to filter on, or undefined")
      }

      return _.filter(db[table], where)
    },

    one(db, table, where) {
      const records = this.all(db, table, where)

      if (records.length == 0) {
        throw new Error(`Expected one, but found no records in '${table} matched the query.`)
      } else if (records.length > 1) {
        throw new Error(`Expected one, but found ${records.length} records in '${table} matched the query.`)
      }

      return records[0]
    },

    insert(db, table, record) {
      requireTable(table)

      record = applyDefaults(schema[table], db[table], record)

      const errors = tableErrors(schema[table], record)
      if (!_.isEmpty(errors)) {
        throw new Error(`Record invalid ${JSON.stringify(errors)}`)
      }

      db = insertRow(db, table, record)

      return [db, record]
    },

    delete(db, table, id) {
      requireTable(table)

      // Ensure that the record exists
      const previous = this.get(db, table, id)

      db = deleteRow(db, table, id)

      return [db, previous]
    },

    update(db, table, id, values) {
      requireTable(table)

      let record = this.get(db, table, id)

      const previous = record

      record = {...record, ...values}
      record = applyDefaults(schema[table], db[table], record)

      const errors = tableErrors(schema[table], record)
      if (!_.isEmpty(errors)) {
        throw new Error(`Record invalid ${JSON.stringify(errors)}`)
      }

      db = setRow(db, table, id, record)

      return [db, record]
    },

    insert_(db, table, record) {
      return this.insert(db, table, record)[0]
    },

    delete_(db, table, id) {
      return this.delete(db, table, id)[0]
    },

    update_(db, table, id, values) {
      return this.update(db, table, id, values)[0]
    }

  }
}


module.exports = Roast