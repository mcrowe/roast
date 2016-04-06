'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var Roast = require('./roast');

var ReduxRoast = {};

// Write reducer, and action creators

ReduxRoast.Reducer = function (Repo) {
  return function () {
    var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var action = arguments[1];

    var db = void 0,
        record = void 0;

    switch (action.type) {
      case 'ROAST.SET':
        return action.db;
      case 'ROAST.INSERT':
        return Repo.insert(state, action.table, action.record)[0];

      default:
        return state;
    }
  };
};

var noopSync = function noopSync(action) {
  return Promise.resolve();
};

ReduxRoast.ActionCreators = function (Repo) {
  var sync = arguments.length <= 1 || arguments[1] === undefined ? noopSync : arguments[1];

  return {
    insert: function insert(table, params) {
      return function (dispatch, getState) {
        var db0 = getState().roast;

        var _Repo$insert = Repo.insert(db0, table, params);

        var _Repo$insert2 = _slicedToArray(_Repo$insert, 2);

        var db1 = _Repo$insert2[0];
        var record = _Repo$insert2[1];


        var action = { type: 'ROAST.INSERT', table: 'users', record: record };

        dispatch(action);

        sync(action).catch(function () {
          return(
            // Rever changes if sync fails.
            dispatch({ type: 'ROAST.SET', db: db0 })
          );
        });

        return [db1, record];
      };
    }
  };
};

module.exports = ReduxRoast;