import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchInsights } from '../../service';
import Insights from '../Home/components/Insights';
import BigLoading from '../../components/BoxesLoading';
import ProjectInsights from '../Home/components/ProjectInsights';
import { computeInsights } from '../../service/stats';
import NothingToSee from '../../components/NothingToSee';
import { Stack } from '@chakra-ui/react';

export default function PublicInsights() {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const project = searchParams.get('project');
	const [rawInsights, setRawInsights] = useState(null);
	const [projectInsights, setProjectInsights] = useState(null);
	const [nothingToSee, setNothingToSee] = useState(false);

	useEffect(() => {
		fetchInsights({
			adminId: id,
			...(project ? { project } : {})
		})
			.then((raw) => {
				if (!raw || raw.length === 0) {
					return setNothingToSee(true);
				}
				if (project) {
					setProjectInsights(raw);
				} else {
					setRawInsights(raw);
				}
			})
			.catch((e) => console.error(e))
	}, [id])

	if (nothingToSee) {
		return <NothingToSee />
	}

	if (!rawInsights && !projectInsights) {
		return <BigLoading />
	}

	return (
		<Stack
			width='100%'
		>
			{projectInsights &&
				<ProjectInsights
					insights={computeInsights(projectInsights, { grouped: false })}
					project={project}
					menu={null}
					id={id}
				/>
			}
			{rawInsights &&
				<Insights
					rawInsights={rawInsights}
					id={id}
				/>
			}
		</Stack>
	);
}
