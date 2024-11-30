import Box from '../models/boxes.model.js';
import express from 'express'
import { generateId, isFinalDestination } from '../service/index.js';
import { getProgress } from '../service/stats.js';

const router = express.Router()

router.post('/scan', async (req, res) => {
	try {
		const { boxId, comment, operatorId, time, location, markedAsReceived } = req.body;

		const box = await Box.findOne({ id: boxId });

		if (!box)
			return res.status(404).json({ error: 'Box not found' });

		const schoolCoords = {
			latitude: box.schoolLatitude,
			longitude: box.schoolLongitude,
		};

		const scanCoords = {
			latitude: location.coords.latitude,
			longitude: location.coords.longitude,
			accuracy: location.coords.accuracy
		};

		const scan = {
			id: generateId(),
			comment,
			operatorId,
			location,
			time: Date.now(),
			markedAsReceived,
			finalDestination: isFinalDestination(schoolCoords, scanCoords),
		};

		const statusChanges = box.statusChanges || {
			inProgress: null,
			reachedGps: null,
			reachedAndReceived: null,
			received: null,
			validated: null,
		};

		if (scan.finalDestination && scan.markedAsReceived) {
			statusChanges.validated ??= scan.time;
		}
		else if (scan.finalDestination) {
			if (statusChanges.received) {
				statusChanges.reachedAndReceived ??= scan.time;
			} else {
				statusChanges.reachedGps ??= scan.time;
			}
		}
		else if (scan.markedAsReceived) {
			if (statusChanges.reachedGps) {
				statusChanges.reachedAndReceived ??= scan.time;
			} else {
				statusChanges.received ??= scan.time;
			}
		}
		else if (Object.values(statusChanges).every(status => !status)) {
			statusChanges.inProgress = scan.time;
		}

		await Box.updateOne({ id: boxId }, {
			$push: { scans: scan },
			$set: { statusChanges, progress: getProgress(box) }
		});

		return res.status(200).json({ message: 'Scan added successfully', box });
	} catch (error) {
		console.error('Error adding scan:', error);
		return res.status(500).json({ error: 'An error occurred while adding the scan' });
	}
});

export default router;
