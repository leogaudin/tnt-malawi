/**
 *
 * @param {Response}	res	Express response object
 * @returns	{Response}	Express response object
 */
export const handle404Error = (res) => {
	if (res && !res.headersSent) {
		return res.status(404).json({ success: false, error: `Item not found` });
	}
};

/**
 *
 * @param {Response}	res		Express response object
 * @param {string}		error	Error message
 * @returns	{Response}	Express response object
 */
export const handle401Error = (res, error) => {
	if (res && !res.headersSent) {
		return res.status(401).json({ success: false, error });
	}
};

/**
 *
 * @param {Response}	res		Express response object
 * @param {string}		error	Error message
 * @returns	{Response}	Express response object
 */
export const handle400Error = (res, error) => {
	if (res && !res.headersSent) {
		return res.status(400).json({ success: false, error });
	}
};

/**
 *
 * @param {Response}	res		Express response object
 * @param {string}		error	Error message
 * @returns	{Response}	Express response object
 */
export const handle409Error = (res, error) => {
	if (res && !res.headersSent) {
		return res.status(409).json({ success: false, error });
	}
};

/**
 *
 * @param {Response}	res		Express response object
 * @param {string}		message	Success message
 * @param {Object}		data	Additional data
 * @returns	{Response}	Express response object
 */
export const handle201Success = (res, message, data) => {
	if (res && !res.headersSent) {
		return res.status(201).json({
			success: true,
			message,
			...data,
		});
	}
};

/**
 *
 * @param {Response}	res		Express response object
 * @param {string}		message	Success message
 * @param {Object}		data	Additional data
 * @returns	{Response}	Express response object
 */
export const handle206Success = (res, message, data) => {
	if (res && !res.headersSent) {
		return res.status(206).json({
			success: true,
			message,
			...data,
		});
	}
};

/**
 *
 * @param {Response}	res		Express response object
 * @param {Object}		data	Additional data
 * @returns	{Response}	Express response object
 */
export const handle200Success = (res, data) => {
	if (res && !res.headersSent) {
		return res.status(200).json({ success: true, data });
	}
};
