// grab the packages we need
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const app = express();
const urlParser = require('url');
const port = process.env.PORT || 8080;

const config = require('./config.js');

const bodyParser = require('body-parser');

const swaggerJSDoc = require('swagger-jsdoc');

const db = require('./lib/database.js');

const swaggerDefinition = {
  info: {
    // API informations (required)
    title: 'Factually.dev API', // Title (required)
    version: '0.0.1', // Version (required)
    description: 'News varacity API, see www.factually.dev', // Description (optional)
  },
  // host:'api.factually.dev', // Host (optional)
  basePath: '/', // Base path (optional)
};

const options = {
  swaggerDefinition,
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJSDoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(bodyParser.json())

/**
 * @swagger
 *
 * definitions:
 *   Reputation:
 *     type: object
 *     properties:
 *       basisURL:
 *         type: string
 *         description: basis of this reputation (may be different to request URL)
 *       safe:
 *         type: string
 *         enum: ["good", "unknown", "bad"]
 *       distance:
 *         type: integer
 *         description: graph distance from a known site, small numbers indicate a close relationship with a known good or bad site
 *   Report:
 *     type: object
 *     properties:
 *       url:
 *         description: URL we want to report
 *         required: true
 *         type: string
 *         format: url
 *         example: https:/faknewssite.nodomain/drinkbleach.html
 *       disposition:
 *         description: what we want to report
 *         required: true
 *         enum: ['falseBad', 'falseGood', 'missing']
 *         example: falseGood
 *       comments:
 *         type: string
 *         description: human readable description of why this report is being made
 *         required: true
 *         example: "drinking bleach wont make you better"
 *   NewSite:
 *     type: object
 *     properties:
 *       apiKey:
 *         description: API key
 *         required: true
 *         type: string
 *       url:
 *         description: URL we want to report
 *         required: true
 *         type: string
 *         format: url
 *         example: https://faknewssite.nodomain/drinkbleach.html
 *       rating:
 *         description: the value to assign to this URL
 *         required: true
 *         type: integer
 *         example: -65535
 *   Error:
 *     type: object
 *     properties:
 *       message:
 *         type: string
 *         description: Error message if things went wrong
 *         example: submission of falseGood report on on-existant URL
 *
 */

/**
 * @swagger
 *
 * /reputation:
 *   get:
 *     description: gets the reputation of a given URL
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: url
 *         description: The URL of the site we want to check
 *         in: query
 *         required: true
 *         type: string
 *         format: url
 *         example: https://www.bbc.co.uk/news/live/world-52424263
 *     responses:
 *       200:
 *         description: Reputation object
 *         schema:
 *           $ref: '#/definitions/Reputation'
 *       400:
 *         description: Request failed
 *         schema:
 *           $ref: '#/definitions/Error'
 */
app.get('/reputation', function (req, res, next) {
  const url = req.query.url;
  const { protocol, host } = req.query.url && urlParser.parse(req.query.url);
  db.one("select url, crawler_rank from url where domain ilike $1 LIMIT 1", [host])
    .then(row => {
            console.log('row', row);
      res.status(200)
        .json({
          basisURL: row.url,
          safe: ["bad", "unknown", "good"][Math.sign(row.crawler_rank) + 1],
          distance: row.crawler_rank
        })
    })
    .catch((err, e) => {
      console.log('err', err, err.query);
      res.status(200)
        .json({
          basisURL: `${protocol}//${host}`,
          safe: "unknown",
          distance: 0
        })
    })
});

/**
 * @swagger
 *
 * /report:
 *   post:
 *     description: flags a report about a URL
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: Report
 *         description: the report detail
 *         schema:
 *           $ref: '#/definitions/Report'
 *     responses:
 *       200:
 *         description: report suceeded
 *       400:
 *         description: Request failed
 *         schema:
 *           $ref: '#/definitions/Error'
 *       404:
 *         description: Report was 'falseGood', or 'falseBad' and URl not in database
 *         schema:
 *           $ref: '#/definitions/Error'
 */
app.post('/report', function (req, res, next) {
  try {
    res.setHeader('Content-Type', 'application/json');
    if (Math.random() > 0.5) {
      res.status(200)
        .send(JSON.stringify({ status: 'OK' }));
    } else {
      res.status(404)
        .send(JSON.stringify({ message: 'bad report for some reason' }));
    }
  } catch (err) {
    console.log('Error: ', err)
    next(err);
  };
});
/**
 * @swagger
 *
 * /insert:
 *   post:
 *     description: flags a report about a URL
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: NewSite
 *         description: Authenticated insertion request
 *         schema:
 *           $ref: '#/definitions/NewSite'
 *     responses:
 *       200:
 *         description: insert suceeded
 *       400:
 *         description: Request failed
 *         schema:
 *           $ref: '#/definitions/Error'
 *       403:
 *         description: auth issue
 *       404:
 *         description: Report was 'falseGood', or 'falseBad' and URl not in database
 *         schema:
 *           $ref: '#/definitions/Error'
 */
app.post('/insert', function (req, res, next) {
  const { apiKey, url, rating } = req.body;
  const domain = url && urlParser.parse(url)
    .hostname;

  if (apiKey !== config.api_key) {
    res.status(403)
      .json({ status: 'apiKey check failed' });
    return;
  } else if (url == null || rating == null || domain == null) {
    res.status(500)
      .json({ error: 'parameter error' });
  } else {
    db.none('insert into url (url, domain, crawler_rank) values ($1, $2, $3)', [url, domain, rating])
      .then(() => res.status(200)
        .json({ status: 'OK' }))
      .catch(err => res.status(500)
        .json({ error: err }));
  }
});
app.get('/', (req, res, next) => res.redirect('/api-docs'));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
    console.log('Press Ctrl+C to quit.');
  });
}

exports = module.exports = app;
