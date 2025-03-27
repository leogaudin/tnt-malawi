import { Flex } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { navbarWidth, user } from '../service';
import Navbar from './Navbar';
import { Helmet } from 'react-helmet-async';
import { name } from '../service/specific';

export default function RouteWrapper({ route }) {
	const navigate = useNavigate();

	useEffect(() => {
		if (!route.public && !user) {
			navigate('/auth');
		}
	}, []);

	return (
		<>
			<Helmet>
				<title>
					{route.title ? `${route.title} - ${name}` : name}
				</title>
			</Helmet>
			<Flex
				direction={{ base: 'column', md: 'row' }}
			>
				{user && <Navbar />}
				<Flex
					marginLeft={{ base: 0, md: user ? navbarWidth : 0 }}
					width='100%'
					height='100%'
					justify='center'
					direction='column'
					overflow='hidden'
					padding={5}
				>
					<route.component />
				</Flex>
			</Flex>
		</>
	)
}
