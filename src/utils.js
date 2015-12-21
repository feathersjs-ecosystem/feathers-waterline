import errors from 'feathers-errors';
import { adapter as Errors } from 'waterline-errors';

export function errorHandler(error) {
  let feathersError = error;

  // console.log('ERROR MESSAGE', error.message);
  // console.log('ERROR TYPE', error.constructor.name);
  // console.log('ERROR NAME', error.name);
  // console.log('ERROR STATUS', error.status);
  // console.log('ERROR CODE', error.code);
  // console.log('ERROR ERRORS', error.errors);
  // if (error.toJSON) {
  //   console.log('ERROR JSON', error.toJSON());
  // }
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

export function getSelect(select={}) {
  let selected = [];

  Object.keys(select).forEach(name => {
    if (select[name] === 1) {
      selected.push(name);
    }
  });

  return selected;
}

export function getWhere(query) {
  let where = Object.assign({}, query);

  Object.keys(where).forEach(prop => {
    let value = where[prop];
    if (value.$nin) {
      value = Object.assign({}, value);

      value.$notIn = value.$nin;
      delete value.$nin;

      where[prop] = value;
    }
  });

  return where;
}