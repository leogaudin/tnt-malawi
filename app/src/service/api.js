import { API_URL } from './specific';
import { showToast } from './toast';

/**
 *	@typedef {Object} Scan
 *	@property {Date} time
 *	@property {boolean} finalDestination
 *	@property {boolean} markedAsReceived
 */

/**
 *
 * @param {Scan} data
 * @returns {Promise<Scan>}
 */
export function sendScan(data) {
	return new Promise((resolve, reject) => {
		fetch(`${API_URL}/scan`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		})
			.then(response => {
				if (response.status >= 200 && response.status < 300) {
					showToast(
						'success',
						'Success!',
						'Scan sent successfully',
					);
					resolve(response.json());
				} else {
					reject(
						new Error(`Request failed with status code ${response.status}`),
					);
				}
			})
			.catch(error => {
				showToast(
					'error',
					'Error!',
					'Scan could not be sent',
				);
				reject(error);
			});
	});
}
