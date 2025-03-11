import { useState, useEffect, useContext } from 'react';
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import Geolocation from '@react-native-community/geolocation';
import styles from '../theme/styles';
import { showToast } from '../service/toast';
import { Modal, Text, TextInput, Portal, Button } from 'react-native-paper';
import { sendScan } from '../service/api';
import AppContext from '../context';

export default function SendScanModal({ modalVisible, setModalVisible, data }) {
	const [userLocation, setUserLocation] = useState();
	const [comment, setComment] = useState('');
	const [toggled, setToggled] = useState(false);
	const { login, hasInternetConnection, setOfflineData } = useContext(AppContext);

	const handleSubmit = () => {
		const scan = {
			boxId: data,
			operatorId: login,
			time: Date.now(),
			location: userLocation,
			markedAsReceived: toggled,
			comment: comment,
		};
		setModalVisible(false);
		resetData();
		if (hasInternetConnection) {
			sendScan(scan)
				.catch(err => {
					setOfflineData((prev) => [...prev, scan]);
				});
		} else {
			setOfflineData((prev) => [...prev, scan]);
			showToast(
				'info',
				'No internet connection',
				'Scan will be sent when connection is restored',
			);
		}
	};

	useEffect(() => {
		if (modalVisible) {
			Geolocation.getCurrentPosition(
				(position) => {
					setUserLocation(position);
				},
				(error) => {
					if (error.code === 3) {
						showToast('error', 'Timeout', 'The location search has timed out.');
					}
				},
				{
					enableHighAccuracy: false,
					timeout: 10000,
					maximumAge: 10000,
				},
			);
		}
	}, [modalVisible]);

	function resetData() {
		setUserLocation(null);
		setComment('');
		setToggled(false);
	}

	return (
		<Portal>
			<Modal
				style={[styles.view]}
				visible={modalVisible}
			>
				<KeyboardAvoidingView
					style={{ flex: 1 }}
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
					<TouchableWithoutFeedback
						onPress={Keyboard.dismiss}
						accessible={false}
					>
						<View style={styles.modalContainer}>
							<View style={styles.modal}>
								<Text style={[styles.title]}>
									Box n°{data}
								</Text>
								<View
									style={{
										flexDirection: 'column',
										alignItems: 'center',
										marginVertical: 15,
									}}
								>
									<Text style={{ fontWeight: 'bold' }}>Location</Text>
									<Text>
										{userLocation
											? `(${userLocation.coords.latitude}, ${userLocation.coords.longitude})`
											: `Determining...`
										}
									</Text>
								</View>
								<TextInput
									mode='outlined'
									value={comment}
									onChangeText={text => setComment(text)}
									style={{ width: '100%' }}
									placeholder='Add a comment...'
									maxLength={140}
								/>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										marginVertical: 15,
									}}>
									<CheckBox
										value={toggled}
										onValueChange={newValue => setToggled(newValue)}
										style={{ marginRight: 10 }}
										tintColors={{ true: '#007AFF', false: '#C7C7CC' }}
									/>
									<Text>Mark as received (HT only)</Text>
								</View>
								<View style={[styles.horizontal]}>
									<Button
										mode='outlined'
										style={{ margin: 5 }}
										onPress={() => {
											setModalVisible(false);
											resetData();
										}}>
										Cancel
									</Button>
									<Button
										disabled={!userLocation}
										mode='contained'
										style={{ margin: 5 }}
										onPress={handleSubmit}
									>
										Send
									</Button>
								</View>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</KeyboardAvoidingView>
			</Modal>
		</Portal>
	);
}
