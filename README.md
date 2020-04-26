# API
This is the query API which returns the reputation of a page

## Usage

See [Database Connection](#database-connection) to understand why running the code is the least of your problems.

```
yarn install
yarn start
```

Browse to localhost:8080 for interactive documentation.

## Running on other ports

```
export PORT=8888
yarn start
```

## Docker

There is a Dockerfile, and it works well given that the api is a pure stateless engine insert and retrieve results

## Database Connection

This is the hard bit. Like all the Concrete Wow stuff, crawler is a stateless container that can run anywhere on the Internet.

It needs a secure Postgres instance, for which we use client certificates in production, this is the environment that it needs (spelled in bash):
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

Alternatively, for hosting on GCP, you can use their Cloud SQL Connector to reduce the number of secrets (especially the pesky multi-line PEM literals which it is impossible to get into Cloud Run without using a proprietary API):
```
export INSTANCE_CONNECTION_NAME="database:ProjectID:databasename"
export DB_NAME="concretewow"
export DB_USER="postgres"
export DB_PASSWORD="furbleflab"
export APIKEY="flabfurble"
```
