import lzstring from 'lz-string';
import { handle400Error, handle201Success, handle206Success } from '../errorHandlers.js';
import { requireApiKey } from '../apiKey.js';
import { generateId } from '../index.js';
import { Model } from 'mongoose';

/**
 * @param {Model}	Model	a Mongoose model
 */
export const createMany = (Model) => async (req, res) => {
	try {
		requireApiKey(req, res, async () => {
			const { data } = req.body;

			if (!data) {
				return handle400Error(res, 'No data provided');
			}

			const payload = lzstring.decompressFromEncodedURIComponent(data);
			const instances = JSON.parse(payload);
			instances.forEach((instance) => {
				instance.createdAt = new Date().getTime();
				instance.id = generateId();
			});

			const inserted = await Model.insertMany(instances);
			return handle201Success(res, 'Items created!', { insertedCount: inserted.length });
		});

	} catch (error) {
		console.error('Error occurred during createMany:', error);
		return handle400Error(res, error);
	}
};
