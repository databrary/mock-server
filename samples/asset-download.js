'use strict';
/**************************************************************************************************
 * This sample demonstrates a few more advanced features of Swagger-Express-Middleware,
 * such as setting a few options, initializing the mock data store, and adding custom middleware logic.
 **************************************************************************************************/

// Set the DEBUG environment variable to enable debug output of Swagger Middleware AND Swagger Parser
process.env.DEBUG = 'swagger:*';

var util            = require('util'),
    path            = require('path'),
    express         = require('express'),
    swagger         = require('swagger-express-middleware'),
    Middleware      = swagger.Middleware,
    MemoryDataStore = swagger.MemoryDataStore,
    Resource        = swagger.Resource;

var app = express();
var middleware = new Middleware(app);

middleware.init(path.join(__dirname, 'AssetDownload.yaml'), function(err) {
  // Create a custom data store with some initial mock data
  var myDB = new MemoryDataStore();
  myDB.save(
    new Resource('/api/volume/1', {"id":1,"name":"Databrary","body":"Databrary is an open data library for developmental science.","doi":"10.17910/B7159Q","alias":"test volume","creation":"2013-01-11T10:26:40Z","owners":[{"name":"Steiger, Lisa","id":3},{"name":"Tesla, Testarosa","id":7}],"permission":5,"publicsharefull":false,"publicaccess":"restricted"})
  );

  // Enable Express' case-sensitive and strict options
  // (so "/pets/Fido", "/pets/fido", and "/pets/fido/" are all different)
  app.enable('case sensitive routing');
  app.enable('strict routing');

  app.use(middleware.metadata());
  app.use(middleware.files(
    {
      // Override the Express App's case-sensitive and strict-routing settings
      // for the Files middleware.
      caseSensitive: false,
      strict: false
    },
    {
      // Serve the Swagger API from "/swagger/api" instead of "/api-docs"
      apiPath: '/swagger/api',

      // Disable serving the "PetStore.yaml" file
      rawFilesPath: false
    }
  ));

  app.use(middleware.parseRequest(
    {
      // Configure the cookie parser to use secure cookies
      cookie: {
        secret: 'MySuperSecureSecretKey'
      },

      // Don't allow JSON content over 100kb (default is 1mb)
      json: {
        limit: '100kb'
      },

      // Change the location for uploaded pet photos (default is the system's temp directory)
      multipart: {
        dest: path.join(__dirname, 'photos')
      }
    }
  ));

  // These two middleware don't have any options (yet)
  app.use(
    middleware.CORS(),
    middleware.validateRequest()
  );

  // Add custom middleware
  // app.patch('/pets/:petName', function(req, res, next) {
  //   if (req.body.name !== req.params.petName) {
  //     // The pet's name has changed, so change its URL.
  //     // Start by deleting the old resource
  //     myDB.delete(new Resource(req.path), function(err, pet) {
  //       if (pet) {
  //         // Merge the new data with the old data
  //         pet.merge(req.body);
  //       }
  //       else {
  //         pet = req.body;
  //       }

  //       // Save the pet with the new URL
  //       myDB.save(new Resource('/pets', req.body.name, pet), function(err, pet) {
  //         // Send the response
  //         res.json(pet.data);
  //       });
  //     });
  //   }
  //   else {
  //     next();
  //   }
  // });

  // The mock middleware will use our custom data store,
  // which we already pre-populated with mock data
  app.use(middleware.mock(myDB));

  // Add a custom error handler that returns errors as HTML
  app.use(function(err, req, res, next) {
    res.status(err.status);
    res.type('html');
    res.send(util.format('<html><body><h1>%d Error!</h1><p>%s</p></body></html>', err.status, err.message));
  });

  app.listen(9000, function() {
    console.log('The Databrary asset download mock server is now running at http://localhost:9000');
  });
});