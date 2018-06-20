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

//generate fake data
var jsf = require('json-schema-faker');

var volume = {
  type: 'object',
  properties: {
    id: {
      type: 'integer'
    },
    name: {
      type: 'string'
    },
    alias: {
      type: 'string'
    },
    body: {
      type: 'string'
    },
    creation: {
      type: 'string'
    },
    doi: {
      type: 'string'
    },
    owners: {
      type: 'array',
      items: {
        name: {
          type: 'string'
        },
        id: {
          type: 'integer'
        }
      }
    },
    permission: {
      type: 'integer'
    },
    publicsharefull: {
      type: 'boolean'
    },
    publicaccess: {
      type: 'string'
    }
  },
  required: ['id', 'name', 'alias', 'body', 'creation', 'doi', 'owners', 'permission', 'publicsharefull', 'publicaccess']
};

jsf.resolve(volume).then(function(sample) {
  middleware.init(path.join(__dirname, 'AssetDownload.yaml'), function(err) {
    // Create a custom data store with some initial mock data
    var myDB = new MemoryDataStore();
    myDB.save(
      new Resource('/api/volume/1', sample),
      new Resource('/api/volume/1/slot/4/0,40000/asset/1', {"segment":[0,40000],"permission":5,"container":{"id":4,"top":true,"name":"Top-level materials"},"asset":{"id":1,"format":-800,"classification":3,"duration":40000,"segment":[0,40000],"name":"counting","permission":5}})
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

});
