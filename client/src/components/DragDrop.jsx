import { Flex } from '@chakra-ui/react';
import { palette } from '../theme';
import { useRef, useState } from 'react';

export default function DragDrop({
	onFile,
	height = 400,
	accept = ['.csv'],
	children,
}) {
	const [hover, setHover] = useState(false);
	const inputFile = useRef(null);

	const handleDragEnter = e => {
		e.preventDefault();
		setHover(true);
		e.stopPropagation();
	};

	const handleDragLeave = e => {
		e.preventDefault();
		setHover(false);
		e.stopPropagation();
	};

	const handleDragOver = e => {
		e.preventDefault();
		setHover(true);
		e.stopPropagation();
	};

	const handleDrop = e => {
		e.preventDefault();
		onChangeFile(e);
		e.stopPropagation();
	};

	const handleClick = e => {
		inputFile.current.click();
		e.stopPropagation();
	}

	const onChangeFile = e => {
		let files = [];
		e.preventDefault();
		setHover(false);

		if (e.dataTransfer && e.dataTransfer.files)
			files = e.dataTransfer.files;
		else if (e.target.files)
			files = e.target.files;

		if (files[0] && accept.indexOf(`.${files[0].name.split('.').pop()}`) === -1) {
			e.target.value = null;
			return alert('Invalid file type');
		}

		onFile(files[0]);
	}

	return (
		<Flex
			width='100%'
			height={height}
			borderRadius={15}
			border={`1.5px solid ${palette.primary.dark}`}
			bg={hover ? palette.primary.light : 'transparent'}
			align='center'
			justify='center'
			direction='column'
			color={palette.primary.dark}
			cursor='pointer'
			_hover={{
				opacity: 0.8,
			}}
			textAlign='center'
			padding={5}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onClick={handleClick}
		>
			<input
				type='file'
				id='file'
				ref={inputFile}
				onChange={onChangeFile}
				accept={accept.join(',')}
				style={{ display: 'none' }}
			/>
			{children}
		</Flex>
	)
}
