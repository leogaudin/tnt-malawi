/**
 *	@typedef {Object} Scan
 *	@property {Date} time
 *	@property {boolean} finalDestination
 *	@property {boolean} markedAsReceived
 */

/**
 * @typedef {Object} StatusChange
 * @property {string} scan
 * @property {number} time
 */

/**
 * @typedef {Object} StatusChanges
 * @property {Object | null} inProgress
 * @property {Object | null} reachedGps
 * @property {Object | null} reachedAndReceived
 * @property {Object | null} received
 * @property {Object | null} validated
 */

/**
 * @typedef {Object} Box
 * @property {Array<Scan>} scans
 * @property {StatusChanges} statusChanges
 */

/**
 * @typedef {'noScans' | 'inProgress' | 'reachedGps' | 'received' | 'reachedAndReceived' | 'validated'} Progress
 */

/**
 * Returns the last scan with finalDestination set to true.
 * Returns null if none found.
 *
 * @param {Box} box
 * @returns {Scan | null}
 */
export function getLastFinalScan(box) {
	let last = null;
	for (const scan of box.scans) {
		if (scan.finalDestination && scan.time > (last?.time || 0)) {
			last = scan;
		}
	}
	return last;
}

/**
 * Returns the last scan with markedAsReceived set to true.
 * Returns null if none found.
 *
 * @param {Box} box
 * @returns {Scan | null}
 */
export function getLastMarkedAsReceivedScan(box) {
	let last = null;
	for (const scan of box.scans) {
		if (scan.markedAsReceived && scan.time > (last?.time || 0)) {
			last = scan;
		}
	}
	return last;
}

/**
 * Returns the last scan with finalDestination set to true and markedAsReceived set to true.
 * Returns null if none found.
 * @param {Box} box
 * @returns {Scan | null}
 */
export function getLastValidatedScan(box) {
	let last = null;
	for (const scan of box.scans) {
		if (scan.finalDestination && scan.markedAsReceived && scan.time > (last?.time || 0)) {
			last = scan;
		}
	}
	return last;
}

/**
 * Returns the progress of the box.
 *
 * @param {Box} box
 * @returns {Progress}
 */
export function getProgress(box, notAfterTimestamp = Date.now()) {
	if (box.statusChanges) {
		let lastStatus = 'noScans';

		for (const [status, change] of Object.entries(box.statusChanges)) {
			if (change?.time && change.time <= notAfterTimestamp) {
				lastStatus = status;
			}
		}

		return lastStatus;
	}
	// Legacy code
	// if (!box?.scans || box?.scans?.length === 0) {
	// 	return 'noScans';
	// }

	// const scans = box.scans.filter(scan => scan.time <= notAfterTimestamp);
	// box = { ...box, scans };

	// const lastValidatedScan = getLastValidatedScan(box);
	// if (lastValidatedScan) {
	// 	return 'validated';
	// }

	// const lastFinalScan = getLastFinalScan(box);
	// const lastReceivedScan = getLastMarkedAsReceivedScan(box);

	// if (lastFinalScan && lastReceivedScan) {
	// 	return 'reachedAndReceived';
	// }

	// if (lastFinalScan) {
	// 	return 'reachedGps';
	// }

	// if (lastReceivedScan) {
	// 	return 'received';
	// }

	// return 'inProgress';
}

/**
 *
 * Adds to each box an object of statuses.
 * For each status, determine when it was reached for the first time.
 * Mutates the input array.
 *
 * @param {Array<Box>} sample	Boxes to index
 */
export function indexStatusChanges(sample) {
	return sample.map(box => {
		const scans = box.scans;
		scans.sort((a, b) => a.time - b.time); // First scan is the oldest

		const statusChanges = {
			inProgress: null,
			reachedGps: null,
			reachedAndReceived: null,
			received: null,
			validated: null
		};

		for (const scan of scans) {
			if (scan.finalDestination && scan.markedAsReceived) {
				statusChanges.validated ??= { scan: scan.id, time: scan.time };
			}
			else if (scan.finalDestination) {
				if (statusChanges.received) {
					statusChanges.reachedAndReceived ??= { scan: scan.id, time: scan.time };
				} else {
					statusChanges.reachedGps ??= { scan: scan.id, time: scan.time };
				}
			}
			else if (scan.markedAsReceived) {
				if (statusChanges.reachedGps) {
					statusChanges.reachedAndReceived ??= { scan: scan.id, time: scan.time };
				} else {
					statusChanges.received ??= { scan: scan.id, time: scan.time };
				}
			}
			else if (Object.values(statusChanges).every(status => !status)) {
				statusChanges.inProgress = { scan: scan.id, time: scan.time };
			}
		}

		return {
			updateOne: {
				filter: { id: box.id },
				update: { $set: { statusChanges, progress: getProgress(box) } }
			}
		}
	});
}
