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
    Roast = require('../lib');

var Repo = Roast.createRepo({
  users: {
    id: { type: Roast.integer, null: false, default: Roast.autoIncrement },
    firstName: { type: Roast.string, null: false },
    lastName: { type: Roast.string },
    age: { type: Roast.integer, default: 0 }
  },
  comments: {
    id: { type: Roast.string, null: false, default: Roast.uuid },
    body: { type: Roast.string, null: false },
    user_id: { type: Roast.integer, null: false }
  }
});

describe('Roast', function () {

  it('can do CRUD, create transactions, and execute transactions', function () {
    var db0 = {};

    // INSERT

    var _Repo$insert = Repo.insert(db0, 'users', { firstName: 'Mitch' });

    var _Repo$insert2 = _slicedToArray(_Repo$insert, 2);

    var db1 = _Repo$insert2[0];
    var user1 = _Repo$insert2[1];

    assert.deepEqual({ id: 1, age: 0, firstName: 'Mitch' }, user1);
    assert.deepEqual({ users: [user1] }, db1);

    var _Repo$insert3 = Repo.insert(db1, 'users', { firstName: 'Mitch' });

    var _Repo$insert4 = _slicedToArray(_Repo$insert3, 2);

    var db2 = _Repo$insert4[0];
    var user2 = _Repo$insert4[1];

    assert.deepEqual({ id: 2, age: 0, firstName: 'Mitch' }, user2);
    assert.deepEqual({ users: [user1, user2] }, db2);

    assert.throws(function () {
      Repo.insert(db2, 'users', {});
    }, /Record invalid/);

    // GET

    assert.deepEqual(user1, Repo.get(db2, 'users', 1));

    assert.throws(function () {
      Repo.get(db2, 'users', 3);
    }, /Record not found/);

    assert.throws(function () {
      Repo.get(db2, 'others', 3);
    }, /Table doesn't exist/);

    // ALL

    assert.throws(function () {
      Repo.all(db2, 'others');
    }, /Table doesn't exist/);

    assert.equal(2, Repo.all(db2, 'users').length);
    assert.equal(2, Repo.all(db2, 'users', function (u) {
      return true;
    }).length);
    assert.equal(0, Repo.all(db2, 'users', function (u) {
      return false;
    }).length);

    // ONE

    assert.throws(function () {
      Repo.one(db2, 'others');
    }, /Table doesn't exist/);

    assert.throws(function () {
      Repo.one(db2, 'users');
    }, /Expected one, but found 2 records/);

    assert.throws(function () {
      Repo.one(db2, 'users', function (u) {
        return false;
      });
    }, /Expected one, but found no records/);

    assert.deepEqual(user1, Repo.one(db2, 'users', function (u) {
      return u.id == 1;
    }));

    // DELETE

    var _Repo$delete = Repo.delete(db2, 'users', 2);

    var _Repo$delete2 = _slicedToArray(_Repo$delete, 2);

    var db3 = _Repo$delete2[0];
    var user3 = _Repo$delete2[1];

    assert.deepEqual(user2, user3);
    assert.deepEqual({ users: [user1] }, db3);

    assert.throws(function () {
      Repo.delete(db3, 'users', 2);
    }, /Record not found/);

    assert.throws(function () {
      Repo.delete(db2, 'others', 2);
    }, /Table doesn't exist/);

    // UPDATE

    var _Repo$update = Repo.update(db2, 'users', 1, { lastName: 'Crowe' });

    var _Repo$update2 = _slicedToArray(_Repo$update, 2);

    var db4 = _Repo$update2[0];
    var user4 = _Repo$update2[1];

    assert.equal('Crowe', user4.lastName);
    assert.deepEqual({ users: [user4, user2] }, db4);

    assert.throws(function () {
      Repo.update(db2, 'users', 1, { firstName: null });
    }, /Record invalid/);

    assert.throws(function () {
      Repo.update(db2, 'others', 1, { firstName: null });
    }, /Table doesn't exist/);

    // UUID default

    var _Repo$insert5 = Repo.insert(db4, 'comments', { body: 'blah blah blah', user_id: user1.id });

    var _Repo$insert6 = _slicedToArray(_Repo$insert5, 2);

    var db5 = _Repo$insert6[0];
    var comment1 = _Repo$insert6[1];

    assert.equal(36, comment1.id.length);

    // TRANSACTION

    assert.deepEqual([{ action: 'insert', record: user2, table: 'users' }], Roast.transaction(db1, db2));
    assert.deepEqual([{ action: 'delete', id: 2, table: 'users' }], Roast.transaction(db2, db3));
    assert.deepEqual([{ action: 'set', id: 1, record: user4, table: 'users' }], Roast.transaction(db2, db4));
    assert.deepEqual([{ action: 'set', id: 1, record: user4, table: 'users' }, { action: 'insert', record: comment1, table: 'comments' }], Roast.transaction(db2, db5));

    // EXECUTING TRANSACTIONS

    var tx = Roast.transaction(db2, db5);
    assert.deepEqual(db5, Roast.executeTransaction(db2, tx));
  });
});