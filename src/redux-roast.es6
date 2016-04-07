'use strict'

const Roast = require('./roast')
const TRANSACTION_ACTION = 'ROAST.TX'


// Reducer that executes transactions when given transaction actions.
const reducer = (state = {}, action) => {
  switch (action.type) {
    case TRANSACTION_ACTION:
      return Roast.executeTransaction(state, action.tx)
    default:
      return state
  }
}


// Basic transaction action creator.
const transaction = (fromDb, toDb) => {
  return {
    type: TRANSACTION_ACTION,
    tx: Roast.transaction(fromDb, toDb)
  }
}

// Synchronizing transaction action creator.
//
// Creates a transaction action creator that attempts to synchronize the dispatched actions with
// some custom service. "sync" is a synchronizer function that accepts a transaction action, and
// returns a promise. If the returned promise is rejected, then the local transaction is reverted.
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
