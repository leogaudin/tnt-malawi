import React, { createContext, useEffect, useState } from 'react';
import { callAPI, fetchAllBoxes, user } from '../service';
import { computeInsights } from '../service/stats';

const AppContext = createContext({
	boxes: [],
	insights: [],
	language: 'en',
	setLanguage: () => { },
	loading: true,
});

export const AppProvider = ({ children }) => {
	const [boxes, setBoxes] = useState(null);
	const [language, setLanguage] = useState('en');
	const [loading, setLoading] = useState(true);
	const [insights, setInsights] = useState(null);

	const initTnT = async (setters) => {
		const { setBoxes, setInsights } = setters;
		const res = await callAPI('GET', 'me').then(res => res.json())
		const me = res.data;
		localStorage.setItem('user', JSON.stringify(me));
		Object.assign(user, me);

		const boxes = await fetchAllBoxes(user.id, setBoxes);

		computeInsights(boxes, setInsights)
	}

	useEffect(() => {
		if (!user?.id) return;

		initTnT({ setBoxes, setInsights })
			.then(() => setLoading(false))
			.catch((e) => {
				console.error(e);
			});
	}, []);

	return (
		<AppContext.Provider
			value={{
				boxes,
				insights,
				language,
				setLanguage,
				loading,
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export default AppContext;
