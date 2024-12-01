import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalCloseButton,
	Text,
	Stack,
	Flex,
	Divider,
	Button,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import ScansMap from './ScansMap';
import PagedTable from '../../../components/PagedTable';
import { timeAgo } from '../../../service/utils';
import { excludedKeys } from '../../../service/specific';
import { callAPI, fetchBoxScans } from '../../../service';
import { useEffect, useState } from 'react';
import Loading from '../../../components/Loading';

export default function BoxModal({
	isOpen,
	onClose,
	box,
}) {
	const { t } = useTranslation();
	const [scans, setScans] = useState(null);

	useEffect(() => {
		fetchBoxScans(box.id)
		.then(setScans);
	}, []);

	const handleDelete = async () => {
		if (window.confirm(t('deletePrompt'))) {
			await callAPI(
				'DELETE',
				'boxes',
				{ deleteConditions: { id: box.id } }
			);

			onClose();
			window.location.reload();
		}
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose} size='5xl'>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader
					fontWeight='bold'
				>
					<code>{box.id}</code>
				</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<Stack>
						<Flex
							direction={{ base: 'column', md: 'row' }}
							justify={{ base: 'center', md: 'space-between' }}
							align={{ base: 'center', md: 'start' }}
							gap={5}
							padding={5}
							borderRadius={10}
							shadow='md'
						>
							<Stack
								gap={2}
							>
								{Object.entries(box).map(([key, value]) => {
									if (excludedKeys.includes(key) || !value)
										return null;
									return (
										<Text key={key}>
											<code>{t(key)}</code>: <strong>{value}</strong>
										</Text>
									);
								})}
							</Stack>
							<QRCodeSVG
								value={'tnt://' + box.id}
								size={256}
								level='H'
							/>
						</Flex>
						<Button
							colorScheme='red'
							onClick={handleDelete}
							variant='ghost'
						>
							{t('delete')}
						</Button>
						<Divider marginY={5} />
						{scans?.length
						?
							<Flex
								direction='column'
								justify={{ base: 'center', md: 'space-between' }}
								gap={5}
								padding={5}
								borderRadius={10}
								shadow='md'
							>
								<ScansMap box={{ ...box, scans }} />
								<PagedTable
									elements={scans}
									headers={[
										t('time'),
										t('comment'),
										t('received'),
										t('reachedGps')
									]}
									fields={[
										'time',
										'comment',
										'markedAsReceived',
										'finalDestination',
									]}
									transforms={{
										time: (time) => timeAgo(time),
									}}
									allowToChoosePageSize={false}
								/>
							</Flex>
						: <Loading />
						}
					</Stack>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
