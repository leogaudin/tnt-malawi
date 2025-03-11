import { Platform, PermissionsAndroid } from 'react-native';
import { PERMISSIONS, request } from 'react-native-permissions';

/**
 * Requests permission for location and camera
 * @returns {Promise<{location: boolean, camera: boolean}>}
 */
export const requestAllPermissions = async () => {
	try {
		if (Platform.OS === 'android') {
			const result = await PermissionsAndroid.requestMultiple([
				PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
				PermissionsAndroid.PERMISSIONS.CAMERA,
			]);
			return ({
				location: result['android.permission.ACCESS_COARSE_LOCATION'] === 'granted',
				camera: result['android.permission.CAMERA'] === 'granted'
			});
		} else if (Platform.OS === 'ios') {
			const locationResult = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
			const cameraResult = await request(PERMISSIONS.IOS.CAMERA);
			return ({
				location: locationResult === 'granted',
				camera: cameraResult === 'granted'
			});
		}
		return ({
			location: false,
			camera: false
		});
	} catch (error) {
		console.error('Error while requesting location permission:', error);
		return ({
			location: false,
			camera: false
		});
	}
}
