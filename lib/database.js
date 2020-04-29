const initOptions = {
  error: (err, e) => {
    //console.log('sql error: ', err, e.query);

    // See also: err, e.query, e.params, etc.
  }

};
const pgp = require('pg-promise')(initOptions);
const config = require('../config');
const schema = require('../schema/database.js');

const connection = {
  ...config.database
}
console.log('connection: ', connection)

const db = pgp(connection);
try {
  db.one(schema.versionQuery)
    .then(async row => {
      if (parseInt(row.value) !== schema.version) {
        console.log(`database schema version error, code expects ${schema.version} but database is at ${row.value}, trying to upgrade...`);
        await db.none(schema.update(row.value, schema.version));
        console.info(`database upgraded from ${row.value} -> ${schema.version}`);
      }
    })
    .catch(async err => {
      if (err.toString()
        .match(/relation "parameters" does not exist/)) {
        console.info('We have no database, lets have a go at making one...')
        await db.none(schema.create);
        if ((await db.one(schema.versionQuery)).value === schema.version){
           console.info(`database created with schema version ${schema.version}`);
        }
        else {
          throw new Error('database creation issue, got wrong version');
        }
      } else {
        throw err;
      }

    });
} catch (err) {
  console.error(err);
  process.exit(-1);
}
console.info('in business');

exports = module.exports = db;
