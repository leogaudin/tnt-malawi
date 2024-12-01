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
	count,
	fetchElements,
	headers,
	fields,
	transforms,
	onRowClick,
	allowToChoosePageSize = true,
	...props
}) {
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(50);
	const [elements, setElements] = useState(null);
	const [loading, setLoading] = useState(false);

	const { t } = useTranslation();

	useEffect(() => {
		setLoading(true);
		fetchElements((currentPage - 1) * pageSize, pageSize)
			.then((data) => {
				setElements(data);
				setLoading(false);
			});
	}, [currentPage, pageSize]);

	useEffect(() => {
		if (currentPage > Math.ceil(count / pageSize))
			setCurrentPage(1);
	}, [count, pageSize]);

	const conditionPill = (condition) => {
		return condition
			? <Pill
				variant='solid'
				icon={<icons.check />}
				color='success'
				text={t('yes')}
			/>
			: null;
	}

	if (loading || !elements)
		return <Loading />;
	return (
		<Stack>
			<Pagination
				length={count}
				currentPage={currentPage}
				setCurrentPage={setCurrentPage}
				pageSize={pageSize}
				setPageSize={setPageSize}
			/>
			<TableContainer>
				<Table layout='fixed'>
					<Thead>
						<Tr>
							{headers.map((header, index) => (
								<Th
									key={index}
								>
									<HStack>
										{header}
									</HStack>
								</Th>
							))}
						</Tr>
					</Thead>
					<Tbody>
						{elements?.map((element, index) => {
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
		</Stack>
	)
}
