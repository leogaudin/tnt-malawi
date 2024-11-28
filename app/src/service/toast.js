import Toast from 'react-native-toast-message';

/**
 * Shows a toast message.
 *
 * @param {string} type  The type of the toast
 * @param {string} title The title of the toast
 * @param {string} text  The text of the toast
 */
export function showToast(type, title, text) {
	Toast.show({
		type: type,
		text1: title,
		text2: text,
		topOffset: 60,
	});
}
