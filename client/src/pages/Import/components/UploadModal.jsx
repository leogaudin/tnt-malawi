import { Flex, Modal, ModalBody, ModalContent, ModalOverlay } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { palette } from '../../../theme';

/**
 * @param boolean isOpen
 * @param File file
 * @param (file: File, setOutput: Function) => void handleFile
 */
export default function UploadModal({
	isOpen,
	file,
	handleFile,
}) {
	if (!file) return null;
	const [output, setOutput] = useState([]);
	const { t } = useTranslation();

	useEffect(() => {
		handleFile(file, setOutput);
	}, [file]);

	return (
		<Modal
			isOpen={isOpen}
			size='xl'
		>
			<ModalOverlay />
			<ModalContent>
				<ModalBody>
					{output?.length
						? (
							<Flex
								bg={palette.text}
								color={palette.background}
								padding={5}
								borderRadius={10}
								overflowY='scroll'
								maxHeight='70vh'
								width='100%'
								direction='column'
							>
								{output?.map((line, i) => {
									return (
										<code
											style={{ maxWidth: '100%' }}
											key={i}
											ref={el => (i === output.length - 1) && el?.scrollIntoView()}
										>
											{line}
										</code>
									)
								})}
							</Flex>
						)
						: <code>{t('loading')}...</code>
					}
				</ModalBody>
			</ModalContent>
		</Modal>
	)
}
