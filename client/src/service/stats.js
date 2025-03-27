
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
 * Returns the repartition of boxes in a sample.
 *
 * @param {Array<Box>}	sample
 * @param {number}		notAfterTimestamp?
 * @returns {Object}
 */
function sampleToRepartition(sample, notAfterTimestamp = Date.now()) {
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

function getMinMax(arr) {
	if (!arr || !Array.isArray(arr)) {
		throw new Error('Invalid array');
	}
    let max = -Number.MAX_VALUE;
    let min = Number.MAX_VALUE;

	for (const e of arr) {
		if (e > max) {
			max = e;
		}
		if (e < min) {
			min = e;
		}
	}

    return { min, max };
}

/**
 * Returns the timeline of a sample.
 *
 * @param {Array<Box>}	sample
 * @returns {Array<Object>}
 */
function sampleToTimeline(sample) {
	const allTimestamps = sample
		.map(box => box.statusChanges)
		.map(statusChanges => Object.values(statusChanges || {}).filter(change => !!change))
		.flat()
		.map(change => change.time);

	const oneDay = 86400000;

	const { min: minTimestamp, max: maxTimestamp } = getMinMax(allTimestamps);

	const final = maxTimestamp + oneDay;
	const initial = Math.max(
		minTimestamp,
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

export function sampleToContent(sample) {
	const content = {};

	for (const box of sample) {
		const contents = Object.keys(box.content || {});

		for (const item of contents) {
			if (!content[item]) {
				content[item] = { validated: 0, total: 0 };
			}
			if (box.progress === 'validated' || box.statusChanges?.validated) {
				content[item]['validated'] += box.content[item];
			}
			content[item]['total'] += box.content[item];
		}
	}

	return content;
}

/**
 * Computes the insights for a sample of boxes.
 *
 * @param {Array<Box>}	sample
 * @param {boolean}		[grouped=true]	Whether to group the insights by project
 * @param {Function}	setInsights	The function to set the insights
 */
export function computeInsights(boxes, options = {}) {
	const { grouped = true, only = null } = options;

	if (!boxes || boxes.length === 0) {
		return {};
	}

	if (!grouped) {
		const filtered = only ? boxes.filter(box => only.includes(box.project)) : boxes;
		return {
			timeline: sampleToTimeline(filtered),
			repartition: sampleToRepartition(filtered),
			content: sampleToContent(filtered)
		};
	}

	const projects = [...new Set(boxes.map(box => box.project))];

	const insights = {};

	for (const project of projects) {
		if (only && !only.includes(project)) {
			continue;
		}

		const sample = boxes.filter((box) => box.project === project);

		insights[project] = {
			timeline: sampleToTimeline(sample),
			repartition: sampleToRepartition(sample),
			content: sampleToContent(sample),
		};
	}

	return insights;
}
