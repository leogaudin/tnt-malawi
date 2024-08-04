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
	const [complete, setComplete] = useState(false);
	const [uploaded, setUploaded] = useState(0);
	const [total, setTotal] = useState(0);
	const [matched, setMatched] = useState(0);
	const [updated, setUpdated] = useState(0);

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
		setTotal(result.length);
		result.forEach((row) => {
			row.schoolLatitude = parseFloat(row.schoolLatitude);
			row.schoolLongitude = parseFloat(row.schoolLongitude);
		});
		const splitResult = splitArrays(result, 50);
		const responses = [];
		for (const batch of splitResult) {
			try {
				const response = await updateCoordinates(batch);
				setUploaded(current => current + batch.length);
				setMatched(current => current + response.matchedCount);
				setUpdated(current => current + response.updatedCount);
				responses.push(response);
			} catch (error) {
				console.error(error);
				toast.error('An error occurred. Please check the console for more information.');
			}
		}
		setComplete(true);
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
								<br />
								Please make sure your data is clean and that the school name is spelled exactly as it was uploaded.
								<br />
								Example: if a row's first column is "CHANKHOMI" but this school is spelled "CHANKHOMI " in the database, the row will be ignored.
							</Typography>
						</Alert>
						<input id='coords-input' type='file' accept='.csv' />
						{loading
							? (
								<Stack spacing={2} direction='row' width='100%' justifyContent='space-between'>
									<Stack alignItems='start'>
										<Typography variant='h1'>
											{uploaded}<span style={{ fontSize: 'initial' }}>/{total}</span>
										</Typography>
										<Typography variant='overline'>coordinates uploaded</Typography>
									</Stack>
									<Stack alignItems='start'>
										<Typography variant='h1'>{matched}</Typography>
										<Typography variant='overline'>boxes matched</Typography>
									</Stack>
									<Stack alignItems='start'>
										<Typography variant='h1'>{updated}</Typography>
										<Typography variant='overline'>boxes updated</Typography>
									</Stack>
								</Stack>
							)
							: <Button variant='contained' onClick={handleSubmit}>Update</Button>
						}
						{complete && (
							<Alert severity='success'>
								Update complete!
								<br />
								{matched} boxes matched, {updated} updated.
							</Alert>
						)}
					</Stack>
				</CardContent>
			</Card>
		</Box>
	);
}
