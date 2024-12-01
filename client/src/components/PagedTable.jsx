import {
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	TableContainer,
	Stack,
	HStack,
	Flex,
	Select,
	Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { palette } from '../theme';
import { icons } from '../service';
import Pill from './Pill';
import { useTranslation } from 'react-i18next';
import Pagination from './Pagination';
import Loading from './Loading';

export default function PagedTable({
	headers,
	fields,
	elements,
	transforms,
	onRowClick,
	excludeIf,
	allowToChoosePageSize = true,
	...props
}) {
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(50);
	const [sortField, setSortField] = useState('time');
	const [sortOrder, setSortOrder] = useState('desc');
	const [processedElements, setProcessedElements] = useState(null);

	const { t } = useTranslation();

	const sort = (sample) => {
		if (!sample) return;
		const sortedSample = [...sample].sort((a, b) => {
			if (a[sortField] < b[sortField]) {
				return sortOrder === 'asc' ? -1 : 1;
			}
			if (a[sortField] > b[sortField]) {
				return sortOrder === 'asc' ? 1 : -1;
			}
			return 0;
		});
		return sortedSample;
	}

	useEffect(() => {
		setCurrentPage(1);
		const cleanElements = elements?.filter(element => {
			if (!excludeIf) return true;
			return !excludeIf(element);
		});
		setProcessedElements(sort(cleanElements));
	}, [elements, excludeIf]);

	const getElementsToDisplay = () => {
		if (!processedElements) return null;
		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;
		return sort(processedElements.slice(start, end));
	}

	const conditionPill = (condition) => {
		return condition
			? <Pill
				variant='solid'
				icon={<icons.check />}
				color='success'
				text={t('yes')}
			/>
			: null;
			// : <Pill
			// 	variant='solid'
			// 	icon={<icons.close />}
			// 	color='error'
			// 	text={t('no')}
			// />
	}

	const pageSizes = [10, 20, 50, 100, 500];

	if (!elements) return <Loading />;
	return (
		<Stack>
			<TableContainer>
				<Table layout='fixed'>
					<Thead>
						<Tr>
							{headers.map((header, index) => (
								<Th
									key={index}
									onClick={() => {
										setSortField(fields[index]);
										setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
										sort();
									}}
									cursor='pointer'
								>
									<HStack>
										<>{header}</>
										{sortField === fields[index] && (
											<>{sortOrder === 'asc' ? <icons.up /> : <icons.down />}</>
										)}
									</HStack>
								</Th>
							))}
						</Tr>
					</Thead>
					<Tbody>
						{getElementsToDisplay()?.map((element, index) => {
							return (
								<Tr
									key={index}
									_hover={onRowClick && {
										opacity: .7,
									}}
									cursor={onRowClick ? 'pointer' : 'default'}
									onClick={onRowClick ? () => onRowClick(element) : null}
								>
									{fields.map((field, index) => (
										<Td
											key={index}
											whiteSpace='normal'
											overflowWrap='break-word'
										>
											{transforms[field]
												? transforms[field](element[field])
												: (typeof element[field] === 'boolean'
													? conditionPill(element[field])
													: element[field]
												)
											}
										</Td>
									))}
								</Tr>
							)
						})}
					</Tbody>
				</Table>
			</TableContainer>
			<Pagination
				length={processedElements?.length}
				currentPage={currentPage}
				setCurrentPage={setCurrentPage}
				pageSize={pageSize}
				setPageSize={setPageSize}
			/>
		</Stack>
	)
}
