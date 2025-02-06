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
	let lastStatus = 'noScans';
	if (box.statusChanges) {
		for (const [status, change] of Object.entries(box.statusChanges)) {
			if (change?.time && change.time <= notAfterTimestamp) {
				lastStatus = status;
			}
		}
	}
	return lastStatus;
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
 * Returns the percentage of boxes with a given status.
 *
 * @param {Array<Box>}	sample
 * @param {Progress}	status?
 * @returns {number}
 */
export function getStatusPercentage(sample, status = 'validated') {
	const boxes = sample.map(box => { return { ...box, progress: box.progress || getProgress(box) } });

	const deliveredBoxes = boxes.filter(box => box.progress === status).length;

	return (deliveredBoxes / sample.length) * 100;
}

/**
 * Returns the repartition of boxes in a sample.
 *
 * @param {Array<Box>}	sample
 * @param {number}		notAfterTimestamp?
 * @returns {Object}
 */
export function sampleToRepartition(sample, notAfterTimestamp = Date.now()) {
	const repartition = {
		noScans: 0,
		inProgress: 0,
		reachedGps: 0,
		received: 0,
		reachedAndReceived: 0,
		validated: 0,
		total: sample.length,
	};

	for (const box of sample) {
		const progress = getProgress(box, notAfterTimestamp);
		repartition[progress]++;
	}

	return repartition;
}

/**
 * Returns the timeline of a sample.
 *
 * @param {Array<Box>}	sample
 * @returns {Array<Object>}
 */
export function sampleToTimeline(sample) {
	const allTimestamps = sample
	.map(box => box.statusChanges)
	.map(statusChanges => Object.values(statusChanges || {}).filter(change => !!change))
	.flat()
	.map(change => change.time);

	const oneDay = 86400000;

	const final = Math.max(...allTimestamps) + oneDay;
	const initial = Math.max(
		Math.min(...allTimestamps),
		final - (365 * oneDay / 2)
	) - oneDay;

	const data = [];

	for (let i = initial; i <= final; i += oneDay) {
		const day = new Date(i).toISOString().split('T')[0];

		const repartition = sampleToRepartition(sample, i);

		data.push({
			name: day,
			...repartition,
		});
	}

	return data;
}

/**
 * Computes the insights for a sample of boxes.
 *
 * @param {Array<Box>}	sample
 * @param {Function}	setInsights	The function to set the insights
 */
export function computeInsights(boxes, setInsights) {
	if (!boxes || boxes.length === 0) {
		setInsights({});
		return;
	}

	const projects = [...new Set(boxes.map(box => box.project))];

	const insights = {};

	for (const project of projects) {
		const sample = boxes.filter((box) => box.project === project);

		insights[project] = {
			timeline: sampleToTimeline(sample),
			repartition: sampleToRepartition(sample)
		};
	}

	setInsights(insights);
}
