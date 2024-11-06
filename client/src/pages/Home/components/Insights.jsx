import Timeline from './Timeline';
import { Card, Heading, HStack, Progress, Stack } from '@chakra-ui/react';
import { progresses } from '../../../service';
import { useTranslation } from 'react-i18next';
import { palette } from '../../../theme';
import Loading from '../../../components/Loading';

export default function Insights({ insights }) {
	const { t } = useTranslation();

	if (!insights)
		return <Loading />;

	return (
		<>
			{Object.keys(insights).map((project, i) => {
				if (!insights[project])
					return <Loading />;

				const { timeline, repartition } = insights[project];
				const progress = (repartition.validated / repartition.total) * 100;

				return (
					<Card
						key={project + i}
						width='100%'
						direction='column'
						borderRadius={15}
						overflow='hidden'
						shadow='md'
					>
						<Stack
							marginTop={5}
							marginBottom={10}
						>
							<Heading
								size='md'
								paddingX={4}
								fontWeight='normal'
							>
								{project}
							</Heading>
							<Heading
								size='lg'
								paddingX={4}
								fontWeight='light'
							>
								<span style={{ fontWeight: 'bold' }}>{progress.toFixed(2)}%</span>
								{' '}{t('validated').toLowerCase()}
							</Heading>
							<Progress
								hasStripe
								isAnimated
								colorScheme='green'
								// bgColor={palette.success.main}
								size='sm'
								value={progress}
							/>
						</Stack>
						<Timeline
							key={i}
							data={timeline}
						/>
						<Stack
							// width='100%'
							align='center'
							textAlign='center'
							padding={5}
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
									const progress = progresses.find(p => p.key === key);
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
												{t(progress.label)}
											</Heading>
										</Stack>
									);
								})}
							</Stack>
						</Stack>
					</Card>
				);
			})}
		</>
	)
}
