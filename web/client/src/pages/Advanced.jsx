import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Stack,
	Typography
} from '@mui/material';
import { csvToArray } from '../service/csv';
import { useState } from 'react';
import { updateCoordinates } from '../service';
import { toast } from 'react-toastify';

export default function Advanced() {
	const [loading, setLoading] = useState(false);

	const splitArrays = (arr, size) => {
		const result = [];
		for (let i = 0; i < arr.length; i += size) {
			result.push(arr.slice(i, i + size));
		}
		return result;
	}

	const handleSubmit = async () => {
		const file = document.getElementById('coords-input').files[0];
		if (!file) return;
		setLoading(true);
		const result = await csvToArray(file, ['school', 'schoolLatitude', 'schoolLongitude']);
		result.forEach((row) => {
			row.schoolLatitude = parseFloat(row.schoolLatitude);
			row.schoolLongitude = parseFloat(row.schoolLongitude);
		});
		const splitResult = splitArrays(result, 250);
		const responses = await Promise.all(splitResult.map((batch) => updateCoordinates(batch)));
		const updatedCount = responses.reduce((acc, res) => acc + res.updatedCount, 0);
		toast.success(`${updatedCount} boxes updated`);
		setLoading(false);
	}
	return (
		<Box paddingX={'15vw'} paddingY={'10vh'} width={'100%'}>
			<Card style={{ width: '100%', height: '100%', overflow: 'auto', alignItems: 'center' }}>
				<CardContent>
					<Typography variant='h5' align='center'>Update coordinates</Typography>
					<Stack spacing={2} padding={2}>
						<Alert severity='warning'>
							<Typography variant='overline'>
								Upload a .csv sheet with only three columns: school name, new latitude, and new longitude.
								<br/>
								Please make sure your data is clean and that the school name is spelled exactly as it was uploaded.
								<br/>
								Example: if a row's first column is "CHANKHOMI" but this school is spelled "CHANKHOMI " in the database, the row will be ignored.
							</Typography>
						</Alert>
						<input id='coords-input' type='file' accept='.csv' />
						<Button variant='contained' onClick={handleSubmit}>{loading ? 'Loading...' : 'Update'}</Button>
					</Stack>
				</CardContent>
			</Card>
		</Box>
	);
}
