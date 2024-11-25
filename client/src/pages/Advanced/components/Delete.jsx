import { useContext, useState } from 'react'
import BoxFiltering from '../../../components/BoxFiltering'
import AppContext from '../../../context'
import { Button, Heading, Stack, useDisclosure } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { callAPI } from '../../../service';

async function deleteBoxes(filters) {
	const deleteConditions = filters.reduce((acc, { field, value }) => ({ ...acc, [field]: value }), {});
	const response = await callAPI('DELETE', 'boxes', { deleteConditions });
	const json = await response.json();

	return { deletedCount: json.data.deletedCount };
}

export default function Delete() {
	const { boxes } = useContext(AppContext);
	const [filters, setFilters] = useState([]);
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
				boxes={boxes}
				setFilteredBoxes={() => { }}
				setFiltersOutside={setFilters}
				includeProgress={false}
				includeSearch={false}
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
