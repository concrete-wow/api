// grab the packages we need
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = process.env.PORT || 8080;

const config = require('./config.js');

const bodyParser = require('body-parser');

const swaggerJSDoc = require('swagger-jsdoc');

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
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

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
 *         example: https"//faknewssite.nodomain/drinkbleach.html
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
  const goodBadUgly = Math.floor(3 * Math.random());
  console.log(req.query);
  var result = {
    basisURL: req.query.url,
    safe: ['good', 'unknown', 'bad'][goodBadUgly],
    distance: parseInt((1 - goodBadUgly) * (Math.random() * 100))
  }
  res.setHeader('Content-Type', 'application/json');
  res.status(200)
    .send(JSON.stringify(result))
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
    if (Math.random() > 0.5){
      res.status(200)
      .send(JSON.stringify({ status: 'OK' }));
    }
    else {
      res.status(404)
        .send(JSON.stringify({ message: 'bad report for some reason' }));
    }
  } catch (err) {
    console.log('Error: ', err)
    next(err);
  };
});

app.get('/', (req, res, next) => res.redirect('/api-docs'));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
    console.log('Press Ctrl+C to quit.');
  });
}

exports = module.exports = app;
