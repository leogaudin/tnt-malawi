import express from 'express';
import Admin from '../models/admins.model.js';
import Box from '../models/boxes.model.js';
import Scan from '../models/scans.model.js';
import { getQuery, haversineDistance } from '../service/index.js';
import { getLastScanWithConditions } from '../service/stats.js';
import fs from 'fs';
import path from 'path';
import { requireApiKey } from '../service/apiKey.js';

const router = express.Router();

/**
 * @description	Toggles the publicInsights setting
 */
router.post('/toggle', async (req, res) => {
	try {
		const apiKey = req.headers['x-authorization'];

		if (!apiKey)
			return res.status(401).json({ message: 'Unauthorized' });

		const admin = await Admin.findOne({ apiKey });

		if (!admin)
			return res.status(404).json({ message: 'Admin not found' });

		admin.publicInsights = !!!admin.publicInsights;
		await admin.save();
		return res.status(200).json({ message: 'Successfully set insights to ' + admin.publicInsights, publicInsights: admin.publicInsights });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Internal server error' });
	}
});

/**
 * @description	Retrieve the status changes of the current admin's boxes
 */
router.post('/', async (req, res) => {
	try {
		const { skip, limit, filters } = getQuery(req);
		if (!filters.adminId)
			return res.status(400).json({ error: 'Admin ID required' });

		const admin = await Admin.findOne({ id: filters.adminId });
		if (!admin)
			return res.status(404).json({ error: `Admin not found` });

		if (admin.publicInsights || req.headers['x-authorization'] === admin.apiKey) {
			const boxes = await Box
							.find(
								{ ...filters },
								{ project: 1, statusChanges: 1, content: 1, _id: 0 }
							)
							.skip(skip)
							.limit(limit);

			if (!boxes.length)
				return res.status(404).json({ error: `No boxes available` });

			return res.status(200).json({ boxes });
		} else {
			return res.status(401).json({ error: `Unauthorized` });
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: error });
	}
});

/**
 * @description	Retrieve a partial or full report of the current admin's boxes
 */
router.post('/report', async (req, res) => {
	try {
		const reportFields = [
			'school',
			'district',
		];

		const { skip, limit, filters } = getQuery(req);
		if (!filters.adminId)
			return res.status(400).json({ error: 'Admin ID required' });

		const admin = await Admin.findOne({ id: filters.adminId });
		if (!admin)
			return res.status(404).json({ error: `Admin not found` });

		if (admin.publicInsights || req.headers['x-authorization'] === admin.apiKey) {
			const boxes = await Box
							.find(
								{ ...filters },
								`id schoolLatitude schoolLongitude statusChanges lastScan content createdAt ${reportFields.join(' ')}`
							)
							.skip(skip)
							.limit(limit);

			if (!boxes.length)
				return res.status(404).json({ error: `No boxes available` });

			const scanIds = [];
			for (const box of boxes) {
				if (box.lastScan?.scan) {
					scanIds.push(box.lastScan.scan);
				}
				for (const [_, change] of Object.entries(box.statusChanges || {})) {
					if (change && change.scan) {
						scanIds.push(change.scan);
					}
				}
			}

			const scans = await Scan.find({ id: { $in: scanIds } });

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

			const toExport = [];

			for (const box of boxes) {
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
					latitude: lastMarkedAsReceivedScan.location.coords.latitude,
					longitude: lastMarkedAsReceivedScan.location.coords.longitude,
					accuracy: lastMarkedAsReceivedScan.location.coords.accuracy
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

				const row = {
					...result,
					schoolLatitude: box.schoolLatitude,
					schoolLongitude: box.schoolLongitude,
					lastScanLatitude: lastScan?.location?.coords.latitude || '',
					lastScanLongitude: lastScan?.location?.coords.longitude || '',
					lastScanDistanceInMeters,
					lastScanDate: lastScan ? new Date(lastScan?.location.timestamp).toLocaleDateString() : '',
					reachedGps: Number(Boolean(lastReachedScan)),
					reachedDate: lastReachedScan ? new Date(lastReachedScan?.location.timestamp).toLocaleDateString() : '',
					received: Number(Boolean(lastMarkedAsReceivedScan)),
					receivedDistanceInMeters,
					receivedDate: lastMarkedAsReceivedScan ? new Date(lastMarkedAsReceivedScan?.location.timestamp).toLocaleDateString() : '',
					validated: Number(Boolean(lastValidatedScan)),
					validatedDate: lastValidatedScan ? new Date(lastValidatedScan?.location.timestamp).toLocaleDateString() : '',
					...(box.content || {}),
				}

				toExport.push(row);
			}

			return res.status(200).json({ boxes: toExport });
		} else {
			return res.status(401).json({ error: `Unauthorized` });
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: error });
	}
});

/**
 * @description	Retrieve the emails associated with each project,
 * (i.e. the emails to send a report to)
 */
router.get('/emails', async (req, res) => {
	try {
		const adminId = req.query.adminId;
		if (!adminId)
			return res.status(400).json({ error: 'Admin ID required' });

		const admin = await Admin.findOne({ id: adminId });
		if (!admin)
			return res.status(404).json({ error: `Admin not found` });

		if (admin.publicInsights || req.headers['x-authorization'] === admin.apiKey) {
			const emails = admin.projectEmails || {};
			return res.status(200).json({ emails });
		}
	}
	catch (error) {
		console.error(error);
		return res.status(500).json({ error: error });
	}
})

/**
 * @description	Updates the emails associated with each project
 */
router.post('/emails', async (req, res) => {
	try {
		requireApiKey(req, res, async (admin) => {
			admin.projectEmails = req.body.emails;
			await admin.save();

			// Write the admin ID to a file on the server
			// ONLY UNCOMMENT THIS IF SERVER IS SETUP ACCORDINGLY
			//
			// const folder = path.join('/Users/leogaudin/Downloads/');
			// if (!fs.existsSync(folder)) {
			// 	fs.mkdirSync(folder, { recursive: true });
			// }
			// const filePath = path.join(folder, 'daily_report_emails.txt');
			// if (!fs.existsSync(filePath)) {
			// 	fs.writeFileSync(filePath, '', 'utf8');
			// }
			// const content = fs.readFileSync(filePath, 'utf8');
			// const emails = content.split(',').map(email => email.trim()).filter(email => email !== '');
			// emails.push(admin.id);
			// const uniqueEmails = [...new Set(emails)];
			// const newContent = uniqueEmails.join(',');
			// fs.writeFileSync(filePath, newContent, 'utf8');
			return res.status(200).json({ message: 'Emails updated successfully' });
		});
	}
	catch (error) {
		console.error(error);
		return res.status(500).json({ error: error });
	}
});

export default router;
