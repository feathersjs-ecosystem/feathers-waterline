import errors from 'feathers-errors';
import { adapter as Errors } from 'waterline-errors';

export function errorHandler(error) {
  let feathersError = error;

  if (error.constructor.name && (error.constructor.name === 'WLValidationError' || error.constructor.name === 'WLUsageError' )) {
    let e = error.toJSON();
    let data = Object.assign({ errors: error.errors}, e);

    feathersError = new errors.BadRequest(e.summary, data);
  }
  else if (error.message) {
    switch(error.message) {
      case Errors.PrimaryKeyUpdate.toString():
      case Errors.PrimaryKeyMissing.toString():
      case Errors.PrimaryKeyCollision.toString():
      case Errors.NotUnique.toString():
      case Errors.InvalidAutoIncrement.toString():
        feathersError = new errors.BadRequest(error);
        break;
      case Errors.NotFound.toString():
        feathersError = new errors.NotFound(error);
        break;
      case Errors.AuthFailure.toString():
        feathersError = new errors.NotAuthenticated(error);
        break;
      case Errors.CollectionNotRegistered.toString():
      case Errors.InvalidConnection.toString():
      case Errors.InvalidGroupBy.toString():
      case Errors.ConnectionRelease.toString():
      case Errors.IdentityMissing.toString():
        feathersError = new errors.GeneralError(error);
        break;
      case Errors.IdentityDuplicate.toString():
        feathersError = new errors.Conflict(error);
        break;
    }
  }

  throw feathersError;
}

export function getOrder(sort={}) {
  let order = {};

  Object.keys(sort).forEach(name => {
    order[name] = sort[name] === 1 ? 'asc' : 'desc';
  });

  return order;
}

const queryMappings = {
  $lt: '<',
  $lte: '<=',
  $gt: '>',
  $gte: '>=',
  $ne: '!',
  $nin: '!'
};

const specials = ['$sort', '$limit', '$skip', '$select'];

function getValue(value, prop) {
  if(typeof value === 'object' && specials.indexOf(prop) === -1) {
    let query = {};

    Object.keys(value).forEach(key => {
      if(queryMappings[key]) {
        query[queryMappings[key]] = value[key];
      } else {
        query[key] = value[key];
      }
    });

    return query;
  }

  return value;
}

export function getWhere(query) {
  let where = {};

  if(typeof query !== 'object') {
    return {};
  }

  Object.keys(query).forEach(prop => {
    const value = query[prop];

    if(prop === '$or') {
      where.or = value;
    } else if(value.$in) {
      where[prop] = value.$in;
    } else {
      where[prop] = getValue(value, prop);
    }
  });

  return where;
}
