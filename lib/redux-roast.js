'use strict';

var Roast = require('./roast');
var TRANSACTION_ACTION = 'ROAST.TX';

// Reducer that executes transactions when given transaction actions.
var reducer = function reducer() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case TRANSACTION_ACTION:
      return Roast.executeTransaction(state, action.tx);
    default:
      return state;
  }
};

// Basic transaction action creator.
var transaction = function transaction(fromDb, toDb) {
  return {
    type: TRANSACTION_ACTION,
    tx: Roast.transaction(fromDb, toDb)
  };
};

// Synchronizing transaction action creator.
//
// Creates a transaction action creator that attempts to synchronize the dispatched actions with
// some custom service. "sync" is a synchronizer function that accepts a transaction action, and
// returns a promise. If the returned promise is rejected, then the local transaction is reverted.
var syncTransaction = function syncTransaction(sync) {
  return function (fromDb, toDb) {
    return function (dispatch) {
      var action = transaction(fromDb, toDb);

      // Try to synchronize.
      // If it fails, revert the transaction.
      sync(action).catch(function () {
        return dispatch(transaction(toDb, fromDb));
      });

      return action;
    };
  };
};

module.exports = { reducer: reducer, transaction: transaction, syncTransaction: syncTransaction };