const fs = require('fs');
let localConfig;
try {
  localConfig = require('./config.local.js');
  console.info('Using Local config from config.local.js', localConfig);
} catch (err) {
  console.info('No local config file, using environment');
}

const config = localConfig || {
  "production": {

  },
  "development": {

  },
  "all": {
    api_key: process.env.APIKEY,
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: {
        key: process.env.CLIENT_KEY + '\n',
        cert: process.env.CLIENT_CERT + '\n',
        ca: process.env.CA_CERT + '\n',
        rejectUnauthorized: false
      }

    }
  }
};

gcloud_patch = (process.env.INSTANCE_CONNECTION_NAME) ? {
    database: {
      host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }
  } :
  {};

exports = module.exports = { ...config['all'], ...config[process.env.NODE_ENV || 'development'], ...gcloud_patch };
