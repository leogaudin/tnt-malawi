import express from 'express';
import Admin from '../models/admins.model.js';
import Box from '../models/boxes.model.js';
import Scan from '../models/scans.model.js';
import {
	createOne,
	createMany,
	deleteOne,
	getById,
	getAll,
	deleteMany,
} from '../service/crud.js';
import { requireApiKey } from '../service/apiKey.js';
import { isFinalDestination, getQuery } from '../service/index.js';
import { indexStatusChanges } from '../service/stats.js';

const router = express.Router();

router.post('/box', createOne(Box));
router.post('/boxes', createMany(Box));
router.delete('/box/:id', deleteOne(Box));
router.delete('/boxes', deleteMany(Box))
// router.get('/box/:id', getById(Box));
// router.get('/boxes', getAll(Box));

/**
 * @description	Retrieve all boxes for the provided filters
 */
router.post('/boxes/query', async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const found = await Admin.findOne({ id: admin.id });
			if (!found)
				return res.status(404).json({ error: `Admin not found` });

			const { skip, limit, filters } = getQuery(req);

			const boxes = await Box
				.find(
					{ ...filters, adminId: admin.id },
					{ scans: 0 },
				)
				.skip(skip)
				.limit(limit);

			if (!boxes.length)
				return res.status(404).json({ error: `No boxes available` });

			return res.status(200).json({ boxes });
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error });
	}
});

/**
 * @description	Retrieve the count of boxes for the provided filters
 */
router.post('/boxes/count', async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const { filters } = getQuery(req);
			const count = await Box.countDocuments({ ...filters, adminId: admin.id });
			return res.status(200).json({ count });
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error });
	}
});

router.get('/box/:id', async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const box = await Box.findOne({ id: req.params.id, adminId: admin.id });
			if (!box)
				return res.status(404).json({ success: false, error: `Box not found` });

			return res.status(200).json({ success: true, data: { box } });
		});
	}
	catch (error) {
		console.error(error);
		return res.status(400).json({ success: false, error: error });
	}
});

router.get('/boxes/:adminId', async (req, res) => {
	try {
		const found = await Admin.findOne({ id: req.params.adminId });
		if (!found)
			return res.status(404).json({ success: false, error: `Admin not found` });

		if (found.publicInsights && !req.headers['x-authorization']) {
			const boxes = await Box.find({ adminId: req.params.adminId }, 'statusChanges project').skip(parseInt(req.query.skip)).limit(parseInt(req.query.limit));

			if (!boxes.length)
				return res.status(404).json({ success: false, error: `No boxes available` });

			return res.status(200).json({
				success: true,
				data: {
					boxes: boxes.map(box => ({
						statusChanges: box.statusChanges,
						project: box.project,
					}))
				}
			});
		}

		requireApiKey(req, res, async (admin) => {
			if (admin.id !== req.params.adminId)
				return res.status(401).json({ success: false, error: `Unauthorized` });

			const boxes = await Box.find({ adminId: req.params.adminId }, { scans: 0 }).skip(parseInt(req.query.skip)).limit(parseInt(req.query.limit));

			if (!boxes.length)
				return res.status(404).json({ success: false, error: `No boxes available` });

			return res.status(200).json({ success: true, data: { boxes } });
		});
	} catch (error) {
		console.error(error);
		return res.status(400).json({ success: false, error: error });
	}
});

