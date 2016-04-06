'use strict';

var Roast = require('./roast');

var TRANSACTION_ACTION = 'ROAST.TX';

var ReduxRoast = {};

ReduxRoast.reducer = function () {
  var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case TRANSACTION_ACTION:
      return Roast.executeTransaction(state, action.tx);
    default:
      return state;
  }
};

ReduxRoast.transaction = function (fromDb, toDb) {
  return {
    type: TRANSACTION_ACTION,
    tx: Roast.transaction(fromDb, toDb)
  };
};

ReduxRoast.syncTransaction = function (sync) {
  return function (fromDb, toDb) {
    return function (dispatch) {
      var action = ReduxRoast.transaction(fromDb, toDb);

      // Try to synchronize.
      // If it fails, revert the transaction.
      sync(action).catch(function () {
        return dispatch(ReduxRoast.transaction(toDb, fromDb));
      });

      return action;
    };
  };
};

module.exports = ReduxRoast;