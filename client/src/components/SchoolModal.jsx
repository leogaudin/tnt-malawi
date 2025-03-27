import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalCloseButton,
	Stack,
	Heading,
	Text,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next';
import { palette } from '../theme';
import BoxCard from './BoxCard';
import ContentDelivered from './ContentDelivered';
import { sampleToContent } from '../service/stats';

export default function SchoolModal({
	isOpen,
	onClose,
	school,
}) {
	if (!school || !school.boxes || !Array.isArray(school.boxes)) {
		return null;
	}
	const { t } = useTranslation();

	const projects = [...new Set(school.boxes.map((box) => box.project))];

	const ContentDeliveredByProject = () => {
		return (
			<>
				{projects.map((project) => {
					const sample = school.boxes.filter((box) => box.project === project);
					const content = sampleToContent(sample);

					return (
						<Stack
							align='center'
							key={project}
						>
							<Heading
								size='md'
								width='100%'
								textAlign='center'
								marginTop='1rem'
							>
								{project}
							</Heading>
							{Object.keys(content).length
								? <ContentDelivered content={content} />
								: (
									<Text
										color={palette.gray.main}
										fontWeight='light'
									>
										{t('noContent')}
									</Text>
								)
							}
						</Stack>
					);
				})}
			</>
		)
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose} size='5xl'>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader
					fontWeight='bold'
				>
					{school.name}
				</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<Stack
						align='center'
					>
						{true &&
							<>
								<Heading
									color={palette.gray.main}
									fontWeight='light'
									size='lg'
								>
									{t('validated')}
								</Heading>
								<Stack
									justify='center'
									direction='column'
									gap={5}
								>
									<ContentDeliveredByProject />
								</Stack>
							</>
						}
						<Heading
							color={palette.gray.main}
							fontWeight='light'
							size='lg'
							marginTop='1rem'
						>
							{t('boxes')}
						</Heading>
						<Stack
							width='100%'
						>
							{projects.map((project) => {
								return (
									<Stack
										key={project}
									>
										<Heading
											size='md'
											textAlign='center'
											marginTop='1rem'
										>
											{project}
										</Heading>
										{school.boxes.map((box) => {
											if (box.project === project) {
												return (<BoxCard key={box.id} box={box} />);
											}
										})}
									</Stack>
								);
							})}
						</Stack>
					</Stack>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
