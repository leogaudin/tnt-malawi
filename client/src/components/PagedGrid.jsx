import {
	SimpleGrid,
	Stack,
	Flex,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react';
import Pagination from './Pagination';
import Loading from './Loading';


export default function PagedGrid({
	count,
	extraParams, // only used to trigger useEffect
	fetchElements, // (skip: number, limit: number) => Promise<object[]>
	renderElement,
}) {
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [elements, setElements] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setLoading(true);
		fetchElements((currentPage - 1) * pageSize, pageSize)
			.then((data) => {
				setElements(data)
				setLoading(false);
			});
	}, [currentPage, pageSize, extraParams]);

	useEffect(() => {
		if (currentPage > Math.ceil(count / pageSize))
			setCurrentPage(1);
	}, [count, pageSize]);

	if (loading)
		return <Loading />;

	return (
		<Stack>
			<Flex
				direction='column'
				align='center'
				padding={2}
			>
				<Pagination
					length={count}
					currentPage={currentPage}
					setCurrentPage={setCurrentPage}
					pageSize={pageSize}
					setPageSize={setPageSize}
				/>
				<SimpleGrid
					columns={{ base: 1, lg: 2 }}
					spacing={5}
					width='100%'
					marginY={5}
					alignItems='center'
				>
					{elements.map(renderElement)}
				</SimpleGrid>
			</Flex>
		</Stack>
	)
}
