import React, { useState, useContext, useMemo } from 'react';
import BoxSummary from './BoxSummary';
import TableCard from './reusable/TableCard';
import { useTranslation } from 'react-i18next';
import AppContext from '../context/AppContext';

function ScansOverview({
	overrideScans = null,
	disableDialogs = true,
	searchEnabled = false,
	translateTimeIndex = -1
}) {
	const [boxDialogOpen, setBoxDialogOpen] = useState(false);
	const [boxID, setBoxID] = useState('');
	const {boxes, isMobile} = useContext(AppContext);
	const { t } = useTranslation();

	const scans = useMemo(() => {
		return boxes.reduce((acc, box) => {
			if (!box.scans) return acc;
			box.scans.forEach(scan => {
				acc.push({...scan, boxId: box.id});
			});
			return acc;
		}
		, []);
	}, [boxes]);

	const scansToUse = overrideScans ? overrideScans : scans;

	const sortedScans = useMemo(() => {
		return scansToUse ? scansToUse.sort((a, b) => {
			return new Date(b.time) - new Date(a.time);
		}) : null;
	}, [scansToUse]);

	const rows = useMemo(() => {
		return sortedScans && sortedScans.map((scan) => {
			const row = [];
			const box = boxes.find(box => box.id == scan.boxId);
			// if (!disableDialogs)
			// 	row.push(scan.boxId);
			if (!overrideScans)
				row.push(box.school);
			row.push(scan.time);
			if (!isMobile) {
				row.push(scan.comment);
				row.push(
					scan.finalDestination
					? (
						scan.markedAsReceived
						? '✅'
						: '📍'
					)
					: (
						scan.markedAsReceived
						? '📨'
						: ''
					)
				);
			}
			return row;
		});
	}, [sortedScans, isMobile, overrideScans, boxes]);

	const columns = [];
	// if (!disableDialogs)
	// 	columns.push(t('box'))
	if (!overrideScans)
		columns.push(t('recipient'))
	columns.push(t('time'));
	if (!isMobile)
		columns.push(t('comment'), t('final'));
	console.log(columns)

	return (
		<TableCard
			contentName={t('scans').toLowerCase()}
			columns={columns}
			rows={rows}
			setDialogOpen={setBoxDialogOpen}
			setSelectedItem={setBoxID}
			searchEnabled={searchEnabled}
			translateTimeIndex={translateTimeIndex}
			skipFirstColumn={false}
		>
			{disableDialogs
			? null
			: <BoxSummary
				id={boxID}
				open={boxDialogOpen}
				setOpen={setBoxDialogOpen}
			/>}
		</TableCard>
	);
}

export default React.memo(ScansOverview);
