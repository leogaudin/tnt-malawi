module.exports = {
	apps: [
		{
			name: "tnt-client",
			script: "npx",
			watch: true,
			interpreter: "none",
			args: "serve -p 4242 --cors --single dist/",
		}
	]
}
