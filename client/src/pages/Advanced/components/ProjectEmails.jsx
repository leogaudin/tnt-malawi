import { Button, Flex, Heading, HStack, Stack, Text, IconButton, Input } from '@chakra-ui/react';
import { palette } from '../../../theme';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { callAPI, icons, user } from '../../../service';

export default function ProjectEmails() {
    const { t } = useTranslation();
    const [projectEmails, setProjectEmails] = useState([]);

    useEffect(() => {
        fetchEmails()
            .then((data) => {
                if (data && data.emails) {
                    setProjectEmails(Object.entries(data.emails).map(([project, emails]) => ({
                        project,
                        emails
                    })));
                }
            })
            .catch((error) => {
                console.error('Error fetching emails:', error);
            });
    }, [])

    /**
     * @description Fetches the emails associated with each project
     */
    const fetchEmails = async () => {
        try {
            const response = await callAPI('GET', `insights/emails?adminId=${user.id}`);
            if (response.status === 404)
                return { emails: {} };
            if (!response.ok)
                throw new Error('Error fetching emails');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching emails:', error);
        }
    }

    /**
     * @description Fetches the distinct project names
     */
    const getProjects = async () => {
        const response = await callAPI(
            'POST',
            'boxes/distinct/project',
            { filters: { adminId: user.id } }
        )
        const json = await response.json();
        return json.distinct;
    }

    /**
     * @description Adds a new email input field
     */
    const handleAddEmail = async () => {
        setProjectEmails((prev) => {
            return [...prev, { project: '', emails: '' }];
        });
    }

    /**
     * @description Submits the updated emails to the server
     */
    const handleSubmit = () => {
        callAPI(
            'POST',
            `insights/emails?adminId=${user.id}`,
            {
                emails: projectEmails.reduce((acc, { project, emails }) => {
                    acc[project] = emails;
                    return acc;
                }, {})
            }
        )
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error saving emails');
                }
                return response.json();
            })
            .then((_) => {
                alert('Emails saved successfully');
                window.location.reload();
            })
            .catch((error) => {
                console.error('Error saving emails:', error);
            });
    }

    /**
     * @description Resets the emails to empty fields for each existing project
     */
    const handleReset = () => {
        getProjects()
            .then((projects) => {
                const emails = []
                projects.forEach((project) => {
                    emails.push({ project, emails: '' });
                });
                setProjectEmails(emails);
            })
            .catch((error) => {
                console.error('Error fetching projects:', error);
            });
    }

    return (
        <Flex
            direction='column'
            justify='center'
            align='stretch'
            gap={5}
        >
            <Heading>{t('projectEmails')}</Heading>
            <Text size='md'>
                {t('projectEmailsDescription')}
            </Text>
            <Stack>
                {projectEmails.map(({ project, emails }, index) => (
                    <HStack key={index} gap={2.5}>
                        <Input
                            placeholder={t('projectName')}
                            value={project}
                            onChange={(e) => {
                                const newEmails = [...projectEmails];
                                newEmails[index].project = e.target.value;
                                setProjectEmails(newEmails);
                            }}
                        />
                        <Input
                            placeholder={t('emails')}
                            value={emails}
                            onChange={(e) => {
                                const newEmails = [...projectEmails];
                                newEmails[index].emails = e.target.value;
                                setProjectEmails(newEmails);
                            }}
                        />
                        <IconButton
                            variant="outline"
                            icon={<icons.delete />}
                            onClick={() => {
                                setProjectEmails((prev) => prev.filter((_, i) => i !== index));
                            }}
                            color={palette.error.main}
                            borderColor={palette.error.main}
                            bg="transparent"
                        />
                    </HStack>
                ))}
                <IconButton
                    variant="outline"
                    icon={<icons.plus />}
                    onClick={handleAddEmail}
                />
                <Flex
                    gap={2.5}
                    justify='center'
                >
                    <Button
                        variant='solid'
                        onClick={handleSubmit}
                    >
                        {t('saveEmails')}
                    </Button>
                    <Button
                        variant='outline'
                        onClick={handleReset}
                    >
                        {t('resetEmails')}
                    </Button>

                </Flex>
            </Stack>
        </Flex>
    )
}
