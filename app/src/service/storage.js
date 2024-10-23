import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendScan } from './api';
import { offlineKey } from '../constants';
import { showToast } from './toast';

/**
 * Stores a string in AsyncStorage
 * @param key   The key to store the value under
 * @param value The value to store
 */
export const storeString = async (key, value) => {
	try {
		await AsyncStorage.setItem(key, value);
	} catch (e) {
		console.error(e);
	}
};

/**
 * Retrieves a string from AsyncStorage
 * @param key The key to retrieve the value from
 * @returns   The value stored under the given key
 */
export const getString = async (key) => {
	try {
		const value = await AsyncStorage.getItem(key);
		if (value !== null) {
			return value;
		}
	} catch (e) {
		console.error(e);
	}
};

/**
 * Removes a string from AsyncStorage
 * @param key The key to remove the value from
 */
export const removeValue = async (key) => {
	try {
		await AsyncStorage.removeItem(key);
	} catch (e) {
		console.error(e);
	}
	console.info('Removed ' + key + '.');
};

/**
 * Stores a scan object in the offline storage
 * @param dataToSend The data to store offline, as a scan object
 */
export const storeOfflineData = (dataToSend) => {
	AsyncStorage.getItem(offlineKey)
		.then((data) => {
			const existingData = [...(JSON.parse(data) || []), ...dataToSend];

			AsyncStorage.setItem(offlineKey, JSON.stringify(existingData))
				.catch((error) => {
					console.error('Error storing offline data:', error);
				});
		})
		.catch((error) => {
			console.error('Error retrieving offline data:', error);
		});
};

export const sendOfflineData = (offlineData, setOfflineData, failedData = []) => {
	if (offlineData.length > 0) {
		const scanToSend = offlineData[0];
		sendScan(scanToSend)
			.catch((error) => {
				failedData.push(scanToSend);
				console.error('Error sending offline data:', error)
				console.error('Failed data:', failedData);
				showToast(
					'error',
					'Error sending offline data',
					'Offline data will be sent when connection is restored',
				);
			})
			.finally(() => {
				offlineData.shift();
				AsyncStorage.setItem(offlineKey, JSON.stringify(offlineData))
					.then(() => {
						sendOfflineData(offlineData, setOfflineData, failedData);
					})
					.catch((error) => {
						console.error('Error updating offline data:', error);
					});
			})
	}
	else if (failedData.length > 0) {
		setOfflineData((prev) => [...prev, ...failedData]);
	}
};