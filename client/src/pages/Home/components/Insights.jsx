import Loading from '../../../components/Loading';
import ProjectInsights from './ProjectInsights';
import GlobalInsights from './GlobalInsights';
import { Divider, Flex, IconButton, Tooltip, useToast } from '@chakra-ui/react';
import { computeInsights } from '../../../service/stats';
import { icons, user } from '../../../service';
import { useTranslation } from 'react-i18next';

export default function Insights({ rawInsights, id }) {
	if (!rawInsights)
		return <Loading />;

	const toast = useToast();
	const { t } = useTranslation();

	const grouped = computeInsights(rawInsights, { grouped: true });

	const handleCopy = (project) => {
		const link = `${window.location.href}insights/${user.id}?project=${encodeURIComponent(project)}`;
		toast({
			title: t('copied'),
			status: 'success',
			duration: 1000,
			isClosable: true,
			position: 'top',
		})
		navigator.clipboard.writeText(link);
	}

	return (
		<>
			<GlobalInsights
				rawInsights={rawInsights}
				id={id}
			/>
			<Divider marginY={5} />
			{Object.keys(grouped).map((project, i) => {
				if (!grouped[project])
					return <Loading />;

				return (
					<ProjectInsights
						key={project + i}
						menu={user &&
							<Flex>
								<IconButton
									variant='outline'
									icon={<icons.link />}
									onClick={() => handleCopy(project)}
								/>
							</Flex>
						}
						insights={grouped[project]}
						project={project}
					/>
				)
			})}
		</>
	)
}
