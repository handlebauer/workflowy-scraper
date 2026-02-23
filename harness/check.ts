#!/usr/bin/env bun

import { runTasks } from './utils/runner/index.ts'

import type { TaskRunnerConfig } from './utils/runner/index.ts'

const config: TaskRunnerConfig = {
	tasks: [
		{
			name: 'Type check',
			id: 'typecheck',
			command: 'bunx -p @typescript/native-preview tsgo --build --noEmit',
		},
		{
			name: 'Lint',
			id: 'oxlint',
			command: 'bunx oxlint --fix',
		},
		{
			name: 'Format',
			id: 'oxfmt',
			command: 'bunx oxfmt .',
		},
	],
}

const EXIT_FAILURE = 1

try {
	await runTasks(config)
} catch (error) {
	console.error('')
	console.error(error instanceof Error ? error.message : 'unknown error')
	process.exit(EXIT_FAILURE)
}
