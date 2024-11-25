import { useTranslation } from 'react-i18next';
import { palette } from '../theme';
import {
	Button,
	HStack,
	Select,
	Stack,
	Text,
} from '@chakra-ui/react';
import { useEffect } from 'react';

export default function Pagination({
	length,
	currentPage,
	setCurrentPage,
	pageSize,
	setPageSize,
}) {
	if (!length || pageSize >= length)
		return null;
	const totalPages = Math.ceil(length / pageSize);
	if (totalPages <= 1) return null;
	const pages = Array.from(Array(totalPages).keys()).map(page => page + 1);

	const { t } = useTranslation();

	const pageSizes = [10, 20, 50, 100, 500];

	useEffect(() => {
		if (currentPage > Math.ceil(length / pageSize))
			setCurrentPage(1);
	}, [length, pageSize]);

	const ThreeDots = () => {
		return (
			<Button
				variant='outline'
				bg={palette.background}
				color={palette.primary.dark}
				disabled
			>
				...
			</Button>
		)
	}

	const handlePrevious = () => {
		if (currentPage > 1)
			setCurrentPage(currentPage - 1);
	}

	const handleNext = () => {
		if (currentPage < totalPages)
			setCurrentPage(currentPage + 1);
	}

	return (
		<Stack
			align='center'
		>
			<HStack
				justify='center'
			>
				<Button
					variant='outline'
					bg={palette.background}
					color={palette.primary.dark}
					disabled={currentPage === 1}
					onClick={handlePrevious}
				>
					{'<'}
				</Button>
				{pages.map(page => {
					if (
						page === 2 && currentPage > 3
						|| page === totalPages - 1 && currentPage < totalPages - 2
					)
						return <ThreeDots key={page} />;
					if (!(
						(page === 1 || page === totalPages)	// Page is not the first or the last
						|| (page === currentPage || page === currentPage + 1 || page === currentPage - 1) // Page is the current or one next to the current
					))
						return null;
					return (
						<Button
							variant={currentPage === page ? 'solid' : 'outline'}
							key={page}
							onClick={() => setCurrentPage(page)}
							bg={currentPage === page ? palette.primary.dark : palette.background}
							color={currentPage === page ? palette.background : palette.primary.dark}
							_hover={{
								bg: palette.primary.dark,
								color: palette.background,
							}}
						>
							{page}
						</Button>
					);
				})}
				<Button
					variant='outline'
					bg={palette.background}
					color={palette.primary.dark}
					disabled={currentPage === totalPages}
					onClick={handleNext}
				>
					{'>'}
				</Button>
			</HStack>
			<HStack>
				<Text fontWeight='bold'>
					{t('elementsPerPage')}
				</Text>
				<Select
					focusBorderColor={palette.primary.dark}
					value={pageSize}
					onChange={e => setPageSize(parseInt(e.target.value))}
					width={20}
				>
					{pageSizes.map(size => <option key={size} value={size}>{size}</option>)}
				</Select>
			</HStack>
		</Stack>
	)
}
