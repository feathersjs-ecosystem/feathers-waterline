import omit from 'lodash.omit';
import Proto from 'uberproto';
import filter from 'feathers-query-filters';
import errors from 'feathers-errors';
import * as utils from './utils';
import * as _ from 'lodash';

class Service {
  constructor (options) {
    this.paginate = options.paginate || {};
    this.Model = options.Model;
    this.id = options.id || 'id';
  }

  extend (obj) {
    return Proto.extend(obj, this);
  }

  _find (params, count, getFilter = filter) {
    let { filters, query } = getFilter(params.query || {});
    let where = utils.getWhere(query);
    let order = utils.getOrder(filters.$sort);
    let options = filters.$select ? { select: Array.from(filters.$select) } : {};
    let counter = this.Model.count().where(where);
    let q = this.Model.find(where, options);

    if (order) {
      q.sort(order);
    }

    if (filters.$skip) {
      q.skip(filters.$skip);
    }

    if (filters.$limit) {
      q.limit(filters.$limit);
    }

    const performQuery = total => {
      return q.then(data => {
        return {
          total,
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data
        };
      });
    };

    if (count) {
      return counter.then(performQuery);
    }

    return performQuery();
  }

  find (params) {
    const paginate = (params && typeof params.paginate !== 'undefined')
      ? params.paginate : this.paginate;
    const result = this._find(params, !!paginate.default,
      query => filter(query, paginate)
    );

    if (!paginate.default) {
      return result.then(page => page.data);
    }

    return result;
  }

  _get (id) {
    return this.Model.findOne({ id }).then(instance => {
      if (!instance) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      return instance;
    }).catch(utils.errorHandler);
  }

  get (...args) {
    return this._get(...args);
  }

  _findOrGet (id, params) {
    if (id === null) {
      return this._find(params).then(page => page.data);
    }

    return this._get(id);
  }

  create (data) {
    return this.Model.create(data).catch(utils.errorHandler);
  }

  _patch (id, data, params) {
    const where = Object.assign({}, params.query);

    if (id !== null) {
      where[this.id] = id;
    }

    return this.Model.update({ where }, omit(data, this.id))
      .then(() => this._findOrGet(id, params))
      .catch(utils.errorHandler);
  }

  patch (...args) {
    return this._patch(...args);
  }

  _copy (data, instance) {
    let copy = {};
    Object.keys(instance.toJSON()).forEach(key => {
      // NOTE (EK): Make sure that we don't waterline created fields to null
      // just because a user didn't pass them in.
      if ((key === 'createdAt' || key === 'updatedAt') && typeof data[key] === 'undefined') {
        return;
      }

      if (typeof data[key] === 'undefined') {
        copy[key] = null;
//      } else {
//        copy[key] = data[key];
      }
    });
    Object.keys(data).forEach(key => {
      if ((key === 'createdAt' || key === 'updatedAt')) {
        return;
      }
      copy[key] = data[key];
    });
    return copy;
  }

  update (id, data, params) {
    if (Array.isArray(data)) {
      return Promise.reject(new errors.BadRequest('Not replacing multiple records. Did you mean `patch`?'));
    }

    const where = Object.assign({}, params.query);

    if (id !== null) {
      where[this.id] = id;
    }

    // remove any $... fields as they are parameters to be passed to the adaptor and
    // shouldnt be used for the following find/findOne().
    _.each(where, (v, k) => {
      if (_.startsWith(k, '$')) {
        delete where[k];
      }
    });

    const preserveWhere = _.cloneDeep(where);

    let p;
    if (id) {
      p = this.Model.findOne(where);
    } else {
      p = this.Model.find(where);
    }
    return p.then(instance => {
      if (!instance) {
        if (id) {
          throw new errors.NotFound('No record found for id \'' + id + '\'');
        } else {
          throw new errors.NotFound('No record found for criteria \'' + JSON.stringify(preserveWhere) + '\'');
        }
      }
      let copy;

      // handle criteria matching multiple documents
      if (_.isArray(instance)) {
        copy = [];
        instance.forEach((e) => {
          copy.push(this._copy(data, e));
        });
      } else {
        copy = this._copy(data, instance);
      }

      return this._patch(id, copy, params);
    })
    .catch(utils.errorHandler);
  }

  remove (id, params) {
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

export default function init (Model) {
  return new Service(Model);
}

init.Service = Service;
