import crypto from 'crypto'

/**
 *
 * @param {string}	str	String to hash
 * @returns {string}	Hashed string
 */
export async function sha512(str) {
	const buf = await crypto.subtle.digest('SHA-512', new TextEncoder('utf-8').encode(str));
	return Array.prototype.map.call(new Uint8Array(buf), x => (('00' + x.toString(16)).slice(-2))).join('');
}

/**
 *
 * @returns {string}	A random string of 10-11 characters (a-zA-Z0-9)
 */
export function generateId() {
	return crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
}

/**
 *
 * @param {{ latitude: number, longitude: number }}	coord1	1st set of coordinates
 * @param {{ latitude: number, longitude: number }}	coord2	2nd set of coordinates
 * @returns {number}	Distance between the two coordinates, in meters
 */
function haversineDistance(coord1, coord2) {
	const earthRadiusInMeters = 6378137;
	const { latitude: lat1, longitude: lon1 } = coord1;
	const { latitude: lat2, longitude: lon2 } = coord2;

	const dLat = (lat2 - lat1) * (Math.PI / 180);
	const dLon = (lon2 - lon1) * (Math.PI / 180);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	const distance = earthRadiusInMeters * c;

	return distance;
}

/**
 *
 * @param {{ latitude: number, longitude: number }}	schoolCoords	Destination coordinates
 * @param {{ latitude: number, longitude: number, accuracy?: number }}	boxCoords	Box coordinates
 * @returns {boolean}	True if the box is within 1km of the destination, false otherwise
 */
export function isFinalDestination(schoolCoords, boxCoords) {
	const distance = haversineDistance(schoolCoords, boxCoords);
    const toleranceInMeters = 1000;
	const threshold = toleranceInMeters + (boxCoords.accuracy || 0);

	return distance <= threshold;
}

/**
 *
 * @param {Request}		req		Request object
 * @returns {Object}	{ skip, limit, filters }
 */
export function getQuery(req) {
	const skip = parseInt(req.query.skip);
	const limit = parseInt(req.query.limit);
	delete req.query.skip;
	delete req.query.limit;

	const filters = req.body.filters || {};

	const custom = filters.custom;
	delete filters.custom;

	if (custom && typeof custom === 'string') {
		const customRegex = new RegExp(custom, 'i');
		filters.$or = [
			...Object.keys(boxFields).map((field) => ({ [field]: customRegex })),
			{ id: customRegex },
		];
	}

	return { skip, limit, filters };
}
