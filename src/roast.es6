'use strict'

const _ = require('lodash')
const uuid = require('uuid')

const Roast = {}

Roast.string = 'string'
Roast.integer = 'integer'
Roast.number = 'number'

Roast.autoIncrement = function(table) {
  const max = _.maxBy(table, 'id')
  return max ? max.id + 1 : 1
}

Roast.uuid = function(_table) {
  return uuid.v4()
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


class Repo {

  constructor(schema) {
    this.schema = schema
    this.db = {}
  }

  get(table, id) {
    this._requireTable(table)

    const record = this.db[table] && _.find(this.db[table], {id: id})

    if (!record) {
      throw new Error(`Record not found '${table}:${id}'`)
    }

    return {...record}
  }


  insert(table, record) {
    this._requireTable(table)

    record = applyDefaults(this.schema[table], this.db[table], record)

    const errors = tableErrors(this.schema[table], record)
    if (!_.isEmpty(errors)) {
      throw new Error(`Record invalid ${JSON.stringify(errors)}`)
    }

    if (this.db[table]) {
      this.db[table] = this.db[table].concat(record)
    } else {
      this.db[table] = [record]
    }


    return _.clone(record)
  }

  delete(table, id) {
    this._requireTable(table)

    // Ensure that the record exists
    const previous = this.get(table, id)

    this.db[table] = _.reject(this.db[table], {id: id})

    return previous
  }

  update(table, id, values) {
    this._requireTable(table)

    let record = this.get(table, id)

    const previous = record

    record = {...record, ...values}
    record = applyDefaults(this.schema[table], this.db[table], record)

    const errors = tableErrors(this.schema[table], record)
    if (!_.isEmpty(errors)) {
      throw new Error(`Record invalid ${JSON.stringify(errors)}`)
    }

    this.db[table] = _.map(this.db[table], row =>
      row.id == id ? record : row
    )

    return record
  }

  all(table, where) {
    this._requireTable(table)

    if (!this.db[table]) {
      return []
    }

    // Handle when 'where is not provided'
    if (_.isUndefined(where)) {
      return this.db[table]
    }

    if (!_.isFunction(where)) {
      throw new Error("The second parameter must be a function to filter on, or undefined")
    }

    return _.filter(this.db[table], where)
  }

  one(table, where) {
    const records = this.all(table, where)

    if (records.length == 0) {
      throw new Error(`Expected one, but found no records in '${table} matched the query.`)
    } else if (records.length > 1) {
      throw new Error(`Expected one, but found ${records.length} records in '${table} matched the query.`)
    }

    return records[0]
  }

  _requireTable(table) {
    if (!this.schema[table]) {
      throw new Error(`Table doesn't exist '${table}'`)
    }
  }

}


Roast.createRepo = function(schema) {
  return new Repo(schema)
}

module.exports = Roast
