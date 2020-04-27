# API
This is the query API which returns the reputation of a page. Interactive swagger docs and tryout at [api.factually.dev](https://api.factually.dev/api-docs).

## Running Locally

See [Database Connection](#database-connection) below for environment that you will need in order to connect the API to it's database.

```
yarn install
yarn start
```

Once started, the API will connect to the database server and check the database is present, if:

* Database tables are present but schema version, as represented by a version [name, value] pair in the parameters table, is wrong then the server will exit. You will need to (manually for now) upgrade the schema, or just drop the tables in which case they will be re-created (empty).
* Database tables are not present, then the server will create them according to the schema in `schema/schema.sql` and start serving based on an empty database.

Browse to localhost:8080 for interactive documentation.

## Running on other ports

```
export PORT=8888
yarn start
```

## Docker

There is a Dockerfile, optimised for size based on alpine. This is properly stateless, no volume mounts, just exposes the API on whatever port you tell it to via 'PORT' environment variable so invoke with your favourite command line or orchestration file (none provided). Can be run locally or on cloud container services provided you can sort out the environment for the database connection (see below).

## Database Connection

This is the hard bit. Like all the ConcreteWow stuff, the api is a stateless container that can run anywhere on the Internet.

It needs a secure Postgres instance, for which we use client certificates, this is the environment that it needs (spelled in bash, substitute your own secure values):
```
export CLIENT_CERT="-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----"
export CLIENT_KEY="-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----"
export CA_CERT="-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----"
export DB_HOST="1.2.3.4"
export DB_PORT="5432"
export DB_NAME="concretewow"
export DB_USER="postgres"
export DB_PASSWORD="furbleflab"
export APIKEY="flabfurble"
```

Alternatively, for hosting on GCP (e.g. Cloud Run) you can use their Cloud SQL Connector to reduce the number of secrets (especially the pesky multi-line PEM literals which it is impossible to get into Cloud Run without using a proprietary API):
```
export INSTANCE_CONNECTION_NAME="database:ProjectID:databasename"
export DB_NAME="concretewow"
export DB_USER="postgres"
export DB_PASSWORD="furbleflab"
export APIKEY="flabfurble"
```
