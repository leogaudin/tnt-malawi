import { getLastFinalScan, getLastInProgressScan, getLastMarkedAsReceivedScan } from "../../service";
import DownloadMenu from "./DownloadMenu";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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

export default function CurrentDelivery({boxes}) {
	const [toExport, setToExport] = useState([]);
	const { t } = useTranslation();

	useEffect(() => {
		const toExport = boxes.map(box => {
			const lastDeliveredScan = getLastFinalScan(box);
			const lastMarkedAsReceivedScan = getLastMarkedAsReceivedScan(box);
			const lastInProgressScan = getLastInProgressScan(box);

			// Calculate the distance between the school and the last delivered scan in meters
			const schoolCoords = {
				latitude: box.schoolLatitude,
				longitude: box.schoolLongitude,
				accuracy: 1
			};

			const deliveredCoords = lastDeliveredScan ? {
				latitude: lastDeliveredScan?.location?.coords.latitude,
				longitude: lastDeliveredScan?.location?.coords.longitude,
				accuracy: lastDeliveredScan?.location?.coords.accuracy
			} : null;

			const receivedCoords = lastMarkedAsReceivedScan ? {
				latitude: lastMarkedAsReceivedScan?.location?.coords.latitude,
				longitude: lastMarkedAsReceivedScan?.location?.coords.longitude,
				accuracy: lastMarkedAsReceivedScan?.location?.coords.accuracy
			} : null;

			const inProgressCoords = lastInProgressScan ? {
				latitude: lastInProgressScan?.location?.coords.latitude,
				longitude: lastInProgressScan?.location?.coords.longitude,
				accuracy: lastInProgressScan?.location?.coords.accuracy
			} : null;

			const deliveredDistanceInMeters = deliveredCoords ? Math.round(haversineDistance(schoolCoords, deliveredCoords)) : '';
			const receivedDistanceInMeters = receivedCoords ? Math.round(haversineDistance(schoolCoords, receivedCoords)) : '';
			const inProgressDistanceInMeters = inProgressCoords ? Math.round(haversineDistance(schoolCoords, inProgressCoords)) : '';

			return {
				id: box.id,
				district: box.district,
				zone: box.zone,
				school: box.school,
				// schoolLatitude: box.schoolLatitude,
				// schoolLongitude: box.schoolLongitude,
				delivered: !!lastDeliveredScan,
				deliveredDistanceInMeters,
				deliveredDate: lastDeliveredScan ? new Date(lastDeliveredScan?.location.timestamp).toLocaleDateString() : '',
				received: !!lastMarkedAsReceivedScan,
				receivedDistanceInMeters,
				receivedDate: lastMarkedAsReceivedScan ? new Date(lastMarkedAsReceivedScan?.location.timestamp).toLocaleDateString() : '',
				inProgress: !!lastInProgressScan,
				inProgressDistanceInMeters,
				inProgressDate: lastInProgressScan ? new Date(lastInProgressScan?.location.timestamp).toLocaleDateString() : '',
				validated: !!lastMarkedAsReceivedScan && !!lastDeliveredScan,
			}
		});
		setToExport(toExport);
	}, [boxes]);

	return (
		<DownloadMenu data={toExport} title={t('currentDeliveryReport')} detail={t('currentDeliveryReportDetail')}/>
	);
}