router.post('/boxes/coords', async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const { coords } = req.body;
			const coordsUpdate = coords.map((box) => {
				return {
					updateMany: {
						filter: { schoolCode: box.schoolCode, adminId: admin.id },
						update: { $set: { schoolLatitude: box.schoolLatitude, schoolLongitude: box.schoolLongitude } },
						multi: true,
					},
				};
			});

			const coordsUpdateResult = await Box.bulkWrite(coordsUpdate);
			const updated = coordsUpdateResult.modifiedCount;
			const matched = coordsUpdateResult.matchedCount;

			if (updated === 0)
				return res.status(200).json({ updated, matched, recalculated: 0 });

			const boxes = await Box
				.find(
					{
						adminId: admin.id,
						$or: coords.map((box) => ({ school: box.school, district: box.district }))
					},
					{ schoolLatitude: 1, schoolLongitude: 1, id: 1, _id: 0 }
				);

			const scans = await Scan.find({ boxId: { $in: boxes.map((box) => box.id) } });

			const scansUpdate = [];

			scans.forEach((scan) => {
				const box = boxes.find((box) => box.id === scan.boxId);
				if (!box) return;
				const schoolCoords = {
					latitude: box.schoolLatitude,
					longitude: box.schoolLongitude,
				};
				const scanCoords = {
					latitude: scan.location.coords.latitude,
					longitude: scan.location.coords.longitude,
				};
				const newFinalDestination = isFinalDestination(schoolCoords, scanCoords);

				if (newFinalDestination !== scan.finalDestination) {
					scan.finalDestination = newFinalDestination;
					scansUpdate.push({
						updateOne: {
							filter: { id: scan.id },
							update: { $set: { finalDestination: scan.finalDestination } },
						},
					});
				}
			});

			const scansUpdateResponse = await Scan.bulkWrite(scansUpdate);
			const recalculated = scansUpdateResponse.modifiedCount;

			boxes.forEach((box) => {
				const newScans = scans.filter((scan) => scan.boxId === box.id);
				box.scans = newScans;
			});

			const indexing = indexStatusChanges(boxes);
			await Box.bulkWrite(indexing);

			return res.status(200).json({ updated, matched, recalculated });
		});
	} catch (error) {
		console.error(error);
		return res.status(400).json({ success: false, error: error });
	}
});

router.post('/boxes/reindex', async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const boxes = await Box.find({ adminId: admin.id });
			if (!boxes.length)
				return res.status(404).json({ error: `No boxes available` });

			const scans = await Scan.find({ boxId: { $in: boxes.map((box) => box.id) } });

			boxes.forEach((box) => {
				const newScans = scans.filter((scan) => scan.boxId === box.id);
				box.scans = newScans;
			});

			const indexing = indexStatusChanges(boxes);
			const response = await Box.bulkWrite(indexing);

			return res.status(200).json({ reindexed: response.modifiedCount });
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error });
	}
});

router.post('/boxes/recalculate', async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			const boxes = await Box.find({ adminId: admin.id });
			if (!boxes.length)
				return res.status(404).json({ error: `No boxes available` });

			const scans = await Scan.find({ boxId: { $in: boxes.map((box) => box.id) } });

			const scansUpdate = [];

			scans.forEach((scan) => {
				const box = boxes.find((box) => box.id === scan.boxId);
				if (!box) return;
				const schoolCoords = {
					latitude: box.schoolLatitude,
					longitude: box.schoolLongitude,
				};
				const scanCoords = {
					latitude: scan.location.coords.latitude,
					longitude: scan.location.coords.longitude,
				};
				const newFinalDestination = isFinalDestination(schoolCoords, scanCoords);

				if (newFinalDestination !== scan.finalDestination) {
					scan.finalDestination = newFinalDestination;
					scansUpdate.push({
						updateOne: {
							filter: { id: scan.id },
							update: { $set: { finalDestination: scan.finalDestination } },
						},
					});
				}
			});

			const scansUpdateResponse = await Scan.bulkWrite(scansUpdate);
			const recalculated = scansUpdateResponse.modifiedCount;

			boxes.forEach((box) => {
				const newScans = scans.filter((scan) => scan.boxId === box.id);
				box.scans = newScans;
			});

			const indexing = indexStatusChanges(boxes);
			const response = await Box.bulkWrite(indexing);

			return res.status(200).json({ recalculated, reindexed: response.modifiedCount });
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error });
	}
});

export default router;
