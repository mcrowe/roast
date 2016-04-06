const assert = require('assert'),
      Roast = require('../build/roast'),
      ReduxRoast = require('../build/redux-roast')


describe('ReduxRoast.Reducer', () => {

  it('works', () => {

    const Repo = Roast.createRepo({
      users: {
        id: {type: Roast.integer, null: false, default: Roast.autoIncrement},
        firstName: {type: Roast.string, null: false},
        lastName: {type: Roast.string},
        age: {type: Roast.integer, default: 0}
      }
    })

    const reducer = ReduxRoast.Reducer(Repo)

    assert.deepEqual({}, reducer({}, { type: 'other' }));

    assert.deepEqual({ a: 1 }, reducer({}, { type: 'ROAST.SET', db: { a: 1 } }));


  })
})

describe('ReduxRoast.ActionCreators', () => {

  it('works', () => {

    const Repo = Roast.createRepo({
      users: {
        id: {type: Roast.integer, null: false, default: Roast.autoIncrement},
        firstName: {type: Roast.string, null: false},
        lastName: {type: Roast.string},
        age: {type: Roast.integer, default: 0}
      }
    })

    let actions = ReduxRoast.ActionCreators(Repo)

    let dispatchedActions = []

    function dispatch(action) { dispatchedActions.push(action) }
    function getState() { return {roast: {}} }

    const [db1, user1] = actions.insert('users', {firstName: 'John'})(dispatch, getState)

    assert.deepEqual( {id: 1, firstName: 'John', age: 0}, user1 )
    assert.deepEqual( {users: [user1]}, db1 )

    assert.equal( 1, dispatchedActions.length )
    assert.equal( 'ROAST.INSERT', dispatchedActions[0].type )

    // Failing sync
    // function failingSync(action) { return Promise.reject() }
    // actions = ReduxRoast.ActionCreators(Repo, () => Promise.reject())

    // const [db1, user1] = actions.insert('users', {firstName: 'John'})(dispatch, getState)



  })
})