var feathers = require('feathers');
var bodyParser = require('body-parser');
var Waterline = require('waterline');
var diskAdapter = require('sails-disk');
var waterline = require('../lib');
var ORM = new Waterline();

var config = {
  adapters: {
    'default': diskAdapter,
    disk: diskAdapter
  },
  connections: {
    myLocalDisk: {
      adapter: 'disk'
    }
  },
  defaults: {
    migrate: 'alter'
  }
};

var Todo = Waterline.Collection.extend({
  identity: 'todo',
  schema: true,
  connection: 'myLocalDisk',
  attributes: {
    text: {
      type: 'string',
      required: true,
      unique: true
    },

    complete: {
      type: 'boolean'
    }
  }
});

// Create a feathers instance.
var app = feathers()
  // Enable Socket.io
  .configure(feathers.socketio())
  // Enable REST services
  .configure(feathers.rest())
  // Turn on JSON parser for REST services
  .use(bodyParser.json())
  // Turn on URL-encoded parser for REST services
  .use(bodyParser.urlencoded({ extended: true }));

ORM.loadCollection(Todo);
ORM.initialize(config, (error, data) => {
  if (error) {
    console.error(error);
  }
  
  // Create a Waterline Feathers service with a default page size of 2 items
  // and a maximum size of 4
  app.use('/todos', waterline({
    Model: data.collections.todo,
    paginate: {
      default: 2,
      max: 4
    }
  }));

  app.use(function(error, req, res, next){
    res.json(error);
  });

  // Start the server
  module.exports = app.listen(3030);

  console.log('Feathers Todo waterline service running on 127.0.0.1:3030');
});