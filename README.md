# feathers-waterline

[![Build Status](https://travis-ci.org/feathersjs/feathers-waterline.png?branch=master)](https://travis-ci.org/feathersjs/feathers-waterline)

> A [Waterline](https://github.com/balderdashy/waterline) ORM service adapter

## Installation

```bash
npm install feathers-waterline --save
```

## Getting Started

`feathers-waterline` hooks a Waterline Model up to a configured data store as a feathers service.

```js
var Todo = require('./models/todo');
var config = require('./config/waterline');
var Waterline = require('waterline');
var waterline = require('feathers-waterline');
var ORM = new Waterline();

ORM.loadCollection(Todo);
ORM.initialize(config, function(error, data) {
    app.use('/todos', waterline({
      Model: data.collections.todo
    }));
});

```

### Complete Example

Here is an example of a Feathers server with a `todos` Waterline Model using the [Disk](https://github.com/balderdashy/sails-disk) store:

```js
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

  // basic error handler
  app.use(function(error, req, res, next){
    res.json(error);
  });

  // Start the server
  module.exports = app.listen(3030);

  console.log('Feathers Todo waterline service running on 127.0.0.1:3030');
});

```

You can run this example by using `node examples/app` and going to [localhost:3030/todos](http://localhost:3030/todos). You should see an empty array. That's because you don't have any Todos yet but you now have full CRUD for your new todos service.

## Extending

There are several ways to extend the basic CRUD functionality of this service.

_Keep in mind that calling the original service methods will return a Promise that resolves with the value._

### feathers-hooks

The most flexible option is weaving in functionality through [feathers-hooks](https://github.com/feathersjs/feathers-hooks), for example, the
user that made the request could be added like this:

```js
var feathers = require('feathers');
var hooks = require('feathers-hooks');
var waterline = require('feathers-waterline');
// Assuming todo.js exports the Waterline model definition
var Todo = require('./models/todo.js');

var app = feathers().configure(hooks());

app.use('/todos', sequelize({
    Model: Todo,
    paginate: {
      default: 2,
      max: 4
    }
  }));

app.service('todos').before({
  // You can create a single hook like this
  create: function(hook, next) {
    hook.data.user_id = hook.params.user.id;
    next();
  }
});

app.listen(3030);
```

### Classes (ES6)

The module also exports a Babel transpiled ES6 class as `Service` that can be directly extended like this:

```js
import Todo from './models/todo';
import { Service } from 'feathers-waterline';

class MyService extends Service {
  create(data, params) {
    data.user_id = params.user.id;

    return super.create(data, params);
  }
}

app.use('/todos', new MyService({
  Model: Todo,
  paginate: {
    default: 2,
    max: 4
  }
}));
```

### Uberproto (ES5)

You can also use `.extend` on a service instance (extension is provided by [Uberproto](https://github.com/daffl/uberproto)):

```js
var myService = memory({
  Model: Todo,
  paginate: {
    default: 2,
    max: 4
  }
}).extend({
  create: function(data, params) {
    data.user_id = params.user.id;

    return this._super.apply(this, arguments);
  }
});

app.use('/todos', myService);
```

**Note:** _this is more for backwards compatibility. We recommend the usage of hooks as they are easier to test, easier to maintain and are more flexible._

## Options

Creating a new Sequelize service currently offers the following options:

- `Model` - The Sequelize model definition
- `id` (default: `id`) - The name of the id property
- `paginate` [optional] - A pagination object containing a `default` and `max` page size (see below)

## Pagination

When initializing the service you can set the following pagination options in the `paginate` object:

- `default` - Sets the default number of items
- `max` - Sets the maximum allowed number of items per page (even if the `$limit` query parameter is set higher)

When `paginate.default` is set, `find` will return an object (instead of the normal array) in the following form:

```
{
  "total": "<total number of records>",
  "limit": "<max number of items per page>",
  "skip": "<number of skipped items (offset)>",
  "data": [/* data */]
}
```

## Query Parameters

The `find` API allows the use of `$limit`, `$skip`, `$sort`, and `$select` in the query.  These special parameters can be passed directly inside the query object:

```js
// Find all recipes that include salt, limit to 10, only include name field.
{"ingredients":"salt", "$limit":10, "$select": ["name"] } } // JSON

GET /?ingredients=salt&$limit=10&$select[]=name // HTTP
```

As a result of allowing these to be put directly into the query string, you won't want to use `$limit`, `$skip`, `$sort`, or `$select` as the name of fields in your document schema.

### `$limit`

`$limit` will return only the number of results you specify:

```
// Retrieves the first two records found where age is 37.
query: {
  age: 37,
  $limit: 2
}
```

### `$skip`

`$skip` will skip the specified number of results:

```
// Retrieves all except the first two records found where age is 37.
query: {
  age: 37,
  $skip: 2
}
```

### `$sort`

`$sort` will sort based on the object you provide:

```
// Retrieves all where age is 37, sorted ascending alphabetically by name.
query: {
  age: 37,
  $sort: { name: 1 }
}

// Retrieves all where age is 37, sorted descending alphabetically by name.
query: {
  age: 37,
  $sort: { name: -1}
}
```

### `$select`

`$select` support in a query allows you to pick which fields to include or exclude in the results.

```
// Only retrieve name.
query: {
  name: 'Alice',
  $select: {'name': 1}
}

// Retrieve everything except age.
query: {
  name: 'Alice',
  $select: {'age': 0}
}
```


## Filter criteria

In addition to sorting and pagination, properties can also be filtered by criteria. Standard criteria can just be added to the query. For example, the following find all users with the name `Alice`:

```js
query: {
  name: 'Alice'
}
```

Additionally, the following advanced criteria are supported for each property.

### $in, $nin

Find all records where the property does (`$in`) or does not (`$nin`) contain the given values. For example, the following query finds every user with the name of `Alice` or `Bob`:

```js
query: {
  name: {
    $in: ['Alice', 'Bob']
  }
}
```

### $lt, $lte

Find all records where the value is less (`$lt`) or less and equal (`$lte`) to a given value. The following query retrieves all users 25 or younger:

```js
query: {
  age: {
    $lte: 25
  }
}
```

### $gt, $gte

Find all records where the value is more (`$gt`) or more and equal (`$gte`) to a given value. The following query retrieves all users older than 25:

```js
query: {
  age: {
    $gt: 25
  }
}
```

### $ne

Find all records that do not contain the given property value, for example anybody not age 25:

```js
query: {
  age: {
    $ne: 25
  }
}
```

### $or

Find all records that match any of the given objects. For example, find all users name Bob or Alice:

```js
query: {
  $or: [
    { name: 'Alice' },
    { name: 'Bob' }
  ]
}
```

## Changelog

__1.0.0__

- First official release. Fully supports feathers adapter spec.
- All tests are now passing.

__0.1.0__

- First semi-working release. Tests still need fixing but basic functionality works.

## License

Copyright (c) 2015

Licensed under the [MIT license](LICENSE).
