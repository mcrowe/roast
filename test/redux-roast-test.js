'use strict';

var _slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var assert = require('assert'),
    Roast = require('../build/roast'),
    ReduxRoast = require('../build/redux-roast');

describe('ReduxRoast.Reducer', function () {

  it('works', function () {

    var Repo = Roast.createRepo({
      users: {
        id: { type: Roast.integer, null: false, default: Roast.autoIncrement },
        firstName: { type: Roast.string, null: false },
        lastName: { type: Roast.string },
        age: { type: Roast.integer, default: 0 }
      }
    });

    var reducer = ReduxRoast.Reducer(Repo);

    assert.deepEqual({}, reducer({}, { type: 'other' }));

    assert.deepEqual({ a: 1 }, reducer({}, { type: 'ROAST.SET', db: { a: 1 } }));
  });
});

describe('ReduxRoast.ActionCreators', function () {

  it('works', function () {

    var Repo = Roast.createRepo({
      users: {
        id: { type: Roast.integer, null: false, default: Roast.autoIncrement },
        firstName: { type: Roast.string, null: false },
        lastName: { type: Roast.string },
        age: { type: Roast.integer, default: 0 }
      }
    });

    var actions = ReduxRoast.ActionCreators(Repo);

    var dispatchedActions = [];

    function dispatch(action) {
      dispatchedActions.push(action);
    }
    function getState() {
      return { roast: {} };
    }

    var _actions$insert = actions.insert('users', { firstName: 'John' })(dispatch, getState);

    var _actions$insert2 = _slicedToArray(_actions$insert, 2);

    var db1 = _actions$insert2[0];
    var user1 = _actions$insert2[1];

    assert.deepEqual({ id: 1, firstName: 'John', age: 0 }, user1);
    assert.deepEqual({ users: [user1] }, db1);

    assert.equal(1, dispatchedActions.length);
    assert.equal('ROAST.INSERT', dispatchedActions[0].type);

    // Failing sync
    // function failingSync(action) { return Promise.reject() }
    // actions = ReduxRoast.ActionCreators(Repo, () => Promise.reject())

    // const [db1, user1] = actions.insert('users', {firstName: 'John'})(dispatch, getState)
  });
});