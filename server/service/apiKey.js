import Admin from '../models/admins.model.js';
import { handle401Error } from './errorHandlers.js';
import { generateId } from './index.js';

/**
 *
 * @returns {string}	A random string
 */
export const generateApiKey = () => {
  return generateId();
}

/**
 *
 * @param {Request}		req		Express request object
 * @param {Response}	res		Express response object
 * @param {Function}	next	Function to call after successful validation
 */
export const requireApiKey = async (req, res, next) => {
	if (!req.headers['x-authorization']) {
		return handle401Error(res, 'API key required');
	}

	const apiKey = req.headers['x-authorization'];
	const admin = await Admin.findOne({ apiKey });

	if (!admin) {
		return handle401Error(res, 'Invalid API key');
	}

	return next(admin);
};
