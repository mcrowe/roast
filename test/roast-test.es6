const assert = require('assert'),
      Roast = require('../lib')


const Repo = Roast.createRepo({
  users: {
    id: {type: Roast.integer, null: false, default: Roast.autoIncrement},
    firstName: {type: Roast.string, null: false},
    lastName: {type: Roast.string},
    age: {type: Roast.integer, default: 0}
  },
  comments: {
    id: {type: Roast.string, null: false, default: Roast.uuid},
    body: {type: Roast.string, null: false},
    user_id: {type: Roast.integer, null: false}
  }
})


describe('Roast', () => {

  it('can do CRUD, create transactions, and execute transactions', () => {
    let db0 = {}

    // INSERT

    let [db1, user1] = Repo.insert(db0, 'users', {firstName: 'Mitch'})

    assert.deepEqual({id: 1, age: 0, firstName: 'Mitch'}, user1)
    assert.deepEqual({users: [user1]}, db1)

    let [db2, user2] = Repo.insert(db1, 'users', {firstName: 'Mitch'})
    assert.deepEqual({id: 2, age: 0, firstName: 'Mitch'}, user2)
    assert.deepEqual({users: [user1, user2]}, db2)

    assert.throws(() => {
      Repo.insert(db2, 'users', {})
    }, /Record invalid/)


    // GET

    assert.deepEqual(user1, Repo.get(db2, 'users', 1))

    assert.throws(() => {
      Repo.get(db2, 'users', 3)
    }, /Record not found/)

    assert.throws(() => {
      Repo.get(db2, 'others', 3)
    }, /Table doesn't exist/)


    // ALL

    assert.throws(() => {
      Repo.all(db2, 'others')
    }, /Table doesn't exist/)

    assert.equal(2, Repo.all(db2, 'users').length)
    assert.equal(2, Repo.all(db2, 'users', u => true).length)
    assert.equal(0, Repo.all(db2, 'users', u => false).length)


    // ONE

    assert.throws(() => {
      Repo.one(db2, 'others')
    }, /Table doesn't exist/)

    assert.throws(() => {
      Repo.one(db2, 'users')
    }, /Expected one, but found 2 records/)

    assert.throws(() => {
      Repo.one(db2, 'users', u => false)
    }, /Expected one, but found no records/)

    assert.deepEqual( user1, Repo.one(db2, 'users', u => u.id == 1) )


    // DELETE

    let [db3, user3] = Repo.delete(db2, 'users', 2)

    assert.deepEqual(user2, user3)
    assert.deepEqual({users: [user1]}, db3)

    assert.throws(() => {
      Repo.delete(db3, 'users', 2)
    }, /Record not found/)

    assert.throws(() => {
      Repo.delete(db2, 'others', 2)
    }, /Table doesn't exist/)


    // UPDATE

    let [db4, user4] = Repo.update(db2, 'users', 1, {lastName: 'Crowe'})

    assert.equal('Crowe', user4.lastName)
    assert.deepEqual({users: [user4, user2]}, db4)

    assert.throws(() => {
      Repo.update(db2, 'users', 1, {firstName: null})
    }, /Record invalid/)

    assert.throws(() => {
      Repo.update(db2, 'others', 1, {firstName: null})
    }, /Table doesn't exist/)


    // UUID default
    let [db5, comment1] = Repo.insert(db4, 'comments', {body: 'blah blah blah', user_id: user1.id})
    assert.equal(36, comment1.id.length)


    // TRANSACTION

    assert.deepEqual( [{action: 'insert', record: user2, table: 'users'}], Roast.transaction(db1, db2) )
    assert.deepEqual( [{action: 'delete', id: 2, table: 'users'}], Roast.transaction(db2, db3) )
    assert.deepEqual( [{action: 'set', id: 1, record: user4, table: 'users'}], Roast.transaction(db2, db4) )
    assert.deepEqual( [{action: 'set', id: 1, record: user4, table: 'users'}, {action: 'insert', record: comment1, table: 'comments'}], Roast.transaction(db2, db5) )


    // EXECUTING TRANSACTIONS

    const tx = Roast.transaction(db2, db5)

    assert.deepEqual( db5, Roast.executeTransaction(db2, tx) )

  })

  it('has shorthand methods for updaters', () => {
    let db = {}

    db = Repo.insert_(db, 'users', {firstName: 'Mitch'})
    db = Repo.update_(db, 'users', 1, {firstName: 'Bob'})
    db = Repo.delete_(db, 'users', 1)

    assert.deepEqual({users: []}, db)
  })

})

