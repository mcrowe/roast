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

var Repo = Roast.createRepo({
  users: {
    id: { type: Roast.integer, null: false, default: Roast.autoIncrement },
    firstName: { type: Roast.string, null: false },
    lastName: { type: Roast.string },
    age: { type: Roast.integer, default: 0 }
  }
});

describe('ReduxRoast', function () {

  it('reduces transaction actions', function () {
    var db0 = {};

    var _Repo$insert = Repo.insert(db0, 'users', { firstName: 'Mitch' });

    var _Repo$insert2 = _slicedToArray(_Repo$insert, 2);

    var db1 = _Repo$insert2[0];
    var user1 = _Repo$insert2[1];

    var tx = Roast.transaction(db0, db1);

    assert.deepEqual(db1, ReduxRoast.reducer({}, { type: 'ROAST.TX', tx: tx }));
  });

  it('creates transaction actions', function () {
    var db0 = {};

    var _Repo$insert3 = Repo.insert(db0, 'users', { firstName: 'Mitch' });

    var _Repo$insert4 = _slicedToArray(_Repo$insert3, 2);

    var db1 = _Repo$insert4[0];
    var user1 = _Repo$insert4[1];

    var tx = [{ action: 'insert', table: 'users', record: { id: 1, age: 0, firstName: 'Mitch' } }];
    assert.deepEqual({ type: 'ROAST.TX', tx: tx }, ReduxRoast.transaction(db0, db1));
  });

  it('creates synchronizing transaction actions', function (done) {
    var db0 = {};

    var _Repo$insert5 = Repo.insert(db0, 'users', { firstName: 'Mitch' });

    var _Repo$insert6 = _slicedToArray(_Repo$insert5, 2);

    var db1 = _Repo$insert6[0];
    var user1 = _Repo$insert6[1];

    var dispatches = [];

    function successSync(action) {
      return Promise.resolve();
    }
    function failureSync(action) {
      return Promise.reject();
    }

    function dispatch(action) {
      dispatches.push(action);
    }

    var tx = [{ action: 'insert', table: 'users', record: { id: 1, age: 0, firstName: 'Mitch' } }];

    var action = ReduxRoast.syncTransaction(successSync)(db0, db1)(dispatch);
    assert.deepEqual({ type: 'ROAST.TX', tx: tx }, action);
    assert.equal(0, dispatches.length);

    action = ReduxRoast.syncTransaction(failureSync)(db0, db1)(dispatch);
    assert.deepEqual({ type: 'ROAST.TX', tx: tx }, action);

    setTimeout(function () {
      assert.equal(1, dispatches.length);
      done();
    }, 0);
  });
});