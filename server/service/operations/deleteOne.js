import { handle400Error, handle200Success, handle404Error } from '../errorHandlers.js';
import { requireApiKey } from '../apiKey.js';
import { Model } from 'mongoose';

/**
 * @param {Model}	Model	a Mongoose model
 */
export const deleteOne = (Model) => async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const instance = await Model.findOneAndDelete({ id: req.params.id, adminId: admin.id });

			if (!instance) {
				return handle404Error(res);
			}

			return handle200Success(res, instance);
		});
	} catch (error) {
		console.error(error);
		return handle400Error(res, error);
	}
};
