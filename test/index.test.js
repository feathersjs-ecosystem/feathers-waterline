import assert from 'assert';
import Waterline from 'waterline';
import diskAdapter from 'sails-disk';
import plugin from '../src';

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
const orm = new Waterline();

describe('feathers-waterline', () => {
  // Define your collection (aka model)
  var User = Waterline.Collection.extend({
    identity: 'user',
    connection: 'myLocalDisk',

    attributes: {
      name: {
        type: 'string',
        required: true
      },

      age: {
        type: 'integer'
      }
    }
  });

  it('is CommonJS compatible', () => {
    assert.equal(typeof require('../lib'), 'function');
  });

  it('basic functionality', done => {
    assert.equal(typeof plugin, 'function', 'It worked');
    done();
  });
});
