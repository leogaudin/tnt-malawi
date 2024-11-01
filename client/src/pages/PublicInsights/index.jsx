import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAllBoxes } from '../../service';
import Insights from '../Home/components/Insights';
import BoxesLoading from '../../components/BoxesLoading';
import { Heading } from '@chakra-ui/react';
import { computeInsights } from '../../service/stats';

export default function PublicInsights() {
	const { id } = useParams();
	const [insights, setInsights] = useState(null);

	useEffect(() => {
		fetchAllBoxes(id, () => {})
			.then((boxes) => {
				computeInsights(boxes, setInsights)
			})
			.catch((e) => console.error(e))
	}, [id])

	return (
		<>
			{insights
				? <Insights insights={insights} />
				: <BoxesLoading />
			}
		</>
	);
}
