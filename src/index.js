import makeDebug from 'debug';
import Proto from 'uberproto';
import filter from 'feathers-query-filters';
import { types as errors } from 'feathers-errors';

const debug = makeDebug('feathers-waterline');

// Create the service.
const Service = Proto.extend({
	init(Model) {
    this.Model = Model;
	},

	find(params, callback) {
    this.Model.find().exec(callback);
	},

	get(id, params, callback) {
		if(typeof id === 'function') {
			return id(new errors.BadRequest('An id needs to be provided'));
		}

		this.Model.findOne({ id }, callback);
	},

	create(data, params, callback) {
		this.Model.create(data, callback);
	},

	patch(id, data, params, callback) {
    // TODO get first, then remove other fields
    this.Model.update({ id }, data, callback);
	},

	update(id, data, params, callback) {
    this.Model.update({ id }, data, callback);
	},

	remove(id, params, callback) {
		this.Model.destroy({ id }, callback);
	}
});

export default function create() {
  return Proto.create.apply(Service, arguments);
}

create.Service = Service;
