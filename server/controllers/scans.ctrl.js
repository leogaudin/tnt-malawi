import Box from '../models/boxes.model.js';
import Scan from '../models/scans.model.js';
import express from 'express'
import { generateId, isFinalDestination, getQuery } from '../service/index.js';
import { getProgress } from '../service/stats.js';
import { requireApiKey } from '../service/apiKey.js';

const router = express.Router();

/**
 * @description	Retrieve all scans for the provided filters
 */
router.post('/scan/query', async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const { skip, limit, filters } = getQuery(req);

			const scans = await Scan
								.find({ ...filters, adminId: admin.id })
								.skip(skip)
								.limit(limit)
								// .sort({ time: -1 });

			return res.status(200).json({ scans });
		});
	} catch (error) {
		console.error('Error getting scans:', error);
		return res.status(500).json({ error: 'An error occurred while getting scans' });
	}
});

/**
 * @description	Retrieve the count of scans for the provided filters
 */
router.post('/scan/count', async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const { filters } = getQuery(req);
			const count = await Scan.countDocuments({ ...filters, adminId: admin.id });
			return res.status(200).json({ count });
		});
	} catch (error) {
		console.error('Error getting scans count:', error);
		return res.status(500).json({ error: 'An error occurred while getting scans count' });
	}
});

router.get('/scans/count', async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const count = await Scan.countDocuments({ adminId: admin.id, ...req.query });
			return res.status(200).json({ success: true, data: { count } });
		});
	} catch (error) {
		console.error(error);
		return res.status(400).json({ success: false, error: error });
	}
});

router.get('/scans', async (req, res) => {
	try {
		const skip = parseInt(req.query.skip);
		const limit = parseInt(req.query.limit);
		delete req.query.skip;
		delete req.query.limit;

		requireApiKey(req, res, async (admin) => {
			const filters = {
				adminId: admin.id,
				...req.query,
			};

			const scans = await Scan
								.find(filters)
								.skip(skip)
								.limit(limit)
								.sort({ time: -1 });

			if (!scans.length)
				return res.status(404).json({ success: false, error: `No scans available` });

			return res.status(200).json({ success: true, data: { scans } });
		});
	} catch (error) {
		console.error('Error getting scans:', error);
		return res.status(500).json({ error: 'An error occurred while getting scans' });
	}
});

router.post('/scans', async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const { filters } = req.body;

			const scans = await Scan.find({ ...filters, adminId: admin.id });

			return res.status(200).json({ data: { scans } });
		});
	} catch (error) {
		console.error('Error getting scans:', error);
		return res.status(500).json({ error: 'An error occurred while getting scans' });
	}
});

router.get('/box/:id/scans', async (req, res) => {
	try {
		const { id } = req.params;

		requireApiKey(req, res, async (admin) => {
			const box = await Box.findOne({ id });

			if (!box)
				return res.status(404).json({ success: false, error: `Box not found` });

			if (box.adminId !== admin.id)
				return res.status(401).json({ success: false, error: `Unauthorized` });

			const filters = {
				boxId: id,
			};

			const scans = await Scan.find(filters)

			return res.status(200).json({ success: true, data: { scans } });
		});
	} catch (error) {
		console.error(error);
		return res.status(400).json({ success: false, error: error });
	}
});

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
			boxId,
			adminId: box.adminId,
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
			received: null,
			reachedGps: null,
			reachedAndReceived: null,
			validated: null,
		};

		if (scan.finalDestination && scan.markedAsReceived && !statusChanges.validated) {
			statusChanges.validated = { scan: scan.id, time: scan.time };
		}
		else if (scan.finalDestination) {
			if (statusChanges.received && !statusChanges.reachedAndReceived) {
				statusChanges.reachedAndReceived = { scan: scan.id, time: scan.time };
			}
			else if (!statusChanges.reachedGps) {
				statusChanges.reachedGps = { scan: scan.id, time: scan.time };
			}
		}
		else if (scan.markedAsReceived) {
			if (statusChanges.reachedGps && !statusChanges.reachedAndReceived) {
				statusChanges.reachedAndReceived = { scan: scan.id, time: scan.time };
			}
			else if (!statusChanges.received) {
				statusChanges.received = { scan: scan.id, time: scan.time };
			}
		}

		else if (Object.values(statusChanges).every(status => !status)) {
			statusChanges.inProgress = { scan: scan.id, time: scan.time };
		}

		const newScan = new Scan(scan);
		await newScan.save();

		await Box.updateOne({ id: boxId }, {
			// $push: { scans: scan },
			$set: {
				statusChanges,
				progress: getProgress({ statusChanges }),
				lastScan: { scan: newScan.id, time: newScan.time },
			},
		});

		return res.status(200).json({ message: 'Scan added successfully', newScan });
	} catch (error) {
		console.error('Error adding scan:', error);
		return res.status(500).json({ error: 'An error occurred while adding the scan' });
	}
});

export default router;
