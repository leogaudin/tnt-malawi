import { handle400Error, handle409Error, handle201Success } from '../errorHandlers.js';
import { requireApiKey } from '../apiKey.js';
import { generateId } from '../index.js';
import { Model } from 'mongoose';

/**
 * @param {Model}	Model	a Mongoose model
 */
export const createOne = (Model) => async (req, res) => {
	try {
		requireApiKey(req, res, async () => {
			const body = req.body;

			if (!body) {
				return handle400Error(res, 'You must provide an item');
			}

			body.createdAt = new Date().getTime();
			body.id = generateId();

			const instance = new Model(body);

			if (!instance) {
				return handle400Error(res, err);
			}

			await instance.save();
			return handle201Success(res, {
				id: instance.id,
				message: `Item created!`,
			});
		});
	} catch (error) {
		console.error(error);
		return handle400Error(res, error);
	}
};
