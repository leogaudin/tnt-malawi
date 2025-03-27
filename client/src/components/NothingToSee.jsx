import { Flex, Heading, Icon } from '@chakra-ui/react';
import { palette } from '../theme';
import { icons } from '../service';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function NothingToSee() {
	const { t } = useTranslation();

	return (
		<Flex
			width='100%'
			height='100%'
			align='center'
			justify='center'
			direction='column'
			// bg={palette.gray.light}
			color={palette.primary.dark}
			borderRadius={15}
			padding={10}
			textAlign='center'
		>
			<Icon
				as={icons.eye}
				boxSize={10}
			/>
			<Heading>
				{t('nothingToSee')}
			</Heading>
			{/* <Heading
				marginY={2.5}
				fontWeight='light'
				size='md'
			>
				<Link to='/import'>
					{t('nothingToSeePrompt')}
				</Link>
			</Heading> */}
		</Flex>
	)
}
