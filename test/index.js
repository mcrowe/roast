var assert = require('assert')
    Roast = require('../src/roast')


// function spy() {
//   let calls = 0
//   l

//   let fn = function(arg) {

//   }


// }


describe('Roast', function() {

  it('works', function() {
    var Repo = Roast.createRepo({
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

    // All methods throw if the given table doesn't exist

    // var tableError = /Table doesn't exist 'pages'/

    // assert.throws(() => {
    //   Repo.all('pages')
    // }, tableError)

    // assert.throws(() => {
    //   Repo.one('pages')
    // }, tableError)

    // assert.throws(() => {
    //   Repo.get('pages')
    // }, tableError)

    // assert.throws(() => {
    //   Repo.insert('pages', {})
    // }, tableError)

    // assert.throws(() => {
    //   Repo.update('pages', 1, {})
    // }, tableError)

    // assert.throws(() => {
    //   Repo.delete('pages', 1)
    // }, tableError)

    // assert.deepEqual([], Repo.all('users'))

    // assert.throws(() => {
    //   Repo.insert('users', {})
    // }, /Record invalid/)

    var userA = Repo.insert('users', {firstName: 'Mitch'})
    var userB = Repo.insert('users', {firstName: 'Bob'})
    var userC = Repo.insert('users', {firstName: 'Bob', id: 5})

    // Insert works
    assert.equal(1, userA.id)
    assert.equal('Mitch', userA.firstName)
    assert.equal(0, userA.age)
    assert.equal(2, userB.id)
    assert.equal(5, userC.id)

    // var commentA = Repo.insert('comments', {body: "my comment", user_id: 1})
    // var commentB = Repo.insert('comments', {body: "my comment", user_id: 1})

    // // Roast.uuid assigns a random UUID
    // assert.equal(36, commentA.id.length)
    // assert.notEqual(commentA.id, commentB.id)

    // // ALL returns all records
    // assert.equal(3, Repo.all('users').length)

    // // ALL can filter records
    // assert.equal(2, Repo.all('users', u => u.firstName == 'Bob').length)
    // assert.equal(0, Repo.all('users', u => u.firstName == 'John').length)

    // // ONE throws if there is not exactly 1 result
    // assert.throws(() => {
    //   Repo.one('users')
    // }, /Expected one, but found 3 records/)
    // assert.throws(() => {
    //   Repo.one('users', u => u.firstName == 'Bob')
    // }, /Expected one, but found 2 records/)

    // // ONE allows filtering
    // assert.deepEqual({age: 0, firstName: "Mitch", id: 1}, Repo.one('users', u => u.firstName == 'Mitch'))

    // // GET gets a record by id
    // assert.deepEqual(commentA, Repo.get('comments', commentA.id))

    // // GET throws when not found
    // assert.throws(() => {
    //   Repo.get('comments', 'not-an-id')
    // }, /Record not found/)

    // // UPDATE updates the given fields
    // Repo.update('comments', commentA.id, {body: 'New body'})
    // assert.equal('New body', Repo.get('comments', commentA.id).body)

    // // UPDATE applies defaults
    // Repo.update('users', userA.id, {age: null})
    // assert.equal(0, Repo.get('users', userA.id).age)

    // // UPDATE throws if updated record is invalid
    // assert.throws(() => {
    //   Repo.update('users', userA.id, {age: "not an int"})
    // }, /Record invalid/)

    // // DELETE deletes a record by id
    // Repo.delete('users', userC.id)
    // assert.equal(2, Repo.all('users').length)

    // // DELETE throws if the record doesn't exist
    // assert.throws(() => {
    //   Repo.delete('users', userC.id)
    // }, /Record not found/)


    // var transactions = []

    // // Listening to transactions
    // Repo.addTransactionListener(transaction => {
    //   transactions.push(transaction)
    // })

    // Repo.insert('users', {firstName: 'Kever'})
    // Repo.delete('users', userB.id)
    // Repo.update('users', userA.id, {firstName: 'Dool'})

    // assert.equal(3, transactions.length)
    // assert.deepEqual([{action: 'insert', table: 'users', record: {age: 0, firstName: "Kever", id: 3}}], transactions[0].changes)
    // assert.deepEqual([{action: 'delete', table: 'users', id: userB.id, record: {age: 0, firstName: "Bob", id: 2}}], transactions[1].changes)
    // assert.deepEqual([{action: 'update', table: 'users', id: userA.id, record: {age: 0, firstName: "Dool", id: 1}, previous: {age: 0, firstName: "Mitch", id: 1}}], transactions[2].changes)

    // Applying changes

    // Reverting changes

  })

})