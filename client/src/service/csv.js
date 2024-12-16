import Papa from 'papaparse';
import { callAPI } from '.';
import lzstring from 'lz-string';
import { boxFields, essentialFields } from './specific';

/**
 *
 * @param {File}		file		The file to be uploaded
 * @param {Function}	setOutput	Function to set the output of the upload
 */
export async function uploadDistributionList(file, setOutput) {
	const data = await file.text();
	const boxes = [];
	const user = JSON.parse(localStorage.getItem('user'));

	Papa.parse(data, {
		skipEmptyLines: true,
		step: (element) => {
			try {
				const newBox = {};
				const fields = [...Object.keys(boxFields), 'schoolLatitude', 'schoolLongitude'];

				fields.forEach((field, index) => {
					if (!element.data[index]
						&& (
							boxFields[field]?.required
							|| (field === 'schoolLatitude' || field === 'schoolLongitude')
						)
					)
						throw new Error(`Field ${field} is missing.`);
					newBox[field] = element.data[index];
				});
				newBox.schoolLatitude = parseFloat(newBox.schoolLatitude.replace(',', '.'));
				newBox.schoolLongitude = parseFloat(newBox.schoolLongitude.replace(',', '.'));
				newBox.adminId = user.id;

				if (isNaN(newBox.schoolLatitude) || isNaN(newBox.schoolLongitude))
					throw new Error(`Latitude ${newBox.schoolLatitude} or Longitude ${newBox.schoolLongitude} is invalid.`);

				boxes.push(newBox);
			} catch (err) {
				setOutput(prev => {
					return [...prev,
						`Error parsing following item:`,
						JSON.stringify(element.data),
						err.message,
						`-------`,
					];
				})
			}
		},
		complete: () => {
			boxes.shift();

			setOutput(prev => {
				return [...prev,
					`Retrieved ${boxes.length} items.`,
					`Uploading...`,
				];
			});

			const BUFFER_LENGTH = 15000;
			const numBoxes = boxes.length;
			let uploaded = 0;
			let uploadedBytes = 0;
			const responses = [];

			const processBuffer = (buffer) => {
				const payload = {
					data: lzstring.compressToEncodedURIComponent(JSON.stringify(buffer)),
				};
				uploadedBytes += payload.data.length;
				callAPI('POST', 'boxes', payload)
				// addBoxes(payload)
					.then((res) => {
						if (res.status >= 400)
							throw new Error(res.statusText);
						return res;
					})
					.then((res) => res.json())
					.then((res) => {
						responses.push(res);
						uploaded += buffer.length;
						setOutput(prev => {
							return [...prev,
								`${uploaded} items uploaded (${Math.round(uploadedBytes / 1000)} KB).`,
							];
						})
						if (uploaded < numBoxes) {
							// There are more boxes
							const nextBuffer = boxes.slice(uploaded, uploaded + BUFFER_LENGTH);
							processBuffer(nextBuffer);
						} else {
							// All boxes have been uploaded
							const inserted = responses.reduce((acc, res) => acc + res.insertedCount, 0);

							setOutput(prev => {

								return [...prev,
									`-------`,
									`All items uploaded.`,
									`${inserted} items added to database.`,
									`-------`,
									`Reload the page to see the changes.`,
									`-------`,
								];
							});
						}
					})
					.catch((err) => {
						console.error(err);
						setOutput(prev => {
							return [...prev,
								`Error uploading items`,
								err.response?.data?.error?.message || err.message,
							];
						})
					});
			};

			processBuffer(boxes.slice(0, BUFFER_LENGTH));
		}
	})
}

/**
 *
 * @param {File}		file		The file to be uploaded
 * @param {Function}	setOutput	Function to set the output of the upload
 */
export async function updateGPSCoordinates(file, setOutput) {
	const data = await file.text();
	const boxes = [];

	Papa.parse(data, {
		skipEmptyLines: true,
		step: (element) => {
			try {
				const newBox = {};
				const fields = [...essentialFields, 'schoolLatitude', 'schoolLongitude'];

				fields.forEach((field, index) => {
					if (!element.data[index])
						throw new Error(`Field ${field} is missing.`);
					newBox[field] = element.data[index];
				});

				if (boxes.length && isNaN(parseFloat(newBox.schoolLatitude.replace(',', '.'))) || isNaN(parseFloat(newBox.schoolLongitude.replace(',', '.'))))
					throw new Error(`Latitude ${newBox.schoolLatitude} or Longitude ${newBox.schoolLongitude} is invalid.`);

				newBox.schoolLatitude = parseFloat(newBox.schoolLatitude.replace(',', '.'));
				newBox.schoolLongitude = parseFloat(newBox.schoolLongitude.replace(',', '.'));

				if (isNaN(newBox.schoolLatitude) || isNaN(newBox.schoolLongitude))
					throw new Error(`Latitude ${newBox.schoolLatitude} or Longitude ${newBox.schoolLongitude} is invalid.`);

				boxes.push(newBox);
			} catch (err) {
				setOutput(prev => {
					return [...prev,
						`Error parsing following item:`,
						JSON.stringify(element.data),
						err.message,
						`-------`,
					];
				})
			}
		},
		complete: () => {
			boxes.shift();

			if (!boxes.length) {
				setOutput(prev => {
					return [...prev,
						`No valid items found.`,
					];
				});
				return;
			}

			setOutput(prev => {
				return [...prev,
					`Retrieved ${boxes.length} items.`,
					`Uploading...`,
				];
			});

			const BUFFER_LENGTH = 100;
			const numBoxes = boxes.length;
			let uploaded = 0;
			let uploadedBytes = 0;
			let updated = 0;
			let recalculated = 0;
			const responses = [];

			const processBuffer = (buffer) => {
				callAPI('POST', 'boxes/coords', { boxes: buffer })
					.then((res) => {
						if (res.status >= 400)
							throw new Error(res.statusText);
						return res;
					})
					.then((res) => res.json())
					.then((res) => {
						responses.push(res);
						uploaded += buffer.length;
						uploadedBytes += JSON.stringify({boxes: buffer}).length;
						updated += res.updatedCount;
						recalculated = res.recalculatedCount;
						setOutput(prev => {
							return [...prev,
								`${res.updatedCount} objects updated.`,
							];
						})
						if (uploaded < numBoxes) {
							// There are more boxes
							const nextBuffer = boxes.slice(uploaded, uploaded + BUFFER_LENGTH);
							processBuffer(nextBuffer);
						} else {
							// All boxes have been uploaded
							setOutput(prev => {
								return [...prev,
									`-------`,
									`Uploaded ${uploaded} coordinates (${Math.round(uploadedBytes / 1000)} KB).`,
									`Updated coordinates of ${updated} objects.`,
									`Recalculated scans in ${recalculated} objects.`,
									`-------`,
									`Reload the page to see the changes.`,
									`-------`,
								];
							});
						}
					})
					.catch((err) => {
						console.error(err);
						setOutput(prev => {
							return [...prev,
								`Error uploading items`,
								err.response?.data?.error?.message || err.message,
							];
						})
					});
			};

			processBuffer(boxes.slice(0, BUFFER_LENGTH));
		}
	});
}
