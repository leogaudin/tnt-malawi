import { handle400Error, handle200Success, handle404Error } from '../errorHandlers.js';
import { requireApiKey } from '../apiKey.js';
import { Model } from 'mongoose';

/**
 * @param {Model}	Model	a Mongoose model
 */
export const getAll = (Model) => async (req, res) => {
	try {
		requireApiKey(req, res, async () => {
			const instances = await Model.find({});

			if (!instances.length) {
				return handle404Error(res);
			}

			return handle200Success(res, instances);
		});
	} catch (error) {
		console.error(error);
		return handle400Error(res, error);
	}
};
