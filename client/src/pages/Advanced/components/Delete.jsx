import { useContext, useState } from 'react'
import BoxFiltering from '../../../components/BoxFiltering'
import AppContext from '../../../context'
import { Button, Heading, Stack, useDisclosure } from '@chakra-ui/react';
import ConfirmDialog from '../../../components/ConfirmDialog';
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
	const [filtered, setFiltered] = useState(boxes);
	const [filters, setFilters] = useState([]);
	const { isOpen, onOpen, onClose } = useDisclosure();
	const { t } = useTranslation();

	const handleDelete = () => {
		deleteBoxes(filters)
			.then((res) => {
				alert(`${res.deletedCount} boxes deleted`);
				window.location.reload();
			})
			.catch(console.error);
	}


	return (
		<Stack
			align='stretch'
		>
			<Heading>{t('delete')}</Heading>
			<BoxFiltering
				boxes={boxes}
				setFilteredBoxes={setFiltered}
				setFiltersOutside={setFilters}
				includeProgress={false}
				includeSearch={false}
			/>
			<Button
				colorScheme='red'
				variant='solid'
				onClick={onOpen}
			>
				{t('delete')}
			</Button>
			<ConfirmDialog
				message={t('deletePrompt')}
				onConfirm={handleDelete}
				isOpen={isOpen}
				onClose={onClose}
			/>
		</Stack>
	)
}
