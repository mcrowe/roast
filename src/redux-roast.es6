'use strict'

const Roast = require('./roast')

const TRANSACTION_ACTION = 'ROAST.TX'

const ReduxRoast = {}

ReduxRoast.reducer = (state = {}, action) => {
  switch (action.type) {
    case TRANSACTION_ACTION:
      return Roast.executeTransaction(state, action.tx)
    default:
      return state
  }
}


ReduxRoast.transaction = (fromDb, toDb) => {
  return {
    type: TRANSACTION_ACTION,
    tx: Roast.transaction(fromDb, toDb)
  }
}


ReduxRoast.syncTransaction = sync => (fromDb, toDb) => dispatch => {
  const action = ReduxRoast.transaction(fromDb, toDb)

  // Try to synchronize.
  // If it fails, revert the transaction.
  sync(action).catch(() =>
    dispatch(ReduxRoast.transaction(toDb, fromDb))
  )

  return action
}


module.exports = ReduxRoast
