# Roast

ReactRoast

const Repo = Roast.createStore({
  ...
})

// Synchronize transactions with the server
// If it can't be synchronized, revert it.
// TODO: We may want to show a message to the user when there is an error.
Repo.addTransactionListener(tx => {
  synchronizeTransaction(tx).catch(error =>
    Repo.revertTransaction(tx)
  )
})

ReactDom.render(
  <Provider repo={Repo}>
    <App />
  </Provider>
, document.getElementById('app'))


const App = {...}

function mapRepoToProps(repo, ownProps) {
  return {
    ...
  }
}

connect(mapRepoToProps)(App)

// Or... maybe we just make Repo globally accessible, as it is in Elixir. Not really a big deal to
// have global access to the database.
