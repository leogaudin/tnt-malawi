import { useState } from 'react'
import BoxFiltering from '../../../components/BoxFiltering'
import { Button, Heading, Stack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { deleteBoxes } from '../../../service';

export default function Delete() {
	const [filters, setFilters] = useState({});
	const [count, setCount] = useState(0);
	const { t } = useTranslation();

	const handleDelete = () => {
		if (window.confirm(t('deletePrompt'))) {
			deleteBoxes(filters)
				.then((res) => {
					alert(`${res.deletedCount} boxes deleted`);
					window.location.reload();
				})
				.catch(console.error);
		}
	}


	return (
		<Stack
			align='stretch'
		>
			<Heading>{t('delete')}</Heading>
			<BoxFiltering
				filters={filters}
				setFilters={setFilters}
				count={count}
				setCount={setCount}
				// enableSearch={false}
			/>
			<Button
				colorScheme='red'
				variant='solid'
				onClick={handleDelete}
			>
				{t('delete')}
			</Button>
		</Stack>
	)
}
