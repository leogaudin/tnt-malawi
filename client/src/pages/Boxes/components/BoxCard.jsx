import {
	Flex,
	Heading,
	ScaleFade,
	Card,
	CardBody,
	Text,
	Stack,
	useDisclosure,
} from '@chakra-ui/react';
import { palette } from '../../../theme';
import { useTranslation } from 'react-i18next';
import { haversineDistance } from '../../../service/utils';
import Pill from '../../../components/Pill';
import { getProgress } from '../../../service/stats';
import { progresses } from '../../../service';
import BoxModal from './BoxModal';

export default function BoxCard({
	box,
}) {
	const { t } = useTranslation();
	const { onOpen, onClose, isOpen } = useDisclosure();

	const lastScan = box.scans.reduce((acc, curr) => {
		if (!acc || new Date(curr.time) > new Date(acc.time)) {
			return curr;
		}
		return acc;
	}, null)

	const progress = box.progress || getProgress(box);

	const progressMeta = progresses.find((p) => p.key === progress);

	const lastSeen = lastScan
						? Math.round(haversineDistance(
							{ latitude: lastScan.location.coords.latitude, longitude: lastScan.location.coords.longitude },
							{ latitude: box.schoolLatitude, longitude: box.schoolLongitude },
						) / 1000)
						: null;

	return (
		<>
			<BoxModal
				box={box}
				onClose={onClose}
				isOpen={isOpen}
			/>
			<Card
				overflow='hidden'
				borderRadius={15}
				width='100%'
				height='100%'
				direction='column'
				shadow='md'
				color={palette.text}
				onClick={onOpen}
				cursor='pointer'
				_hover={{
					opacity: .7,
				}}
			>
				<ScaleFade in={true}>
					<Flex
						bg={palette.gray.light}
						justify='space-between'
						align='start'
						paddingX={5}
						paddingY={3}
					>
						<Stack>
							<Text>
								<code>{box.id}</code>{' '}
								{t('in')}{'  '}
								<span
									style={{
										fontWeight: 'bold',
									}}
								>
									{box.project}
								</span>
							</Text>
						</Stack>
					</Flex>
					<CardBody>
						<Flex
							flexDirection='row'
							justify='space-between'
						>
							<Stack
								maxWidth='60%'
							>
								<Heading
									size='md'
									fontWeight='light'
								>
									{t('to')}{' '}
									<span
										style={{
											fontWeight: 'bold',
										}}
									>
										{box.school}
									</span>
								</Heading>
							</Stack>
							<Stack
								align='center'
							>
								<Pill
									variant='solid'
									text={t(progress)}
									color={progressMeta.color}
									icon={<progressMeta.icon />}
								/>
								{lastScan &&
									(
										<Text
											color={progressMeta.color}
											opacity={.8}
											textAlign='center'
										>
											{t('lastSeen')}
											<br />
											<span
												style={{
													fontWeight: 'bold',
												}}
											>
												{t('kmAway', { count: lastSeen } )}
											</span>
										</Text>
									)
								}
							</Stack>
						</Flex>
					</CardBody>
				</ScaleFade>
			</Card>
		</>
	)
}
