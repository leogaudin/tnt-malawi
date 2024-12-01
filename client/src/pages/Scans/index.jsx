import { useContext, useEffect, useState } from 'react';
import PagedTable from '../../components/PagedTable';
import AppContext from '../../context';
import { useTranslation } from 'react-i18next';
import { useDisclosure } from '@chakra-ui/react';
import BoxModal from '../Boxes/components/BoxModal';
import { timeAgo } from '../../service/utils';
import { callAPI } from '../../service';

export default function Scans() {
	const { boxes } = useContext(AppContext);
	const { t } = useTranslation();
	const [selectedBox, setSelectedBox] = useState(null);
	const { isOpen, onClose, onOpen } = useDisclosure();
	const [count, setCount] = useState(0);

	const handleClick = (element) => {
		setSelectedBox(element.boxId);
		onOpen();
	}

	const fetchCount = async () => {
		const response = await callAPI('GET', 'scans/count');
		const json = await response.json();

		return json.data?.count || 0;
	};

	useEffect(() => {
		fetchCount()
			.then(count => {
				setCount(Math.min(count, 42000));
			});
	}, []);

	const fetchScans = async (skip, limit) => {
		console.log('fetching scans', skip, limit);
		const response = await callAPI(
			'GET',
			`scans?skip=${skip}&limit=${limit}`
		);
		const json = await response.json();

		return json.data?.scans || [];
	};

	return (
		<>
			{selectedBox &&
				<BoxModal
					box={boxes.find(box => box.id === selectedBox)}
					onClose={onClose}
					isOpen={isOpen}
				/>
			}
			<PagedTable
				count={count}
				fetchElements={fetchScans}
				headers={[
					t('recipient'),
					t('box'),
					t('time'),
					t('comment'),
					t('received'),
					t('reachedGps')
				]}
				fields={[
					'recipient',
					'boxId',
					'time',
					'comment',
					'markedAsReceived',
					'finalDestination',
				]}
				transforms={{
					time: (time) => timeAgo(time),
					boxId: (boxId) => <code>{`${boxId.slice(0, 5)}...`}</code>
				}}
				onRowClick={handleClick}
			/>
		</>
	)
}
