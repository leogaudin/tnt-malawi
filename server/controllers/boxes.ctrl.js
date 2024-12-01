import express from 'express';
import Admin from '../models/admins.model.js';
import Box from '../models/boxes.model.js';
import {
	createOne,
	createMany,
	deleteOne,
	getById,
	getAll,
	deleteMany,
} from '../service/crud.js';
import { requireApiKey } from '../service/apiKey.js';
import { isFinalDestination } from '../service/index.js';
import { indexStatusChanges } from '../service/stats.js';

const router = express.Router();

router.post('/box', createOne(Box));
router.post('/boxes', createMany(Box));
router.delete('/box/:id', deleteOne(Box));
router.delete('/boxes', deleteMany(Box))
// router.get('/box/:id', getById(Box));
// router.get('/boxes', getAll(Box));
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
		const { boxes } = req.body;

		requireApiKey(req, res, async (admin) => {
			const boxUpdate = boxes.map((box) => {
				return {
					updateMany: {
						filter: { school: box.school, district: box.district, adminId: admin.id },
						update: { $set: { schoolLatitude: box.schoolLatitude, schoolLongitude: box.schoolLongitude } },
						multi: true,
					},
				};
			});

			const boxUpdateResult = await Box.bulkWrite(boxUpdate);
			const updated = boxUpdateResult.modifiedCount;
			const matched = boxUpdateResult.matchedCount;

			if (updated === 0)
				return res.status(200).json({ success: true, updated, matched, recalculated: 0 });

			const boxesToUpdate = await Box.find({
				adminId: admin.id,
				$or: boxes.map((box) => ({ school: box.school, district: box.district }))
			});

			const scansUpdate = boxesToUpdate
				.filter((box) => {
					const boxFromRequest = boxes.find((b) => b.school === box.school && b.district === box.district);
					return boxFromRequest.schoolLatitude !== box.schoolLatitude || boxFromRequest.schoolLongitude !== box.schoolLongitude;
				})
				.map((box) => {
					const newScans = box.scans.map((scan) => {
						const schoolCoords = {
							latitude: boxFromRequest.schoolLatitude,
							longitude: boxFromRequest.schoolLongitude,
						};
						const scanCoords = {
							latitude: scan.location.coords.latitude,
							longitude: scan.location.coords.longitude,
						};
						scan.finalDestination = isFinalDestination(schoolCoords, scanCoords);
						return scan;
					});

					if (newScans.some((scan, index) => scan.finalDestination !== box.scans[index].finalDestination)) {
						return {
							updateOne: {
								filter: { id: box.id },
								update: { $set: { scans: box.scans } },
							},
						};
					}
				});

			const scansUpdateResult = await Box.bulkWrite(scansUpdate);
			const recalculated = scansUpdateResult.modifiedCount;

			return res.status(200).json({ success: true, updated, matched, recalculated });
		});
	} catch (error) {
		console.error(error);
		return res.status(400).json({ success: false, error: error });
	}
});

export default router;
