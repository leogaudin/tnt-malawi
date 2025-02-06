import React, { useEffect, useState } from 'react';
import {
	FormControl,
	FormLabel,
	Input,
	InputGroup,
	InputRightElement,
	Button,
	Collapse,
	Flex,
	Image,
	useToast,
} from '@chakra-ui/react';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { palette } from '../../theme';
import { callAPI, user } from '../../service';
import { useNavigate } from 'react-router-dom';
import { sha512 } from 'js-sha512';
import { useTranslation } from 'react-i18next';

export default function Login() {
	const navigate = useNavigate();
	const { t } = useTranslation();

	useEffect(() => {
		if (user)
			navigate('/');
	}, []);

	const [showPassword, setShowPassword] = useState(false);
	const [showFullForm, setShowFullForm] = useState(false);
	const [userExists, setUserExists] = useState(false);
	const [loading, setLoading] = useState(false);

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const toast = useToast();

	const handleUsernameChange = (e) => {
		setUsername(e.target.value);
	}

	const handlePasswordChange = (e) => {
		setPassword(e.target.value);
	}

	const handleAuth = () => {
		if (!username.length || !password.length)
			return;
		const user = {
			username,
			password: sha512(password),
		};
		setLoading(true);
		callAPI('POST', userExists ? 'login' : 'register', user)
			.then(res => res.json())
			.then((res) => {
				if (!res['user'])
					throw new Error();
				localStorage.setItem('user', JSON.stringify(res['user']));
				window.location.reload();
			})
			.catch(e => {
				toast({
					title: t('authError'),
					status: 'error',
					duration: 9000,
					isClosable: true,
					position: 'top',
				});
			})
			.finally(() => setLoading(false));
	}

	const checkIfExists = () => {
		if (!username.length)
			return;
		setLoading(true);
		callAPI('POST', 'login', { username, password: '42' })
			.then((res) => {
				setUserExists(res.status !== 404);
				setShowFullForm(true);
			})
			.catch(e => {
				setUserExists(false);
				setShowFullForm(true);
			})
			.finally(() => setLoading(false));
	}

	useEffect(() => {
		if (showFullForm)
			document.getElementById('password').focus();
	}, [showFullForm]);

	return (
		<Flex height='90vh' direction={{ base: 'column', md: 'row' }} justify='center'>
			<Flex
				width='xs'
				mx='auto'
				direction='column'
				justify='center'
			>
				<FormControl my={2} id='username' isRequired>
					<FormLabel>{t('username')}</FormLabel>
					<Input
						disabled={showFullForm}
						width='100%'
						focusBorderColor={palette.primary.main}
						type='text'
						value={username}
						onChange={handleUsernameChange}
						onKeyDown={e=> {
							if (e.key === 'Enter') {
								checkIfExists();
							}
						}}
					/>
				</FormControl>
				<Collapse in={showFullForm}>
					<FormControl my={2} id='password' isRequired>
						<FormLabel>{t('password')}</FormLabel>
						<InputGroup>
							<Input
								width='100%'
								focusBorderColor={palette.primary.main}
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={handlePasswordChange}
								onKeyDown={e=> {
									if (e.key === 'Enter') {
										handleAuth();
									}
								}}
							/>
							<InputRightElement h='full'>
								<Button
									variant='ghost'
									onClick={() => setShowPassword((showPassword) => !showPassword)}>
									{showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
								</Button>
							</InputRightElement>
						</InputGroup>
					</FormControl>
				</Collapse>
				<Button
					mt={2}
					isLoading={loading}
					size='lg'
					color={palette.background}
					bg={palette.primary.main}
					_hover={{ bg: palette.primary.dark }}
					onClick={
						showFullForm
							? handleAuth
							: checkIfExists
					}
					width='100%'
				>
					{
						showFullForm
						? (
							userExists
							? `${t('welcomeBack')} ${t('login')}`
							: t('createNewAccount')
						)
						: t('continue')
					}
				</Button>
				{showFullForm && (
					<Button
						colorScheme='gray'
						onClick={() => setShowFullForm(false)}
						mt={2}
					>
						{t('goBack')}
					</Button>
				)}
			</Flex>
			<Image
				src='/favicon.svg'
				alt='logo'
				width='100%'
				height='auto'
				maxWidth='33vw'
				mx='auto'
			/>
		</Flex>
	);
}
