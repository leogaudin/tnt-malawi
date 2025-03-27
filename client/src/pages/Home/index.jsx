import { Stack } from '@chakra-ui/react';
import InsightsController from './components/InsightsController';
import Insights from './components/Insights';
import { useContext } from 'react';
import AppContext from '../../context';
import { useTranslation } from 'react-i18next';
import BigLoading from '../../components/BoxesLoading';
import { user } from '../../service';

export default function Home() {
	const { rawInsights } = useContext(AppContext);
	const { t } = useTranslation();

	if (!rawInsights)
		return <BigLoading message={t('insightsLoading')} />

	return (
		<Stack
			width='100%'
		>
			<InsightsController />
			<Insights
				rawInsights={rawInsights}
				id={user.id}
			/>
		</Stack>
	);
}
