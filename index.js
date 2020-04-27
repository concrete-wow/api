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
    description: `Factually link reputation API, produced by Team [Concrete Wow](https://github.com/concrete-wow) for the
    [EUvsVirus](https://euvsvirus.org/) hacakathon on 24-26th April 2020. See [Factually.dev](https://www.factually.dev) for info and example
    implementation`
  },
  // host:'api.factually.dev', // Host (optional)
  // basePath: '/', // Base path (optional)
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
 *         description: URL which forms the basis of this reputation (may be different to request URL)
 *       safe:
 *         type: string
 *         description: Simple string which describes what we know about the site (if anything)
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
 *         type: string
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
 *         description: API key needed to authenticate priviledged operations
 *         required: true
 *         type: string
 *       url:
 *         description: URL we want to report
 *         required: true
 *         type: string
 *         format: url
 *         example: https://faknewssite.nodomain/drinkbleach.html
 *       rating:
 *         description: The value to assign to this URL - positive (good) or negative (bad)
 *         required: true
 *         type: integer
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
 *     description: Returns the reputation of the passed URL (if known). Three return values are possible
 *       (see 'safe' property of Reputation response) which enumerate known bad, known good, or just unknown
 *       reputation sites. The diameter result may tell you something about the safety of this judgment, but
 *       at present the implementation is in flux so is best ignored.
 *     tags:
 *       - getting
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
  if (protocol == null && host == null){
    res.status(400).json({message: 'malformed url'});
  }
  else{
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
  }
});

/**
 * @swagger
 *
 * /report:
 *   post:
 *     description: Flags a report about a URL, designed to collate information for a human
 *       to review and insert into the database of good or bad sites manually via a magic process
 *       that hasn't been designed or coded yet. At present this is just a stub which does nothing!
 *     tags:
 *       - reporting
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
 *     description: Directly insert a new 'seed' site into the database, designed
 *       for apps used by human maintainers to insert new known "good" or "bad" sites
 *       into the database. Once inserted, crawler will do it's work and start to find
 *       internal links and related sites.
 *     tags:
 *       - maintenance
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
    dbRating = Math.sign(parseInt(rating))*10000;
    db.none('insert into url (url, domain, crawler_rank) values ($1, $2, $3)', [url, domain, dbRating])
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
