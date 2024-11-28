/**
 *	@typedef {Object} Scan
 *	@property {Date} time
 *	@property {boolean} finalDestination
 *	@property {boolean} markedAsReceived
 */

/**
 * @typedef {Object} StatusChanges
 * @property {Date | null} inProgress
 * @property {Date | null} reachedGps
 * @property {Date | null} reachedAndReceived
 * @property {Date | null} received
 * @property {Date | null} validated
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
	return box.scans?.reduce((acc, scan) => {
		return scan.finalDestination && (acc?.time || 0) < scan.time ? scan : acc;
	}, null);
}

/**
 * Returns the last scan with markedAsReceived set to true.
 * Returns null if none found.
 *
 * @param {Box} box
 * @returns {Scan | null}
 */
export function getLastMarkedAsReceivedScan(box) {
	return box.scans?.reduce((acc, scan) => {
		return scan.markedAsReceived && (acc?.time || 0) < scan.time ? scan : acc;
	}, null);
}

/**
 * Returns the last scan with finalDestination set to true and markedAsReceived set to true.
 * Returns null if none found.
 * @param {Box} box
 * @returns {Scan | null}
 */
export function getLastValidatedScan(box) {
	return box.scans?.reduce((acc, scan) => {
		return scan.finalDestination && scan.markedAsReceived && (acc?.time || 0) < scan.time ? scan : acc;
	}, null);
}

/**
 * Returns the progress of the box.
 *
 * @param {Box} box
 * @returns {Progress}
 */
export function getProgress(box) {
	if (!box?.scans || box?.scans?.length === 0) {
		return 'noScans';
	}

	const lastValidatedScan = getLastValidatedScan(box);
	if (lastValidatedScan) {
		return 'validated';
	}

	const lastFinalScan = getLastFinalScan(box);
	const lastReceivedScan = getLastMarkedAsReceivedScan(box);

	if (lastFinalScan && lastReceivedScan) {
		return 'reachedAndReceived';
	}

	if (lastFinalScan) {
		return 'reachedGps';
	}

	if (lastReceivedScan) {
		return 'received';
	}

	return 'inProgress';
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
	sample.forEach(box => {
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
				statusChanges.validated ??= scan.time;
				break;
			}

			if (scan.finalDestination) {
				if (statusChanges.received) {
					statusChanges.reachedAndReceived ??= scan.time;
				} else {
					statusChanges.reachedGps ??= scan.time;
				}
				continue;
			}

			if (scan.markedAsReceived) {
				if (statusChanges.reachedGps) {
					statusChanges.reachedAndReceived ??= scan.time;
				} else {
					statusChanges.received ??= scan.time;
				}
				continue;
			}

			if (Object.values(statusChanges).every(status => !status)) {
				statusChanges.inProgress = scan.time;
			}
		}

		box.statusChanges = statusChanges;
	});
}
