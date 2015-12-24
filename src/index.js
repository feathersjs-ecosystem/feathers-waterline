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

  find(params) {
    let where = utils.getWhere(params.query);
    let filters = filter(where);
    let order = utils.getOrder(filters.$sort);
    let options = filters.$select ? { select: Array.from(filters.$select) } : {};
    let limit = false;
    let count = this.Model.count().where(where);
    let query = this.Model.find(where, options);

    if (order) {
      query.sort(order);
    }

    if (filters.$skip) {
      query.skip(filters.$skip);
    }

    if (this.paginate.default) {
      limit = Math.min(filters.$limit || this.paginate.default,
        this.paginate.max || Number.MAX_VALUE);

      query.limit(limit);
    } else if(filters.$limit) {
      query.limit(filters.$limit);
    }

    if(!this.paginate.default) {
      return query.then().catch(utils.errorHandler);
    }

    return count.then(total => {
      return query.then(data => {
        return {
          total,
          limit,
          skip: filters.$skip || 0,
          data
        };
      });
    }).catch(utils.errorHandler);
  }

  get(id) {
    return this.Model.findOne({ id }).then(instance => {
      if (!instance) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      return instance;
    }).catch(utils.errorHandler);
  }

  create(data) {
    return this.Model.create(data).then(instance => {
      return instance;
    }).catch(utils.errorHandler);
  }

  patch(id, data, params) {
    const where = Object.assign({}, params.query);

    if (id !== null) {
      where[this.id] = id;
    }

    delete data[this.id];

    return this.Model.update({ where }, data).then(() => {
      if (id === null) {
        return this.find(params);
      }

      return this.get(id, params);
    })
    .catch(utils.errorHandler);
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

      return this.patch(id, copy, {});
    })
    .catch(utils.errorHandler);
  }

  remove(id, params) {
    const promise = id === null ? this.find(params) : this.get(id);

    return promise.then(data => {
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
