import { expect } from 'chai';
import errors from 'feathers-errors';
import * as utils from '../src/utils';
import { adapter as Errors } from 'waterline-errors';

const MockValidationError = function(msg) {
  return {
    message: msg,
    constructor: {
      name: 'WLValidationError'
    },
    errors: {
      text: ['A record with that `text` already exists (`do dishes`).']
    },
    toJSON: function(){
      return {
        'error': 'E_VALIDATION',
        'status': 400,
        'summary': '1 attribute is invalid',
        'invalidAttributes': {
          'text': [
            {
              'value': 'do dishes',
              'rule': 'unique',
              'message': 'A record with that `text` already exists (`do dishes`).'
            }
          ]
        }
      };
    }
  };
};

const MockUsageError = function(msg) {
  return {
    message: msg,
    constructor: {
      name: 'WLUsageError'
    }
  };
};

describe('Feathers Waterline Utils', () => {
  describe('errorHandler', () => {
    it('throws a feathers error', () => {
      let e = new errors.GeneralError();
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.GeneralError);
    });

    it('throws a regular error', () => {
      let e = new Error('Regular Error');
      expect(utils.errorHandler.bind(null, e)).to.throw(e);
    });

    it('wraps a ValidationError as a BadRequest', () => {
      let e = MockValidationError();
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.BadRequest);
    });

    it.skip('preserves a validation error message', () => {
      let e = MockValidationError('Invalid Text');
      try {
        utils.errorHandler(e);
      }
      catch(error) {
        expect(error.message).to.equal('Invalid Email');
      }
    });

    it('preserves a validation errors', () => {
      let textError = {
        text: ['A record with that `text` already exists (`do dishes`).']
      };

      let e = MockValidationError();
      try {
        utils.errorHandler(e);
      }
      catch(error) {
        expect(error.errors).to.deep.equal(textError);
      }
    });

    it.skip('wraps a UsageError as a BadRequest', () => {
      let e = MockUsageError();
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.BadRequest);
    });

    it('wraps a PrimaryKeyUpdate error as a BadRequest', () => {
      let e = new Error(Errors.PrimaryKeyUpdate);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.BadRequest);
    });

    it('wraps a PrimaryKeyMissing error as a BadRequest', () => {
      let e = new Error(Errors.PrimaryKeyMissing);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.BadRequest);
    });

    it('wraps a PrimaryKeyCollision error as a BadRequest', () => {
      let e = new Error(Errors.PrimaryKeyCollision);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.BadRequest);
    });

    it('wraps a NotUnique error as a BadRequest', () => {
      let e = new Error(Errors.NotUnique);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.BadRequest);
    });

    it('wraps a InvalidAutoIncrement error as a BadRequest', () => {
      let e = new Error(Errors.InvalidAutoIncrement);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.BadRequest);
    });

    it('wraps a NotFound error as a NotFound', () => {
      let e = new Error(Errors.NotFound);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.NotFound);
    });

    it('wraps a AuthFailure error as a NotAuthenticated', () => {
      let e = new Error(Errors.AuthFailure);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.NotAuthenticated);
    });

    it('wraps a CollectionNotRegistered error as a GeneralError', () => {
      let e = new Error(Errors.CollectionNotRegistered);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.GeneralError);
    });

    it('wraps a InvalidConnection error as a GeneralError', () => {
      let e = new Error(Errors.InvalidConnection);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.GeneralError);
    });

    it('wraps a InvalidGroupBy error as a GeneralError', () => {
      let e = new Error(Errors.InvalidGroupBy);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.GeneralError);
    });

    it('wraps a ConnectionRelease error as a GeneralError', () => {
      let e = new Error(Errors.ConnectionRelease);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.GeneralError);
    });

    it('wraps a IdentityMissing error as a GeneralError', () => {
      let e = new Error(Errors.IdentityMissing);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.GeneralError);
    });

    it('wraps a IdentityDuplicate error as a Conflict', () => {
      let e = new Error(Errors.IdentityDuplicate);
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.Conflict);
    });
  });

  describe('getOrder', () => {
    it('returns empty object when nothing is passed in', () => {
      let order = utils.getOrder();

      expect(order).to.deep.equal({});
    });

    it('returns order properly converted', () => {
      let order = utils.getOrder({ name: 1, age: -1 });

      expect(order).to.deep.equal({ name: 'asc', age: 'desc' });
    });
  });
  
  describe('getWhere', () => {
    it('returns empty object when nothing is passed in', () => {
      let where = utils.getWhere();

      expect(where).to.deep.equal({});
    });

    it('returns where conditions properly converted', () => {
      let where = utils.getWhere({ name: 'Joe', age: { $lte: 25 }});

      expect(where).to.deep.equal({ name: 'Joe', age: { '<=': 25 }});
    });

    it('converts $nin to $notIn', () => {
      let where = utils.getWhere({ name: { $nin: ['Joe', 'Alice'] }});

      expect(where).to.deep.equal({ name: { '!': ['Joe', 'Alice'] }});
    });
  });
});
