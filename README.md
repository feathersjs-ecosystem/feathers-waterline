# feathers-waterline

[![Build Status](https://travis-ci.org/feathersjs/feathers-waterline.png?branch=master)](https://travis-ci.org/feathersjs/feathers-waterline)

> A [Waterline](https://github.com/balderdashy/waterline) ORM service adapter

## Installation

```bash
npm install feathers-waterline --save
```

## Documentation

Please refer to the [Feathers database adapter documentation](http://docs.feathersjs.com/databases/readme.html) for more details or directly at:

- [Waterline](http://docs.feathersjs.com/databases/waterline.html) - The detailed documentation for this adapter
- [Extending](http://docs.feathersjs.com/databases/extending.html) - How to extend a database adapter
- [Pagination and Sorting](http://docs.feathersjs.com/databases/pagination.html) - How to use pagination and sorting for the database adapter
- [Querying](http://docs.feathersjs.com/databases/querying.html) - The common adapter querying mechanism

## Complete Example

Here is an example of a Feathers server with a `todos` Waterline Model using the [Disk](https://github.com/balderdashy/sails-disk) store:

```js
import feathers from 'feathers';
import rest from 'feathers-rest';
import bodyParser from 'body-parser';
import Waterline from 'waterline';
import diskAdapter from 'sails-disk';
import waterline from 'feathers-waterline';

const ORM = new Waterline();
const config = {
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
const Todo = Waterline.Collection.extend({
  identity: 'todo',
  schema: true,
  connection: 'myLocalDisk',
  attributes: {
    text: {
      type: 'string',
      required: true
    },

    complete: {
      type: 'boolean'
    }
  }
});

// Create a feathers instance.
const app = feathers()
  // Enable REST services
  .configure(rest())
  // Turn on JSON parser for REST services
  .use(bodyParser.json())
  // Turn on URL-encoded parser for REST services
  .use(bodyParser.urlencoded({ extended: true }));

module.exports = new Promise(function(resolve) {
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
    const server = app.listen(3030);
    server.on('listening', function() {
      console.log('Feathers Todo waterline service running on 127.0.0.1:3030');
      resolve(server);
    });
  });
});
```

You can run this example by using `node examples/app` and going to [localhost:8080/todos](http://localhost:8080/todos). You should see an empty array. That's because you don't have any Todos yet but you now have full CRUD for your new todos service.

## Changelog

__1.1.0__

- Use internal methods instead of service methods directly

__1.0.0__

- Stable release of finalized adapter
 
__0.1.0__

- First working release. Tests still need fixing but basic functionality works.

## License

Copyright (c) 2015

Licensed under the [MIT license](LICENSE).
