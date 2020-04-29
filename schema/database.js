const QueryFile = require('pg-promise').QueryFile;
const path = require('path');

function sql(file) {
    const fullPath = path.join(__dirname, file); // generating full path;
    return new QueryFile(fullPath, {minify: true});
}

var schema = {
  version: 2,
  versionQuery: "SELECT value from parameters where name = 'version'",
  create: sql('schema.sql'),
  update: (from, to) => sql(`update.${from}.${to}.sql`)
}

schema.updates = [];

exports = module.exports = schema
