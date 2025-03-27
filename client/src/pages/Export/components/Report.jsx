import { saveAs } from 'file-saver';
import { json2csv } from 'json-2-csv';
import {
	Button,
	Icon,
	HStack,
	Text,
	Stack,
} from '@chakra-ui/react';
import { fetchReport, icons } from '../../../service';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function Report({ filters }) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [loadingText, setLoadingText] = useState('');

	const handleDownload = async () => {
		try {
			setLoading(true);

			const report = await fetchReport(filters);
			if (!report)
				throw new Error('No report available');
			const title = `${t('currentDeliveryReport')} - ${new Date().toISOString().slice(0, 10)}`;
			const blob = new Blob([report], { type: 'text/csv' });
			saveAs(blob, `${title}.csv`);

			setLoading(false);
			setLoadingText('');
		} catch (error) {
			console.error(error);
			setLoading(false);
			setLoadingText('');
		}
	}

	return (
		<Button
			variant='outline'
			size='lg'
			paddingY='1rem'
			height='fit-content'
			isLoading={loading}
			loadingText={loadingText}
			onClick={handleDownload}
		>
			<HStack
				width='100%'
				gap={5}
			>
				<Icon
					as={icons.clock}
					boxSize={5}
				/>
				<Stack
					flexDirection='column'
					alignItems='start'
					textAlign='start'
				>
					<Text>{t('currentDeliveryReport')}</Text>
					<Text fontWeight='light' whiteSpace='normal'>{t('currentDeliveryReportDetail')}</Text>
				</Stack>
			</HStack>
		</Button>
	)
}
