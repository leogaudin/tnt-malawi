import { Flex, Icon, Stack } from '@chakra-ui/react';
import BoxFiltering from '../../components/BoxFiltering';
import { useContext, useState } from 'react';
import AppContext from '../../context';
import PDFExport from './components/PDFExport';
import { icons } from '../../service';
import { palette } from '../../theme';
import Report from './components/Report';

export default function Export() {
	const { boxes } = useContext(AppContext);
	const [filtered, setFiltered] = useState(boxes);
	const [filters, setFilters] = useState([]);

	return (
		<Flex
			wrap='wrap'
			justify='center'
			align='stretch'
			direction='column'
			gap={5}
		>
			<BoxFiltering
				boxes={boxes}
				setFilteredBoxes={setFiltered}
				setFiltersOutside={setFilters}
				includeSearch={false}
			/>
			<Stack>
				<PDFExport
					objects={filtered}
					folderName={`TnT Labels - ${new Date().toISOString().slice(0, 10)}`}
				/>
				<Report
					boxes={filtered}
					filters={filters}
				/>
			</Stack>
		</Flex>
	)
}
