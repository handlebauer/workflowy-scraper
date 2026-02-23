#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

import { Command } from 'commander'

import { collectAuxRoots, writeOutput } from './export/index.ts'
import { WorkFlowyClient, countNodes, queryNodes } from './workflowy/index.ts'

import type { InitData, MatchMode } from './workflowy/index.ts'

const EXIT_FAILURE = 1
const JSON_INDENT = 2
const VALID_MODES: MatchMode[] = ['contains', 'exact', 'regex', 'starts-with']

/** Loads init data from a local file or the WorkFlowy API. */
async function loadInitData(options: { input?: string; sessionId?: string }): Promise<InitData> {
	if (options.input) {
		console.log(`Reading from ${options.input}...`)

		const raw = await readFile(options.input, 'utf8')

		return JSON.parse(raw) as InitData
	}

	const sessionId = options.sessionId ?? process.env['WORKFLOWY_SESSION_ID']

	if (!sessionId) {
		throw new Error(
			'No data source provided. Use --input <file> or --session-id <id> (or WORKFLOWY_SESSION_ID env var).',
		)
	}

	const client = new WorkFlowyClient(sessionId)

	return client.fetchInitData()
}

const program = new Command()
	.name('wf')
	.description('WorkFlowy scraper: fetch, filter, and export WorkFlowy trees')
	.version('0.1.0')

program
	.command('export')
	.description('Export WorkFlowy data as JSON and Markdown')
	.option('-i, --input <path>', 'read from a local JSON file instead of fetching')
	.option('-s, --session-id <id>', 'WorkFlowy session cookie (or WORKFLOWY_SESSION_ID env var)')
	.option('-o, --output <dir>', 'output directory', './out')
	.option('-m, --match <pattern>', 'filter nodes whose name matches this pattern')
	.option('--match-mode <mode>', 'match mode: exact, starts-with, contains, regex', 'contains')
	.action(
		async (opts: {
			input?: string
			matchMode: string
			match?: string
			output: string
			sessionId?: string
		}) => {
			const matchMode = opts.matchMode as MatchMode

			if (!VALID_MODES.includes(matchMode)) {
				console.error(
					`Invalid --match-mode "${matchMode}". Must be one of: ${VALID_MODES.join(', ')}`,
				)
				process.exit(EXIT_FAILURE)
			}

			const data = await loadInitData({ input: opts.input, sessionId: opts.sessionId })

			let roots = collectAuxRoots(data)

			if (opts.match) {
				console.log(`Filtering: mode=${matchMode} pattern="${opts.match}"`)
				roots = queryNodes(roots, { mode: matchMode, pattern: opts.match })
				console.log(`  Matched ${roots.length} node(s)`)
			}

			await writeOutput(data, roots, opts.output)
			console.log(`\nDone! Output written to ${opts.output}`)
		},
	)

program
	.command('fetch')
	.description('Fetch WorkFlowy data and save the raw JSON')
	.option('-s, --session-id <id>', 'WorkFlowy session cookie (or WORKFLOWY_SESSION_ID env var)')
	.option('-o, --output <path>', 'output file path', './out/workflowy.json')
	.action(async (opts: { output: string; sessionId?: string }) => {
		const data = await loadInitData({ sessionId: opts.sessionId })
		const roots = collectAuxRoots(data)
		const total = countNodes(roots)

		const { mkdir, writeFile } = await import('node:fs/promises')
		const { dirname } = await import('node:path')

		await mkdir(dirname(opts.output), { recursive: true })
		await writeFile(opts.output, JSON.stringify(data, null, JSON_INDENT))
		console.log(`\nSaved ${total} nodes to ${opts.output}`)
	})

program.parse()
