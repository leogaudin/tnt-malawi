import { saveAs } from 'file-saver';
import { json2csv } from 'json-2-csv';
import {
	Menu,
	MenuButton,
	MenuList,
	MenuItem,
	Button,
	Icon,
	HStack,
	Text,
	Stack,
} from '@chakra-ui/react';
import { fetchBoxes, fetchScans, icons } from '../../../service';
import { useTranslation } from 'react-i18next';
import { getLastScanWithConditions } from '../../../service/stats';
import { haversineDistance } from '../../../service/utils';
import { reportFields } from '../../../service/specific';
import { useState } from 'react';

function downloadJson(data, filename) {
	const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
	saveAs(blob, filename + '.json');
}

function downloadCSV(data, filename) {
	const csv = json2csv(data, {});
	const blob = new Blob([csv], { type: 'text/csv' });
	saveAs(blob, filename + '.csv');
}

export default function Report({ filters }) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [loadingText, setLoadingText] = useState('');

	const handleDownload = async (format) => {
		try {
			setLoading(true);
			setLoadingText(t('boxesLoading'));
			const boxes = await fetchBoxes(filters);

			if (!boxes || !boxes.length) {
				throw new Error('No boxes available');
			}

			setLoadingText(t('scansLoading'));

			const scanIds = [];
			for (const box of boxes) {
				if (box.lastScan?.scan) {
					scanIds.push(box.lastScan.scan);
				}
				for (const [key, change] of Object.entries(box.statusChanges || {})) {
					if (change && change.scan) {
						scanIds.push(change.scan);
					}
				}
			}

			const scans = await fetchScans({ id: { $in: scanIds } });

			const indexedScans = scans.reduce((acc, scan) => {
				if (!acc[scan.boxId]) {
					acc[scan.boxId] = [];
				}
				acc[scan.boxId].push(scan);
				return acc;
			}, {});

			boxes.forEach(box => {
				box.scans = indexedScans[box.id] || [];
			});

			setLoadingText(t('processingData'));
			const toExport = boxes.map(box => {
				const lastReachedScan = getLastScanWithConditions(box.scans, ['finalDestination']);
				const lastMarkedAsReceivedScan = getLastScanWithConditions(box.scans, ['markedAsReceived']);
				const lastValidatedScan = getLastScanWithConditions(box.scans, ['finalDestination', 'markedAsReceived']);
				const lastScan = getLastScanWithConditions(box.scans, []);

				const schoolCoords = {
					latitude: box.schoolLatitude,
					longitude: box.schoolLongitude,
					accuracy: 1
				};

				const receivedCoords = lastMarkedAsReceivedScan ? {
					latitude: lastMarkedAsReceivedScan?.location?.coords.latitude,
					longitude: lastMarkedAsReceivedScan?.location?.coords.longitude,
					accuracy: lastMarkedAsReceivedScan?.location?.coords.accuracy
				} : null;

				const receivedDistanceInMeters = receivedCoords ? Math.round(haversineDistance(schoolCoords, receivedCoords)) : '';
				const lastScanDistanceInMeters = lastScan ? Math.round(haversineDistance(schoolCoords, lastScan.location.coords)) : '';

				const result = {
					id: box.id,
				};

				reportFields.forEach(field => {
					if (box[field]) {
						result[field] = box[field];
					}
				});

				const raw = {
					...result,
					schoolLatitude: box.schoolLatitude,
					schoolLongitude: box.schoolLongitude,
					lastScanLatitude: lastScan?.location?.coords.latitude || '',
					lastScanLongitude: lastScan?.location?.coords.longitude || '',
					lastScanDistanceInMeters,
					lastScanDate: lastScan ? new Date(lastScan?.location.timestamp).toLocaleDateString() : '',
					reachedGps: !!lastReachedScan & 1,
					reachedDate: lastReachedScan ? new Date(lastReachedScan?.location.timestamp).toLocaleDateString() : '',
					received: !!lastMarkedAsReceivedScan & 1,
					receivedDistanceInMeters,
					receivedDate: lastMarkedAsReceivedScan ? new Date(lastMarkedAsReceivedScan?.location.timestamp).toLocaleDateString() : '',
					validated: !!lastValidatedScan & 1,
					validatedDate: lastValidatedScan ? new Date(lastValidatedScan?.location.timestamp).toLocaleDateString() : '',
					...(box.content || {}),
				}

				const translated = Object.keys(raw).reduce((acc, key) => {
					acc[t(key)] = raw[key]
					return acc;
				}, {});

				return translated;
			});

			setLoading(false);
			setLoadingText('');

			const title = `${t('currentDeliveryReport')} - ${new Date().toISOString().slice(0, 10)}`;

			if (format === 'csv') {
				downloadCSV(toExport, title);
			} else {
				downloadJson(toExport, title);
			}
		} catch (error) {
			console.error(error);
			setLoading(false);
			setLoadingText('');
		}
	}

	return (
		<Menu>
			<MenuButton
				as={Button}
				variant='outline'
				size='lg'
				paddingY='1rem'
				height='fit-content'
				isLoading={loading}
				loadingText={loadingText}
			>
				<HStack
					width='100%'
					gap={5}
				>
					<Icon
						as={icons.clock}
						boxSize={5}
					/>
					<Stack
						flexDirection='column'
						alignItems='start'
						textAlign='start'
					>
						<Text>{t('currentDeliveryReport')}</Text>
						<Text fontWeight='light' whiteSpace='normal'>{t('currentDeliveryReportDetail')}</Text>
					</Stack>
				</HStack>
			</MenuButton>
			<MenuList>
				<MenuItem
					onClick={() => handleDownload('csv')}
				>
					CSV
				</MenuItem>
				<MenuItem
					onClick={() => handleDownload('json')}
				>
					JSON
				</MenuItem>
			</MenuList>
		</Menu>
	)
}
