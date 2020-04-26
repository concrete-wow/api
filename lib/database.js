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

db.one(schema.versionQuery)
  .then(row => {
    if (parseInt(row.value) !== schema.version) {
      console.error(`database schema version error, code expects ${schema.version} but database is at ${row.value}`);
      process.exit(-1);
    } else
      console.info('in business');
  })
  .catch(err => {
    if (err.toString()
      .match(/relation "parameters" does not exist/)) {
      console.info('We have no database, lets have a go at making one...')
      db.none(schema.create)
        .then(() => db.one(schema.versionQuery))
        .then(row => {
          if (parseInt(row.value) === schema.version)
            console.info(`database created with schema version ${schema.version}`);
          else {
            console.error(`schema version ${row.value}????`);
            process.exit(-1);
          }
        })
        .catch(err => console.log(err));
    } else {
      console.error(err);
      process.exit(-1);
    }
  });

exports = module.exports = db;
