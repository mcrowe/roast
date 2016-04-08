# Roast

Immutable, transactional, database in pure Javascript.
Redux compatibile, using ReduxRoast.

## Warning: This library is still experimental.

## TODO
- Add update_, insert_, delete_ variants that only return the db so we don't need to destructure so much.
  db = Repo.delete_(db, 'users', 1)
  [db, user] = Repo.delete(db, 'users', 1)
- Extract repo methods into top-level functions (e.g. get(schema, db, table, id))
- Extract Transaction and Repo functionality into separate files
- Remove dependency on lodash
- Release as a proper npm module
- Extract ReduxRoast into its own module?
