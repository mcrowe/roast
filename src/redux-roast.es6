'use strict'

const Roast = require('./roast')

const ReduxRoast = {}

// Write reducer, and action creators

ReduxRoast.Reducer = Repo => (state = {}, action) => {
  let db, record

  switch (action.type) {
    case 'ROAST.SET':
      return action.db
    case 'ROAST.INSERT':
      return Repo.insert(state, action.table, action.record)[0]

    default:
      return state
  }
}

const noopSync = (action) => {
  return Promise.resolve()
}

ReduxRoast.ActionCreators = (Repo, sync = noopSync) => {
  return {
    insert: (table, params) => (dispatch, getState) => {
      const db0 = getState().roast

      const [db1, record] = Repo.insert(db0, table, params)

      const action = {type: 'ROAST.INSERT', table: 'users', record: record}

      dispatch(action)

      sync(action).catch(() =>
        // Rever changes if sync fails.
        dispatch({type: 'ROAST.SET', db: db0})
      )

      return [db1, record]
    }
  }
}

module.exports = ReduxRoast
