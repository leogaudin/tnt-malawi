import React, { createContext, useEffect, useState } from 'react';
import { callAPI, fetchInsights, user } from '../service';

const AppContext = createContext({
	rawInsights: [],
	language: 'en',
	setLanguage: () => { },
});

export const AppProvider = ({ children }) => {
	const [language, setLanguage] = useState('en');
	const [rawInsights, setRawInsights] = useState(null);

	const initTnT = async () => {
		const res = await callAPI('GET', 'auth/me')
							.then(res => res.json())
		const me = res.user;
		localStorage.setItem('user', JSON.stringify(me));
		Object.assign(user, me);

		const rawInsights = await fetchInsights({ adminId: user.id });
		return { rawInsights };
	}

	useEffect(() => {
		if (!user?.id) return;

		initTnT()
			.then((data) => {
				setRawInsights(data.rawInsights);
			})
			.catch((e) => {
				console.error(e);
			});
	}, []);

	return (
		<AppContext.Provider
			value={{
				rawInsights,
				language,
				setLanguage,
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export default AppContext;
