import { handle400Error, handle404Error, handle200Success } from '../errorHandlers.js';
import { requireApiKey } from '../apiKey.js';

export const deleteMany = (Model) => async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const { deleteConditions } = req.body;

			if (!deleteConditions) {
				return handle400Error(res, 'No delete conditions provided');
			}

			const instances = await Model.deleteMany({ ...(deleteConditions || {}), adminId: admin.id });

			if (instances.deletedCount === 0) {
				return handle404Error(res);
			}

			return handle200Success(res, { deletedCount: instances.deletedCount });
		});
	} catch (error) {
		console.error(error);
		return handle400Error(res, error);
	}
};
