/// <references types="houdini-svelte">

/** @type {import('houdini').ConfigFile} */
const config = {
	watchSchema: {
		url: 'http://localhost:8080/query'
	},
	runtimeDir: '.houdini',
	plugins: {
		'houdini-svelte': {
			// forceRunesMode: true
		}
	},
	scalars: {
		Time: {
			type: 'string' // oder z.B. "Date" falls du direkt JS Date-Objekte willst
		}
	}
};

export default config;
