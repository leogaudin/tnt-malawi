import i18n from '../language';

import Login from '../pages/Login'
import Home from '../pages/Home';
import Boxes from '../pages/Boxes';
import Scans from '../pages/Scans';
import Import from '../pages/Import';
import Export from '../pages/Export';
import Advanced from '../pages/Advanced';
import PublicInsights from '../pages/PublicInsights';

import { IoHome, IoClose, IoCheckmark, IoPrint } from 'react-icons/io5';
import { FaBoxOpen, FaChevronUp, FaChevronDown, FaMapPin, FaEye, FaClock, FaQrcode, FaPlus, FaCopy, FaChevronRight, FaChevronLeft, FaSearch, FaLink } from 'react-icons/fa';
import { IoMdExit, IoMdRefresh, IoMdSettings } from 'react-icons/io';
import { BiImport, BiExport } from 'react-icons/bi';
import { MdDelete, MdEdit } from 'react-icons/md';
import { TbProgressCheck } from 'react-icons/tb';
import { BsMailbox } from 'react-icons/bs';

import { palette } from '../theme';
import { API_URL } from './specific';
import { json2csv } from 'json-2-csv';

export const user = JSON.parse(localStorage.getItem('user'));

export const navbarWidth = '250px';

/**
 * Calls the API with the given parameters
 *
 * @param {String} 			method		HTTP method to be used
 * @param {String} 			endpoint	Endpoint to be called
 * @param {Object}			data		Data to be sent in the request
 * @param {Object}			headers		Headers to be sent in the request
 * @param {AbortSignal}		signal		AbortSignal to be used in the request
 *
 * @returns {Promise<Response>}			Response of the request
 */
export const callAPI = async (method, endpoint, data = null, headers = {}, signal = null) => {
	const authorization = user?.apiKey || '';
	const requestHeaders = {
		'Content-Type': 'application/json',
		'Accept-Encoding': 'gzip, deflate',
		'X-Authorization': authorization,
		...headers,
	};

	const response = await fetch(`${API_URL}/${endpoint}`, {
		method: method,
		headers: requestHeaders,
		body: data ? JSON.stringify(data) : null,
		signal: signal,
	});

	return response;
}

/**
 * Fetches boxes from the API
 *
 * @param {object}		filters		Filters to be applied to the request
 *
 * @returns {Promise<Array>}			Array of boxes
 */
export async function fetchBoxes(filters = {}) {
	try {
		const BUFFER_LENGTH = 10_000;
		const boxes = [];

		const response = await callAPI(
			'POST',
			`boxes/count`,
			{ filters: { ...filters, adminId: user.id } }
		);
		const json = await response.json();
		const count = json.count || 0;

		while (boxes.length < count) {
			const skip = boxes.length;

			const request = await callAPI(
				'POST',
				`boxes/query?skip=${skip}&limit=${BUFFER_LENGTH}`,
				{ filters }
			);

			if (request.status !== 200 || !request.ok)
				break;

			const response = await request.json();

			if (response.boxes)
				boxes.push(...response.boxes);
		}

		boxes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
		return boxes;
	} catch (err) {
		console.error(err);
		return null;
	}
}

/**
 * Fetches report from the API
 *
 * @param {object}		filters		Filters to be applied to the request
 *
 * @returns {Promise<string>}		Lines of the report
 */
export async function fetchReport(filters = {}) {
	try {
		const BUFFER_LENGTH = 5_000;
		const boxes = [];

		const response = await callAPI(
			'POST',
			`boxes/count`,
			{ filters: { ...filters, adminId: user.id } }
		);

		const json = await response.json();
		const count = json.count || 0;

		while (boxes.length < count) {
			const skip = boxes.length;

			const request = await callAPI(
				'POST',
				`insights/report?skip=${skip}&limit=${BUFFER_LENGTH}`,
				{ filters: { ...filters, adminId: user.id } }
			);

			if (request.status !== 200 || !request.ok)
				break;

			const response = await request.json();

			if (response.boxes)
				boxes.push(...response.boxes);
		}

		const delimiter = ',';
		const newline = '\n';
		const keys = Object.keys(boxes[0])
		const headers = keys.map(header => i18n.t(header)).join(delimiter);
		const report = json2csv(
			boxes,
			{
				delimiter: { field: delimiter, eol: newline },
				prependHeader: false
			}
		);
		return `${headers}${newline}${report}`;
	} catch (err) {
		console.error(err);
		return null;
	}
}

