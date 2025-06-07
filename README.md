# MysqlDBConnection for `@ticatec/node-common-library`

This package provides a MySQL database connection and connection pool implementation compatible with the `DBConnection` and `DBFactory` interfaces from [`@ticatec/node-common-library`](https://www.npmjs.com/package/@ticatec/node-common-library).

It uses the `mysql2/promise` library to support asynchronous database operations with connection pooling, transaction handling, and flexible query execution.

---

## Features

* Supports transaction management (`BEGIN` / `COMMIT` / `ROLLBACK`)
* Supports query, insert, update, delete SQL operations
* Automatically maps column metadata to `Field` objects
* Connection pooling using `mysql2`'s `createPool`
* Structured and extensible design with clean interface boundaries

---

## Installation

```bash
npm install mysql2 @ticatec/node-common-library @ticatec/mysql-common-library
```

---

## Usage

### Initialize Connection Pool

```ts
import { initializeMySQL } from './MysqlDBConnection';

const dbFactory = initializeMySQL({
  host: 'localhost',
  user: 'root',
  database: 'your_database',
  password: 'your_password',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
});
```

### Create a Connection and Perform Queries

```ts
const conn = await dbFactory.createDBConnection();

try {
  await conn.beginTransaction();

  const result = await conn.fetchData('SELECT * FROM users WHERE id = ?', [1]);
  console.log(result.rows);

  await conn.commit();
} catch (err) {
  await conn.rollback();
  console.error('Transaction failed:', err);
} finally {
  await conn.close();
}
```

---

## API Reference

### `MysqlDBConnection`

Implements the `DBConnection` interface.

* `beginTransaction()`: Starts a transaction
* `commit()`: Commits the current transaction
* `rollback()`: Rolls back the transaction
* `executeUpdate(sql, params)`: Executes SQL update and returns affected row count
* `fetchData(sql, params)`: Executes SQL query and returns rows and fields
* `insertRecord(sql, params)`: Inserts a row and returns affected row count
* `updateRecord(sql, params)`: Updates a row and returns affected row count
* `deleteRecord(sql, params)`: Deletes a row and returns affected row count
* `getFields(result)`: Returns metadata for result fields
* `getFirstRow(result)`: Returns the first row of result (as nested object)
* `getRowSet(result)`: Returns all result rows
* `getAffectRows(result)`: Returns number of affected rows

### `MysqlDBFactory`

Implements the `DBFactory` interface.

* `createDBConnection()`: Acquires a new `MysqlDBConnection` from the pool

### `initializeMySQL(config): DBFactory`

Initializes and returns a `MysqlDBFactory` instance using the provided pool configuration (`mysql2` style `PoolOptions`).

---

## Type Support

* Uses `mysql2/promise` for async/await style DB operations
* `Field` and `FieldType` come from `@ticatec/node-common-library`
* Column type defaults to `FieldType.Text` (can be customized via `getFieldType()` override)

---

## License

MIT License

## Contact

huili.f@gmail.com

https://github.com/ticatec/mysql-common-library