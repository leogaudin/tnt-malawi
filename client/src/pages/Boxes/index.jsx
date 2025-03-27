import { useEffect, useState } from 'react';
import PagedGrid from '../../components/PagedGrid';
import BoxCard from '../../components/BoxCard';
import BoxFiltering from '../../components/BoxFiltering';
import { callAPI } from '../../service';

export default function Boxes() {
	const [filters, setFilters] = useState({});
	const [count, setCount] = useState(0);

	const fetchBoxes = async (skip, limit) => {
		const response = await callAPI(
			'POST',
			`boxes/query?skip=${skip}&limit=${limit}`,
			{ filters }
		);
		const json = await response.json();
		return json.boxes || [];
	};

	return (
		<>
			<BoxFiltering
				filters={filters}
				setFilters={setFilters}
				count={count}
				setCount={setCount}
			/>
			<PagedGrid
				// elements={filtered}
				count={count}
				fetchElements={fetchBoxes}
				extraParams={filters}
				renderElement={(box) => (
					<BoxCard box={box} key={box.id} />
				)}
			/>
		</>
	);
}
