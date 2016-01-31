if(!global._babelPolyfill) { require('babel-polyfill'); }

import Proto from 'uberproto';
import filter from 'feathers-query-filters';
import errors from 'feathers-errors';
import * as utils from './utils';

class Service {
  constructor(options) {
    this.paginate = options.paginate || {};
    this.Model = options.Model;
    this.id = options.id || 'id';
  }

  extend(obj) {
    return Proto.extend(obj, this);
  }

  _find(params, count, getFilter = filter) {
    let where = utils.getWhere(params.query);
    let filters = getFilter(where);
    let order = utils.getOrder(filters.$sort);
    let options = filters.$select ? { select: Array.from(filters.$select) } : {};
    let counter = this.Model.count().where(where);
    let query = this.Model.find(where, options);

    if (order) {
      query.sort(order);
    }

    if (filters.$skip) {
      query.skip(filters.$skip);
    }

    if(filters.$limit) {
      query.limit(filters.$limit);
    }
    
    const performQuery = total => {
      return query.then(data => {
        return {
          total,
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data
        };
      });
    };
    
    if(count) {
      return counter.then(performQuery);
    }
    
    return performQuery();
  }
  
  find(params) {
    const paginate = !!this.paginate.default;
    const result = this._find(params, paginate, query => filter(query, this.paginate));
    
    if(!paginate) {
      return result.then(page => page.data);
    }
    
    return result;
  }
  
  _get(id) {
    return this.Model.findOne({ id }).then(instance => {
      if (!instance) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      return instance;
    }).catch(utils.errorHandler);
  }
  
  get(... args) {
    return this._get(... args);
  }
  
  _findOrGet(id, params) {
    if(id === null) {
      return this._find(params).then(page => page.data);
    }
    
    return this._get(id);
  }

  create(data) {
    return this.Model.create(data).catch(utils.errorHandler);
  }

  _patch(id, data, params) {
    const where = Object.assign({}, params.query);

    if (id !== null) {
      where[this.id] = id;
    }

    delete data[this.id];

    return this.Model.update({ where }, data)
      .then(() => this._findOrGet(id, params))
      .catch(utils.errorHandler);
  }
  
  patch(... args) {
    return this._patch(... args);
  }

  update(id, data) {
    if (Array.isArray(data)) {
      return Promise.reject('Not replacing multiple records. Did you mean `patch`?');
    }

    delete data[this.id];

    return this.Model.findOne({ id }).then(instance => {
      if (!instance) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      let copy = {};
      Object.keys(instance.toJSON()).forEach(key => {

        // NOTE (EK): Make sure that we don't waterline created fields to null
        // just because a user didn't pass them in.
        if ((key === 'createdAt' || key === 'updatedAt') && typeof data[key] === 'undefined') {
          return;
        }

        if (typeof data[key] === 'undefined') {
          copy[key] = null;
        } else {
          copy[key] = data[key];
        }
      });

      return this._patch(id, copy, {});
    })
    .catch(utils.errorHandler);
  }

  remove(id, params) {
    return this._findOrGet(id, params).then(data => {
      const where = Object.assign({}, params.query);

      if (id !== null) {
        where.id = id;
      }

      return this.Model.destroy({ where }).then(() => data);
    })
    .catch(utils.errorHandler);
  }
}

export default function init(Model) {
  return new Service(Model);
}

init.Service = Service;
