import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { palette } from '../../../theme';
import { Map, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getLatLngCenter, getZoomLevel } from '../../../service/utils';

function ScansMap({
	box,
}) {
	const { t } = useTranslation();
	const containerRef = useRef(null);
	const scans = box?.scans || [];

	if (scans.length === 0)
		return null;

	scans.sort((a, b) => {
		return a.time - b.time;
	});

	const coords = scans.map(scan => {
		return [
			scan.location.coords.longitude,
			scan.location.coords.latitude,
		];
	});

	if (box?.schoolLatitude && box?.schoolLongitude)
		coords.push([
			box?.schoolLongitude,
			box?.schoolLatitude,
		]);

	const initMap = () => {
		const center = getLatLngCenter(coords);
		const zoom = getZoomLevel(coords);

		const map = new Map({
			container: containerRef.current,
			style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
			center,
			zoom,
		});
		map._container.style.width = '100%';
		return map;
	};

	const addMarkers = (map) => {
		const features = scans.map(scan => {
			return {
				type: 'Feature',
				properties: {
					message: `${scan.operatorId}\n${new Date(scan.time).toUTCString()}\n${scan.comment}`,
					iconSize: [50, 50],
					icon: `<svg fill='${palette.primary.main}' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path d='M21,2H15a1,1,0,0,0-1,1V9a1,1,0,0,0,1,1h1v2h2V10h2v2h2V3A1,1,0,0,0,21,2ZM18,8H16V4h4V8ZM3,10H9a1,1,0,0,0,1-1V3A1,1,0,0,0,9,2H3A1,1,0,0,0,2,3V9A1,1,0,0,0,3,10ZM4,4H8V8H4ZM5,16v2H3V16ZM3,20H5v2H3Zm4-2v2H5V18Zm0-2H5V14H7V12H9v4ZM5,12v2H3V12Zm9,3v1H13V14H11v4h3v3a1,1,0,0,0,1,1h6a1,1,0,0,0,1-1V15a1,1,0,0,0-1-1H16V12H14Zm6,1v4H16V16ZM9,18h2v2h1v2H7V20H9ZM13,6H11V4h2ZM11,8h2v4H11ZM5,5H7V7H5ZM17,5h2V7H17Zm2,14H17V17h2Z'/></svg>`,
					color: palette.primary.main,
				},
				geometry: {
					type: 'Point',
					coordinates: [
						scan.location.coords.longitude,
						scan.location.coords.latitude,
					]
				},
			};
		});

		if (box?.schoolLatitude && box?.schoolLongitude)
			features.push({
				type: 'Feature',
				properties: {
					message: t('recipient'),
					iconSize: [50, 50],
					icon: `<svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M7 6H17.2C18.8802 6 19.7202 6 20.362 6.32698C20.9265 6.6146 21.3854 7.07354 21.673 7.63803C22 8.27976 22 9.11984 22 10.8V18H11M7 6C9.20914 6 11 7.79086 11 10V18M7 6C4.79086 6 3 7.79086 3 10V18H11M17 3H14V12M10 18V21H14V18M7 12H7.01' stroke='${palette.success.main}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`,
					color: palette.success.main,
				},
				geometry: {
					type: 'Point',
					coordinates: [
						box?.schoolLongitude,
						box?.schoolLatitude,
					],
				},
			});

		const geojson = {
			type: 'FeatureCollection',
			features: features,
		};

		geojson.features.forEach((marker) => {
			const element = document.createElement('div');
			element.className = 'marker';
			element.innerHTML = marker.properties.icon;
			const style = {
				width: `${marker.properties.iconSize[0]}px`,
				height: `${marker.properties.iconSize[1]}px`,
				padding: '10px',
				borderRadius: '50%',
				border: `1.5px solid ${marker.properties.color}`,
				backgroundColor: 'white',
				cursor: 'pointer',
			};
			Object.keys(style).forEach(key => {
				element.style[key] = style[key];
			});

			element.onclick = () => {
				window.alert(marker.properties.message);
			};

			new Marker({ element })
						.setLngLat(marker.geometry.coordinates)
						.addTo(map);
		});
	};

	const addLines = (map) => {
		const lines = [];

		scans.forEach((scan, index) => {
			if (index === 0) return;
			lines.push([
				[
					scans[index - 1].location.coords.longitude,
					scans[index - 1].location.coords.latitude,
				],
				[
					scan.location.coords.longitude,
					scan.location.coords.latitude,
				],
			]);
		});

		const routes = lines.map(line => {
			return {
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: line,
				},
			};
		});

		const remaining = {
			type: 'Feature',
			geometry: {
				type: 'LineString',
				coordinates: [
					[
						scans[scans.length - 1].location.coords.longitude,
						scans[scans.length - 1].location.coords.latitude,
					],
					[
						box?.schoolLongitude,
						box?.schoolLatitude,
					],
				],
			},
		};

		map.on('load', () => {
			map.addSource('routes', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: routes,
				},
			});
			map.addLayer({
				id: 'routes',
				type: 'line',
				source: 'routes',
				layout: {
					'line-join': 'round',
					'line-cap': 'round',
				},
				paint: {
					'line-color': 'white',
					'line-width': 7,
				},
			});
			if (remaining.geometry.coordinates[1][0] && remaining.geometry.coordinates[1][1]) {
				map.addSource('remaining', {
					type: 'geojson',
					data: remaining,
				});
				map.addLayer({
					id: 'remaining',
					type: 'line',
					source: 'remaining',
					layout: {
						'line-join': 'round',
						'line-cap': 'round',
					},
					paint: {
						'line-color': 'white',
						'line-opacity': 0.75,
						'line-width': 7,
						'line-dasharray': [1, 2],
					},
				});
			}
		});
	};

	useEffect(() => {
		const map = initMap();
		addMarkers(map);
		addLines(map);
	}, [containerRef]);

	return (
		<div
			id='map'
			style={{
				borderRadius: 10,
				height: 400,
			}}
			ref={containerRef}
		>

		</div>
	);

}

export default React.memo(ScansMap);
