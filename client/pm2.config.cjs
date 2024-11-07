module.exports = {
	apps: [
		{
			name: "tnt-client",
			script: "npx",
			interpreter: "none",
			args: "serve -p 4242 --cors --single dist/"
		}
	]
}
