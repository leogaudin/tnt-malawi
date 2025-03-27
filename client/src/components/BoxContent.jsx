import {
	Heading,
	Stack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { palette } from '../theme';

export default function BoxContent({
	content,
}) {
	const { t } = useTranslation();

	return (
		<Stack
			align='center'
			textAlign='center'
			padding='1rem'
			gap='1rem'
			borderRadius={10}
		>
			<Heading
				color={palette.gray.main}
				fontWeight='light'
				size='lg'
			>
				{t('content')}
			</Heading>
			<Stack
				direction={{ base: 'column', md: 'row' }}
				gap={5}
			>
				{Object.entries(content).map(([element, quantity]) => {
					if (!quantity) return null;

					return (
						<Stack
							align='center'
							key={element}
						>
							<Heading>
								{quantity}
							</Heading>
							<Heading
								size='sm'
								fontWeight='light'
							>
								{t(element)}
							</Heading>
						</Stack>
					);
				})}
			</Stack>
		</Stack>
	)
}
