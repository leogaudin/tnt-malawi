import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchInsights } from '../../service';
import Insights from '../Home/components/Insights';
import BoxesLoading from '../../components/BoxesLoading';

export default function PublicInsights() {
	const { id } = useParams();
	const [insights, setInsights] = useState(null);

	useEffect(() => {
		fetchInsights(id)
			.then((insights) => {
				setInsights(insights);
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