/**
 * Deletes boxes from the API
 *
 * @param {object}		filters		Filters to be applied to the request
 *
 * @returns {Promise<{deletedCount: Number}>}			Number of deleted boxes
 */
export async function deleteBoxes(filters = {}) {
	const response = await callAPI(
		'DELETE',
		'boxes',
		{ filters }
	);
	const json = await response.json();

	return { deletedCount: json.deletedCount };
}

/**
 * Fetches insights from the API
 *
 * @param {object}		filters		Filters to be applied to the request
 * @param {boolean}		grouped		Whether the insights should be grouped or not
 *
 * @returns {Promise<object>}		Insights
 */
export async function fetchInsights(filters = {}) {
	try {
		const BUFFER_LENGTH = 25_000;
		const boxes = [];

		const response = await callAPI(
			'POST',
			`boxes/count`,
			{ filters }
		);
		const json = await response.json();
		const count = json.count || 0;

		while (boxes.length < count) {
			const skip = boxes.length;

			const request = await callAPI(
				'POST',
				`insights?skip=${skip}&limit=${BUFFER_LENGTH}`,
				{ filters }
			);

			if (request.status !== 200 || !request.ok)
				break;

			const response = await request.json();

			if (response.boxes)
				boxes.push(...response.boxes);
		}

		boxes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
		return boxes;
	} catch (err) {
		console.error(err);
		return null;
	}
}

export async function fetchBoxScans(boxId) {
	const response = await callAPI(
		'GET',
		`scan/box/${boxId}`
	);
	const json = await response.json();
	return json.scans;
}

export const icons = {
	home: IoHome,
	box: FaBoxOpen,
	exit: IoMdExit,
	check: IoCheckmark,
	close: IoClose,
	up: FaChevronUp,
	down: FaChevronDown,
	left: FaChevronLeft,
	right: FaChevronRight,
	pin: FaMapPin,
	eye: FaEye,
	clock: FaClock,
	qr: FaQrcode,
	import: BiImport,
	export: BiExport,
	plus: FaPlus,
	refresh: IoMdRefresh,
	delete: MdDelete,
	print: IoPrint,
	settings: IoMdSettings,
	copy: FaCopy,
	almost: TbProgressCheck,
	mailbox: BsMailbox,
	search: FaSearch,
	edit: MdEdit,
	link: FaLink,
}

export const getRoutes = () => [
	{
		path: '/auth',
		component: Login,
		public: true,
		worksWithoutBoxes: true,
	},
	{
		path: '/',
		component: Home,
		title: i18n.t('home'),
		inNav: true,
		icon: icons.home,
	},
	{
		path: '/boxes',
		component: Boxes,
		title: i18n.t('boxes'),
		inNav: true,
		icon: icons.box,
	},
	{
		path: '/scans',
		component: Scans,
		title: i18n.t('scans'),
		inNav: true,
		icon: icons.qr,
	},
	{
		path: '/import',
		component: Import,
		title: i18n.t('import'),
		inNav: true,
		icon: icons.import,
		worksWithoutBoxes: true,
	},
	{
		path: '/export',
		component: Export,
		title: i18n.t('export'),
		inNav: true,
		icon: icons.export,
	},
	{
		path: '/advanced',
		component: Advanced,
		title: i18n.t('advanced'),
		inNav: true,
		icon: icons.settings,
	},
	{
		path: '/insights/:id',
		component: PublicInsights,
		title: i18n.t('insights'),
		public: true,
		worksWithoutBoxes: true,
	},
];

export const progresses = {
	total: {
		color: palette.text,
		userAvailable: false,
	},
	noScans: {
		color: palette.error.main,
		userAvailable: true,
		icon: icons.close,
		inTimeline: true,
	},
	inProgress: {
		color: palette.warning.main,
		userAvailable: true,
		icon: icons.clock,
		inTimeline: true,
	},
	received: {
		color: palette.blue.main,
		userAvailable: true,
		icon: icons.eye,
		inTimeline: true,
	},
	reachedGps: {
		color: palette.cyan.main,
		userAvailable: true,
		icon: icons.pin,
		inTimeline: true,
	},
	reachedAndReceived: {
		color: palette.teal.main,
		userAvailable: true,
		icon: icons.almost,
		inTimeline: true,
	},
	validated: {
		color: palette.success.main,
		userAvailable: true,
		icon: icons.check,
		inTimeline: true,
	},
};
