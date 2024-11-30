import { useEffect, useState } from 'react';
import { icons, progresses } from '../service';
import {
	Select,
	IconButton,
	Stack,
	Flex,
	HStack,
	Text,
	Input,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { palette } from '../theme';
import { getProgress } from '../service/stats';
import { excludedKeys } from '../service/specific';

export default function BoxFiltering({
	boxes,
	setFilteredBoxes,
	setFiltersOutside = () => { }, // If you want to use the filters outside of this component
	includeProgress = true,
	includeSearch = true,
}) {
	const [filters, setLocalFilters] = useState([]);
	const [progressFilter, setProgressFilter] = useState('any');
	const [query, setQuery] = useState('');
	const { t } = useTranslation();
	const excludedFields = [
		...excludedKeys,
		'createdAt',
	];

	const fitsQuery = (box) => {
		return Object.values(box).some((value) => {
			if (typeof value === 'string')
				return value.toLowerCase().includes(query.toLowerCase());
		})
	}

	const getFilteredBoxes = () => {
		return boxes?.filter((box) => {
			return (
				(filters.length === 0 || filters.every((filter) => box[filter.field] === filter.value))
				&&
				(!includeProgress || ((box.progress || getProgress(box)) === progressFilter || progressFilter === 'any'))
				&&
				(!includeSearch || !query || fitsQuery(box))
			)
		})
	}

	const setFilters = (filters) => {
		setLocalFilters(filters);
		setFiltersOutside(filters);
	}

	useEffect(() => {
		const updateFilteredBoxes = () => {
			setFilteredBoxes(getFilteredBoxes());
		}

		updateFilteredBoxes();
	}, [boxes, filters, progressFilter, setFilteredBoxes, query]);

	const availableOptions = boxes?.length
		? Object.keys(boxes[0]).filter((field) => !excludedFields.includes(field))
		: null;

	const handleProgressChange = (event) => {
		setProgressFilter(event.target.value);
	}

	const addFilter = () => {
		if (filters.every((filter) => filter.field && filter.value))
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

	const FilterSelect = ({ filter, index }) => {
		return (
			<HStack
				bg={palette.gray.light}
				borderRadius={15}
				padding={2.5}
			>
				<Select
					defaultValue={filter.field}
					placeholder={filter.field || t('select', { option: t('field') })}
					onChange={(event) => handleFieldChange(index, event)}
					focusBorderColor={palette.primary.dark}
				>
					{availableOptions.map((field) => {
						if (filters.some((filter) => filter.field === field)) return null;
						return (
							<option key={field} value={field} selected={filter.field === field}>
								{field}
							</option>
						)
					})}
				</Select>
				<Select
					defaultValue={filter.value}
					placeholder={filter.value || t('select', { option: t('value') })}
					onChange={(event) => handleValueChange(index, event)}
					focusBorderColor={palette.primary.dark}
				>
					{Array.from(new Set(boxes.map((box) => box[filter.field]))).map((option) => {
						if (isPossible(filters, filter.field, option))
							return (
								<option key={option} value={option}>
									{option}
								</option>
							)
					})}
				</Select>
				<IconButton
					variant='outline'
					icon={<icons.delete />}
					onClick={() => removeFilter(index)}
					color={palette.error.main}
					borderColor={palette.error.main}
					bg='transparent'
				/>
			</HStack>
		)
	}

	return (
		<Stack
			justify='center'
			align='center'
			textAlign='center'
			padding={5}
			gap={2.5}
			bg={palette.gray.lightest}
			borderRadius={15}
		>
			<Text fontWeight='bold'>{t('filters')}</Text>
			<Flex
				justify='center'
				align='center'
				gap={2.5}
				wrap='wrap'
			>
				{filters.map((filter, index) => (
					<FilterSelect key={index} filter={filter} index={index} />
				))}
				<IconButton
					variant='outline'
					icon={<icons.plus />}
					onClick={addFilter}
				/>
			</Flex>
			{includeProgress &&
				(<>
					<Text fontWeight='bold'>{t('progress')}</Text>
					<Select
						width='fit-content'
						defaultValue='any'
						onChange={handleProgressChange}
						focusBorderColor='gray'
					>
						<option value='any'>{t('any')}</option>
						{progresses.map((progress) => {
							if (progress.key === 'total')
								return null;
							return (
								<option key={progress.key} value={progress.key}>
									{t(progress.key)}
								</option>
							)
						})}
					</Select>
				</>)
			}
			<Text
				fontSize='small'
				fontWeight='bold'
				textTransform='uppercase'
				marginY={5}
			>
				{t('itemsSelected', { count: getFilteredBoxes().length })}
			</Text>
			{includeSearch &&
				<Input
					placeholder={`${t('customSearch')}...`}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					focusBorderColor={palette.text}
				/>
			}
		</Stack>
	)
}
