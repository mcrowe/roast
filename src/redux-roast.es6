'use strict'
const Roast = require('./roast')
const TRANSACTION_ACTION = 'ROAST.TX'


const reducer = (state = {}, action) => {
  switch (action.type) {
    case TRANSACTION_ACTION:
      return Roast.executeTransaction(state, action.tx)
    default:
      return state
  }
}


const transaction = (fromDb, toDb) => {
  return {
    type: TRANSACTION_ACTION,
    tx: Roast.transaction(fromDb, toDb)
  }
}


const syncTransaction = sync => (fromDb, toDb) => dispatch => {
  const action = transaction(fromDb, toDb)

  // Try to synchronize.
  // If it fails, revert the transaction.
  sync(action).catch(() =>
    dispatch(transaction(toDb, fromDb))
  )

  return action
}


module.exports = {reducer, transaction, syncTransaction}
