module.exports = {
	apps: [{
		name: 'tnt-server',
		script: './index.js',
		watch: true,
		env_production: {
			NODE_ENV: 'production'
		},
		env_development: {
			NODE_ENV: 'development'
		}
	}]
}
