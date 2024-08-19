import { useState, useEffect } from 'react';
import { SeverityPill } from '../customisation/SeverityPill';
import { getProgress } from '../../service/statistics';
import { colorsMap, getTextsMap } from '../../constants';
import { Stack, Typography, Select, MenuItem, Button, SvgIcon } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Add, Delete } from '@mui/icons-material';

export default function BoxFiltering({
	boxes,
	setFilteredBoxes
}) {
	const { t } = useTranslation();
	const textsMap = getTextsMap();
	const [filters, setFilters] = useState([]);
	const [progressFilter, setProgressFilter] = useState('any');
	const excludedFields = [
		'_id',
		'id',
		'school',
		'schoolCode',
		'htName',
		'htPhone',
		'ssoName',
		'ssoPhone',
		'adminId',
		'createdAt',
		'__v',
		'scans',
		'schoolLatitude',
		'schoolLongitude',
		'progress',
	];

	useEffect(() => {
		setFilteredBoxes(boxes || []);
	}, [boxes, setFilteredBoxes]);

	useEffect(() => {
		const updateFilteredBoxes = () => {
			setFilteredBoxes(boxes?.filter((box) => {
				return (
					(filters.length === 0 || filters.every((filter) => box[filter.field] === filter.value))
					&&
					(getProgress(box) === progressFilter || progressFilter === 'any')
				)
			}));
		}

		updateFilteredBoxes();
	}, [boxes, filters, progressFilter, setFilteredBoxes]);

	const availableOptions = boxes?.length
		? Object.keys(boxes[0]).filter((field) => !excludedFields.includes(field))
		: null;

	const handleProgressChange = (event) => {
		setProgressFilter(event.target.value);
	}

	const addFilter = () => {
		setFilters([...filters, { field: '', value: '' }]);
	}

	const removeFilter = (index) => {
		setFilters(filters.filter((_, i) => i !== index));
	}

	const handleFieldChange = (index, event) => {
		const newFilters = [...filters];
		newFilters[index].field = event.target.value;
		setFilters(newFilters);
	}

	const isPossible = (filters, field, value) => {
		const newFilters = [...filters];
		const existingFilter = newFilters.findIndex((filter) => filter.field === field); // Check if the field is already selected
		const index = existingFilter === -1 ? newFilters.length : existingFilter; // If it is, replace it, otherwise add a new filter
		newFilters[index] = { field, value };
		return boxes.some((box) => newFilters.every((filter) => box[filter.field] === filter.value));
	}

	const handleValueChange = (index, event) => {
		const newFilters = [...filters];
		newFilters[index].value = event.target.value;
		setFilters(newFilters);
	}

	return (
		<Stack
			direction={{ xs: 'column', sm: 'row' }}
			alignItems={{ xs: 'center', sm: 'flex-start' }}
			justifyContent='center'
			width='100%'
			style={{ marginBottom: 5, marginTop: 10 }}
			spacing={5}
		>
			<Stack direction='column' spacing={2}>
				<Typography textAlign='center' variant='overline'>{t('filterOptions')}</Typography>
				{filters.map((filter, index) => (
					<Stack direction='row' spacing={1} alignItems='flex-start' key={index}>
						<Select
							fullWidth
							onChange={(event) => handleFieldChange(index, event)}
							placeholder={`${t('select', { option: t('field') })}`}
							displayEmpty
							renderValue={(_) => filter.field || `${t('select', { option: t('field') })}`}
						>
							{availableOptions.map((field) => {
								if (filters.some((filter) => filter.field === field)) return null;
								return (
									<MenuItem key={field} value={field}>
										{field}
									</MenuItem>
								)
							})}
						</Select>
						<Select
							fullWidth
							onChange={(event) => handleValueChange(index, event)}
							placeholder={`${t('select', { option: t('value') })}`}
							displayEmpty
							renderValue={(_) => filter.value || `${t('select', { option: t('value') })}`}
						>
							{Array.from(new Set(boxes.map((box) => box[filter.field]))).map((option) => {
								if (isPossible(filters, filter.field, option))
									return (
										<MenuItem key={option} value={option}>
											{option}
										</MenuItem>
									)
							})}
						</Select>
						<Button
							onClick={() => removeFilter(index)}
							size='small'
							style={{ alignSelf: 'stretch' }}
						>
							<SvgIcon><Delete /></SvgIcon>
						</Button>
					</Stack>
				))}
				{availableOptions?.length > filters.length &&
					<Button
						onClick={addFilter}
						variant='outlined'
						size='medium'
					>
						<SvgIcon><Add /></SvgIcon>
					</Button>
				}
			</Stack>

			<Stack direction='column' spacing={2}>
				<Typography textAlign='center' variant='overline'>{t('select', { option: t('progress') })}</Typography>
				<Select
					onChange={handleProgressChange}
					placeholder={t('select', { option: t('progress') })}
					defaultValue='any'
				>
					<MenuItem value='any'>
						<SeverityPill color={colorsMap['noscans']}>
							{t('any')}
						</SeverityPill>
					</MenuItem>
					{Object.keys(textsMap).map((key) => (
						<MenuItem key={key} value={key}>
							<SeverityPill color={colorsMap[key]}>
								{textsMap[key]}
							</SeverityPill>
						</MenuItem>
					))}
				</Select>
			</Stack>
		</Stack>
	);
}
