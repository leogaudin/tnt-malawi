import {
	HStack,
	Select,
	IconButton,
	Stack,
	Text,
	Flex,
	Input,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { palette } from '../theme';
import { boxFields } from '../service/specific';
import { useTranslation } from 'react-i18next';
import { callAPI, icons, progresses, user } from '../service';

export default function BoxFiltering({
	filters = {},
	setFilters,
	count,
	setCount,
}) {
	const [loading, setLoading] = useState(false);
	const [possibleValues, setPossibleValues] = useState({});
	const [query, setQuery] = useState('');

	const { t } = useTranslation();

	useEffect(() => {
		updateCount();
		if (Object.keys(filters).length) {
			updatePossibleValues();
		}
	}, [filters]);

	const updatePossibleValues = async () => {
		setLoading(true);
		const results = await Promise.all(
			Object.keys(filters).map(async (boxField) => {
				if (boxField === 'progress')
					return {
						progress: Object.keys(progresses).filter((key) => key !== 'total'),
					};

				if (!boxFields[boxField]) return;

				const response = await callAPI(
					'POST',
					`boxes/distinct/${boxField}`,
					{
						filters: Object.entries(filters).reduce((acc, [field, value]) => {
							if (value?.length && field !== boxField)
								return { ...acc, [field]: value };
							return acc;
						}, { adminId: user.id }),
					}
				);

				if (!response.ok) return;

				const json = await response.json();

				return {
					[boxField]: json.distinct,
				};
			})
		);

		const flattened = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
		const progress = Object.keys(progresses).filter((key) => key !== 'total');
		setPossibleValues({ ...flattened, progress });

		setLoading(false);
	};

	const updateCount = async () => {
		const response = await callAPI(
			'POST',
			`boxes/count`,
			{
				filters: { ...filters, adminId: user.id },
			}
		);

		if (!response.ok) return;

		const json = await response.json();
		setCount(json.count);
	};

	const addFilter = () => {
		setFilters((prev) => ({ ...prev, '': '' }));
	};

	const removeFilter = (field) => {
		setFilters((prev) => {
			const newFilters = { ...prev };
			delete newFilters[field];
			return newFilters;
		});
	};

	const handleFieldChange = (oldField, newField) => {
		setFilters((prev) => {
			const newFilters = { ...prev };
			delete newFilters[oldField];
			newFilters[newField] = '';
			return newFilters;
		});
	};

	const handleValueChange = (field, value) => {
		setFilters((prev) => ({ ...prev, [field]: value }));
	};

	const handleCustomSearch = (event) => {
		event.preventDefault();
		setFilters((prev) => ({ ...prev, custom: query }));
	};

	const FilterSelect = ({ field, value }) => {
		return (
			<HStack bg={palette.gray.light} borderRadius={15} padding={2.5}>
				<Select
					value={field}
					placeholder={t(field) || t('select', { option: t('field') })}
					onChange={(event) => handleFieldChange(field, event.target.value)}
					focusBorderColor={palette.primary.dark}
				>
					{Object.keys(boxFields).map((boxField) => {
						if (filters[boxField]) return null;
						return (
							<option key={boxField} value={boxField}>
								{t(boxField)}
							</option>
						);
					})}
					<option value="progress">{t('progress')}</option>
				</Select>
				<Select
					value={value}
					placeholder={value || t('select', { option: t('value') })}
					onChange={(event) => handleValueChange(field, event.target.value)}
					focusBorderColor={palette.primary.dark}
				>
					{possibleValues[field]?.map((option) => (
						<option key={option} value={option}>
							{t(option)}
						</option>
					))}
				</Select>
				<IconButton
					variant="outline"
					icon={<icons.delete />}
					onClick={() => removeFilter(field)}
					color={palette.error.main}
					borderColor={palette.error.main}
					bg="transparent"
				/>
			</HStack>
		);
	};

	return (
		<Stack
			justify="center"
			align="center"
			textAlign="center"
			padding={5}
			gap={2.5}
			bg={palette.gray.lightest}
			borderRadius={15}
			pointerEvents={loading ? 'none' : 'auto'}
			opacity={loading ? 0.5 : 1}
			transition="opacity 0.2s"
		>
			<Text fontWeight="bold">{t('filters')}</Text>
			<Flex justify="center" align="center" gap={2.5} wrap="wrap">
				{Object.entries(filters).map(([field, value]) => {
					if (field === 'custom') return null;
					return <FilterSelect key={field} field={field} value={value} />;
				})}
				<IconButton
					variant="outline"
					icon={<icons.plus />}
					onClick={addFilter}
				/>
			</Flex>
			<Text
				fontSize="small"
				fontWeight="bold"
				textTransform="uppercase"
				marginY={5}
			>
				{t('itemsSelected', { count: count })}
			</Text>
			<Flex as="form" onSubmit={handleCustomSearch} width="100%" gap=".5rem">
				<Input
					placeholder={`${t('customSearch')}...`}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					focusBorderColor={palette.text}
				/>
				<IconButton variant="outline" icon={<icons.search />} type="submit" />
			</Flex>
		</Stack>
	);
}
