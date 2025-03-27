import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Flex } from '@chakra-ui/react';
import { progresses } from '../../../service';

const getPercent = (value, total) => {
	const ratio = total > 0 ? value / total : 0;
	return `${(ratio * 100).toFixed(1)}%`;
};

export default function Timeline({
	data,
	height = 400,
}) {
	const { t } = useTranslation();

	if (!data || !data.length) return null;

	const renderTooltipContent = o => {
		const {
			payload,
			label
		} = o;
		const total = payload.reduce((result, entry) => result + entry.value, 0);
		return (
			<div
				style={{
					background: '#fff',
					border: '1.5px solid #ccc',
					margin: 0,
					padding: 10,
					borderRadius: 5
				}}
			>
				<h3>{`${label}`}</h3>
				<ul
					style={{
						listStyle: 'none'
					}}
				>
					{payload.map(entry => (
						<li key={`item-${entry.name}`} style={{
							color: entry.color
						}}>
							{`${t(entry.name)}: ${entry.value} (${getPercent(entry.value, total)})`}
						</li>
					))}
					<li style={{ fontWeight: 'light' }}>{`${t('total')}: ${total}`}</li>
				</ul>
			</div>
		);
	};

	return (
		<Flex
			height={height}
		>
			<ResponsiveContainer width='100%' height='100%'>
				<AreaChart
					data={data}
				>
					<XAxis dataKey='name' />
					<YAxis />
					<Tooltip content={renderTooltipContent} />
					{Object.keys(progresses).toReversed().map((key, i) => {
						const progress = progresses[key];

						if (!progress)
							return;

						if (progress.inTimeline) {
							return (
								<Area
									key={i}
									type='monotone'
									dataKey={key}
									stackId='1'
									stroke={progress.color}
									fill={progress.color}
								/>
							)
						}
					})}
				</AreaChart>
			</ResponsiveContainer>
		</Flex>
	)
}
