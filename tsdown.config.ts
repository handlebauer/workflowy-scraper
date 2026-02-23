import { readFileSync } from 'node:fs'

import { defineConfig } from 'tsdown'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))

export default defineConfig({
	clean: true,
	define: {
		__VERSION__: JSON.stringify(version),
	},
	dts: true,
	entry: {
		cli: 'src/cli.ts',
		index: 'src/index.ts',
	},
	format: 'esm',
	outDir: 'dist',
	platform: 'node',
})
