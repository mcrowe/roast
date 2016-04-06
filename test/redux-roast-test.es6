const assert = require('assert'),
      Roast = require('../build/roast'),
      ReduxRoast = require('../build/redux-roast')


const Repo = Roast.createRepo({
  users: {
    id: {type: Roast.integer, null: false, default: Roast.autoIncrement},
    firstName: {type: Roast.string, null: false},
    lastName: {type: Roast.string},
    age: {type: Roast.integer, default: 0}
  }
})


describe('ReduxRoast', () => {

  it('reduces transaction actions', () => {
    let db0 = {}
    let [db1, _user1] = Repo.insert(db0, 'users', {firstName: 'Mitch'})
    const tx = Roast.transaction(db0, db1)

    assert.deepEqual(db1, ReduxRoast.reducer({}, { type: 'ROAST.TX', tx: tx }))
  })

  it('creates transaction actions', () => {
    let db0 = {}
    let [db1, _user1] = Repo.insert(db0, 'users', {firstName: 'Mitch'})

    const tx = [{action: 'insert', table: 'users', record: {id: 1, age: 0, firstName: 'Mitch'}}]
    assert.deepEqual( {type: 'ROAST.TX', tx: tx}, ReduxRoast.transaction(db0, db1) )
  })

  it('creates synchronizing transaction actions', (done) => {
    let db0 = {}
    let [db1, _user1] = Repo.insert(db0, 'users', {firstName: 'Mitch'})

    let dispatches = []

    function successSync(action) { return Promise.resolve() }
    function failureSync(action) { return Promise.reject() }

    function dispatch(action) {
      dispatches.push(action)
    }

    let tx = [{action: 'insert', table: 'users', record: {id: 1, age: 0, firstName: 'Mitch'}}]

    let action = ReduxRoast.syncTransaction(successSync)(db0, db1)(dispatch)
    assert.deepEqual( {type: 'ROAST.TX', tx: tx}, action )
    assert.equal(0, dispatches.length)

    action = ReduxRoast.syncTransaction(failureSync)(db0, db1)(dispatch)
    assert.deepEqual( {type: 'ROAST.TX', tx: tx}, action )

    setTimeout(() => {
      assert.equal(1, dispatches.length)
      done()
    }, 0)
  })

})