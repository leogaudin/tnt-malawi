import {
    Card,
    Heading,
    Progress,
    Stack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Timeline from './Timeline';
import Repartition from './Repartition';
import ContentDelivered from '../../../components/ContentDelivered';
import NothingToSee from '../../../components/NothingToSee';

export default function ProjectInsights({
    insights,
    project,
    menu,
}) {
    if (!insights || !insights.timeline || !insights.repartition)
        return <NothingToSee />;

    const { timeline, repartition } = insights;
    const progress = (repartition.validated / repartition.total) * 100;
    const { t } = useTranslation();

    return (
        <Card
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
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    paddingX={4}
                >
                    <Heading
                        size='md'
                        fontWeight='normal'
                    >
                        {project}
                    </Heading>
                    {menu}
                </Stack>
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
                data={timeline}
            />
            <Repartition
                repartition={repartition}
            />
            <ContentDelivered
                content={insights.content}
            />
        </Card>
    );
}
