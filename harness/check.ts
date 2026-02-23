#!/usr/bin/env bun
import { runTasks } from './utils/runner/index.ts'

import type { TaskRunnerConfig } from './utils/runner/index.ts'

const config: TaskRunnerConfig = {
	tasks: [
		{
			command: 'bunx -p @typescript/native-preview tsgo --build --noEmit',
			id: 'typecheck',
			name: 'Type check',
		},
		{
			command: 'bunx oxlint',
			id: 'oxlint',
			name: 'Lint',
		},
		{
			command: 'bunx oxfmt --check .',
			id: 'oxfmt',
			name: 'Format check',
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
