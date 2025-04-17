import { Divider } from '@chakra-ui/react'
import About from './components/About'
import Delete from './components/Delete'
import ProjectEmails from './components/ProjectEmails'

export default function Advanced() {

	return (
		<>
			<Delete />
			<Divider marginY={5} />
			<ProjectEmails />
			<Divider marginY={5} />
			<About />
		</>
	)
}
