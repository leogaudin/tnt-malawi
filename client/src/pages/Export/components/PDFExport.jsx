import React, { useState } from 'react';
import { saveAs } from 'file-saver';
// import { Button, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
	Document,
	Page,
	Text as PDFText,
	View,
	StyleSheet,
	Font,
	Image,
	pdf,
} from '@react-pdf/renderer';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { icons } from '../../../service';
import { boxFields } from '../../../service/specific';
import { Button, Tooltip, Text, Stack, HStack, Icon } from '@chakra-ui/react';

const PDFExport = ({ objects, folderName = 'Documents' }) => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [pagesComplete, setPagesComplete] = useState(0);

	Font.register({
		family: 'Inter',
		fonts: [
			{ src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjQ.ttf' },
			{ src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyYAZ9hjQ.ttf', fontWeight: 900 },
		],
	});

	const styles = StyleSheet.create({
		page: {
			fontFamily: 'Inter',
			flexDirection: 'row',
			height: '150mm',
			width: '100mm',
			padding: '5mm'
		},
		documentContainer: {
			flexDirection: 'column',
			height: '145mm',
			width: '95mm',
		},
		infoHeading: {
			fontSize: '5mm',
			textTransform: 'uppercase',
			textAlign: 'center',
			marginBottom: '3mm',
			fontWeight: 900,
		},
		infoRow: {
			fontSize: '4mm',
			flexDirection: 'row',
			width: '100%',
			alignItems: 'center',
			justifyContent: 'center',
			marginBottom: '2mm',
		},
		infoLabel: {
			fontWeight: 900,
		},
		qrCodeContainer: {
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
		},
		qrCodeValue: {
			fontSize: '4mm',
			textAlign: 'center',
			marginTop: '2mm',
		},
		qrCode: {
			margin: '2mm',
			width: '70mm',
			height: '70mm',
		},
		serial: {
			position: 'absolute',
			bottom: '3mm',
			right: '3mm',
			fontSize: '2mm',
		}
	});

	const QRCodePNG = async ({ id }) => {
		const qrCodeDataURL = await QRCode.toDataURL(
			'tnt://' + id,
			{
				errorCorrectionLevel: 'H',
				width: 100,
				margin: 0
			}
		)

		return (
			<View style={styles.qrCodeContainer}>
				<Image style={styles.qrCode} src={qrCodeDataURL} />
				<PDFText style={styles.qrCodeValue}>{id}</PDFText>
			</View>
		);
	};

	const InfoRows = ({ object }) => {
		return Object.keys(boxFields).map((field) => {
			if (object[field]) {
				return (
					<View style={styles.infoRow} key={field}>
						<PDFText style={styles.infoLabel}>{t(field)}: </PDFText>
						<PDFText>{object[field]}</PDFText>
					</View>
				);
			}
			return null;
		});
	};

	const renderPages = async (chunk, i, totalLength) => {
		return await Promise.all(chunk.map(async (object, index) => {
			const { id } = object;

			const qrComponent = await QRCodePNG({ id });

			return (
				<Page orientation='portrait' key={id} size={['100mm', '150mm']} style={styles.page}>
					<View style={styles.documentContainer}>
						<InfoRows object={object} />
						{qrComponent}
						<PDFText style={styles.serial}>{i + index + 1}/{totalLength}</PDFText>
					</View>
				</Page>
			);
		}));
	};

	const downloadDocuments = async () => {
		setLoading(true);
		const sortedObjects = objects.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
		const zip = new JSZip();
		let chunkIndex = 0;
		const CHUNK_SIZE = 500;
		const totalLength = sortedObjects.length;

		for (let i = 0; i < totalLength; i += CHUNK_SIZE) {
			const chunk = sortedObjects.slice(i, i + CHUNK_SIZE);
			const pages = await renderPages(chunk, i, totalLength);
			const blob = await pdf(<Document>{pages}</Document>).toBlob();
			zip.file(`${folderName}_${chunkIndex}.pdf`, blob, { binary: true });
			setPagesComplete(a => a + chunk.length);
			chunkIndex++;
		}

		zip.generateAsync({ type: 'blob' }).then(function (content) {
			saveAs(content, `${folderName}.zip`);
			setLoading(false);
			setPagesComplete(0);
		});
	};

	return (
		<Button
			variant='outline'
			size='lg'
			onClick={downloadDocuments}
			isLoading={loading}
			loadingText={pagesComplete + ' generated'}
			paddingY={10}
		>
			<HStack
				width='100%'
				gap={5}
			>
				<Icon
					as={icons.print}
					boxSize={5}
				/>
				<Stack
					flexDirection='column'
					alignItems='start'
				>
					<Text>{t('printableLabels')}</Text>
					<Text fontWeight='light' whiteSpace='normal'>{t('printableLabelsDetail')}</Text>
				</Stack>
			</HStack>
		</Button>
	);
};

export default PDFExport;
