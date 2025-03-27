
/**
 * @typedef {'noScans' | 'inProgress' | 'reachedGps' | 'received' | 'reachedAndReceived' | 'validated'} Progress
 */

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
 * @property {string} project
 * @property {Progress} progress
 * @property {Object} content
 */

/**
 * Returns the last scan that meets the conditions.
 * Returns null if none found.
 * @param {Box} box
 * @param {Array<string>} conditions
 * @returns {Scan | null}
 */
export function getLastScanWithConditions(scans, conditions = []) {
	let last = null;
	for (const scan of (scans || [])) {
		if (scan.time > (last?.time || 0) && conditions.every(condition => scan[condition])) {
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
    let lastStatus = 'noScans';
    if (box.statusChanges) {
		const orderedChanges = [
			'inProgress',
			'received',
			'reachedGps',
			'reachedAndReceived',
			'validated',
		];
		const changes = orderedChanges.reduce((acc, status) => ({
			...acc,
			[status]: box.statusChanges[status] || null,
		}), {});

        for (const [status, change] of Object.entries(changes)) {
            if (change?.time
                && change.time <= notAfterTimestamp
            ) {
                lastStatus = status;
            }
        }
    }
	return lastStatus;
}

/**
 *
 * Reindexes the status changes and progress of the boxes.
 *
 * @param {Array<Box>} sample	Boxes to index
 */
export function indexStatusChanges(sample) {
	return sample.map(box => {
		const scans = box.scans;
		scans.sort((a, b) => a.time - b.time); // First scan is the oldest

		const statusChanges = {
			inProgress: null,
			received: null,
			reachedGps: null,
			reachedAndReceived: null,
			validated: null,
		};

		for (const scan of scans) {
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
		}

		return {
			updateOne: {
				filter: { id: box.id },
				update: { $set: { statusChanges, progress: getProgress({ statusChanges }) } }
			}
		}
	});
}
