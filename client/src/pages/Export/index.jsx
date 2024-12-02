import { Flex, Icon, Stack } from '@chakra-ui/react';
import BoxFiltering from '../../components/BoxFiltering';
import { useContext, useState } from 'react';
import AppContext from '../../context';
import PDFExport from './components/PDFExport';
import { icons } from '../../service';
import { palette } from '../../theme';
import Report from './components/Report';

export default function Export() {
	const [filters, setFilters] = useState([]);
	const [count, setCount] = useState(0);

	return (
		<Flex
			wrap='wrap'
			justify='center'
			align='stretch'
			direction='column'
			gap={5}
		>
			<BoxFiltering
				filters={filters}
				setFilters={setFilters}
				count={count}
				setCount={setCount}
			/>
			<Stack>
				<PDFExport
					filters={filters}
					folderName={`TnT Labels - ${new Date().toISOString().slice(0, 10)}`}
					/>
				<Report
					filters={filters}
				/>
			</Stack>
		</Flex>
	)
}
