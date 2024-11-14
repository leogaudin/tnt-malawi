import { useContext, useEffect, useState } from 'react';
import {
	Flex,
	Box,
	Stack,
	IconButton,
	Image,
	useMediaQuery,
	Heading,
	Text,
	Icon,
	Button,
	Select,
} from '@chakra-ui/react';
import { palette } from '../theme';
import { RxHamburgerMenu } from "react-icons/rx";
import { IoIosClose } from "react-icons/io";
import { getRoutes, icons, navbarWidth, user } from '../service';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n, { languages } from '../language';
import AppContext from '../context';

export default function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const [toggle, setToggle] = useState(false);
	const [isMobile] = useMediaQuery('(max-width: 48em)');

	const { t } = useTranslation();
	const { language, setLanguage } = useContext(AppContext);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 100);
		};

		window.addEventListener('scroll', handleScroll);

		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const navLinks = getRoutes().filter((route) => route.inNav);

	const current = window.location.pathname;

	const NavItems = ({ navLinks }) => (
		<>
			{navLinks.map((nav, i) => (
				<Link key={nav.path + i} to={nav.path}>
					<Flex
						key={nav.path}
						onClick={() => {
							setToggle(false);
						}}
						as='li'
						fontWeight='medium'
						fontSize='18px'
						color={current === nav.path
							? palette.primary.dark
							: 'inherit'
						}
						bg={current === nav.path
							? palette.gray.light
							: 'transparent'
						}
						_hover={{
							opacity: .8,
						}}
						transition={'.25s'}
						paddingX={7}
						paddingY={3.5}
						borderRadius={15}
						width='100%'
						justify='start'
					>
						<Icon as={nav.icon} w={6} h={6} marginRight={5} />
						{nav.title}
					</Flex>
				</Link>
			))}
		</>
	);

	const LogoutButton = () => (
		<Button
			size='sm'
			colorScheme='red'
			variant='ghost'
			onClick={() => {
				localStorage.removeItem('user');
				window.location.reload();
			}}
			opacity={.5}
			_hover={{
				opacity: 1,
			}}
			leftIcon={<icons.exit />}
		>
			{t('logout')}
		</Button>
	);

	if (isMobile)
		return (
			<Flex
				as='nav'
				alignItems='center'
				p={5}
				width='100%'
				bg={palette.background}
			>
				<Flex
					width='100%'
					mx='auto'
					justifyContent='space-between'
					alignItems='center'
				>
					<Box
						display={{ base: 'flex', md: 'none' }}
						flex={1}
						justifyContent='flex-end'
						alignItems='center'
					>
						<IconButton
							aria-label='menu'
							icon={toggle ? <IoIosClose /> : <RxHamburgerMenu />}
							onClick={() => setToggle(!toggle)}
							bg={palette.primary.dark}
							color={palette.background}
						/>
						<Box
							display={toggle ? 'flex' : 'none'}
							p={5}
							position='absolute'
							top='60px'
							right={0}
							mx={4}
							my={2}
							minW='140px'
							bg={palette.background}
							borderWidth={2}
							borderColor={palette.primary.dark}
							borderRadius={20}
							zIndex={10}
						>
							<Stack
								as='ul'
								listStyleType='none'
								justifyContent='flex-end'
								alignItems='flex-start'
								flex={1}
								direction='column'
								gap={5}
							>
								<NavItems navLinks={navLinks} />
								<LogoutButton />
							</Stack>
						</Box>
					</Box>
				</Flex>
			</Flex>
		);
	else
		return (
			<Flex
				as='nav'
				align='start'
				position='fixed'
				left={0}
				height='100vh'
				width={navbarWidth}
				overflow='auto'
				color={palette.gray.main}
			>
				<Flex
					width='100%'
					mx='auto'
					px={5}
					py={10}
					justify='space-between'
					align='stretch'
					height='100%'
					direction='column'
					gap={5}
				>
					<Flex
						justify='center'
					>
						<Image
							src='/favicon.svg'
							alt='logo'
							width='100%'
							height='auto'
							maxWidth='100px'
						/>
					</Flex>
					<Stack>
						<NavItems navLinks={navLinks} />
					</Stack>
					<Stack
						align='center'
						fontSize={'small'}
					>
						<Select
							value={language}
							onChange={(event) => {
								setLanguage(event.target.value);
								i18n.changeLanguage(event.target.value);
							}}
							focusBorderColor='gray'
							fontSize='inherit'
							width='fit-content'
							marginY={3}
						>
							{languages.map((language) => (
								<option key={language.code} value={language.code}>
									{language.label}
								</option>
							))}
						</Select>
						<Text>{t('loggedInAs')}</Text>
						<Heading
							fontSize='inherit'
						>
							{user.email}
						</Heading>
						<LogoutButton />
					</Stack>
				</Flex>
			</Flex>
		);
}
