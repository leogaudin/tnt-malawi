import {
	Heading,
	Stack,
} from '@chakra-ui/react';
import { palette } from '../../../theme';
import { progresses } from '../../../service';
import { useTranslation } from 'react-i18next';

export default function Repartition({
	repartition
}) {
	const { t } = useTranslation();

	return (
		<Stack
			align='center'
			textAlign='center'
			padding='1.5rem'
		>
			<Heading
				color={palette.gray.main}
				fontWeight='light'
			>
				{t('currently')}
			</Heading>
			<Stack
				direction={{ base: 'column', md: 'row' }}
				gap={5}
			>
				{Object.keys(repartition).map((key, i) => {
					const progress = progresses[key];
					if (!progress)
						return;

					return (
						<Stack
							color={progress.color}
							align='center'
							key={key}
						>
							<Heading>
								{repartition[key]}
							</Heading>
							<Heading
								size='sm'
								fontWeight='light'
							>
								{t(key)}
							</Heading>
						</Stack>
					);
				})}
			</Stack>
		</Stack>
	)
}
