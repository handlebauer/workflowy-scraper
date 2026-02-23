#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { Command } from 'commander'

import { collectAuxRoots, writeOutput } from './export/index.ts'
import { WorkFlowyClient, countNodes, queryNodes } from './workflowy/index.ts'

import type { InitData, MatchMode } from './workflowy/index.ts'

const JSON_INDENT = 2

/** Loads init data from a local file or the WorkFlowy API (via WORKFLOWY_SESSION_ID env var). */
async function loadInitData(from?: string): Promise<InitData> {
	if (from) {
		console.log(`Reading from ${from}...`)

		const raw = await readFile(from, 'utf8')

		return JSON.parse(raw) as InitData
	}

	const sessionId = process.env['WORKFLOWY_SESSION_ID']

	if (!sessionId) {
		throw new Error(
			'No data source. Use --file <path> or set the WORKFLOWY_SESSION_ID env var.',
		)
	}

	console.log('Fetching from WorkFlowy API...')

	const client = new WorkFlowyClient(sessionId)

	return client.fetchInitData()
}

const program = new Command()
	.name('wf')
	.description('WorkFlowy scraper: fetch, filter, and export WorkFlowy trees')
	.version(__VERSION__)

program
	.argument('[pattern]', 'filter nodes whose name matches this pattern')
	.requiredOption('-o, --out <dir>', 'output directory')
	.option('-f, --file <path>', 'read from a local JSON file instead of fetching')
	.option('--exact', 'match node name exactly')
	.option('--starts-with', 'match nodes whose name starts with the pattern')
	.option('--regex', 'treat the pattern as a regular expression')
	.action(
		async (
			pattern: string | undefined,
			opts: {
				exact?: boolean
				file?: string
				out: string
				regex?: boolean
				startsWith?: boolean
			},
		) => {
			let mode: MatchMode = 'contains'

			if (opts.exact) {
				mode = 'exact'
			} else if (opts.startsWith) {
				mode = 'starts-with'
			} else if (opts.regex) {
				mode = 'regex'
			}

			const data = await loadInitData(opts.file)

			let roots = collectAuxRoots(data)

			if (pattern) {
				console.log(`Filtering: mode=${mode} pattern="${pattern}"`)
				roots = queryNodes(roots, { mode, pattern })
				console.log(`  Matched ${roots.length} node(s)`)
			}

			await writeOutput(data, roots, opts.out)
			console.log(`\nDone! Output written to ${opts.out}`)
		},
	)

program
	.command('fetch')
	.description('Fetch WorkFlowy data and save the raw JSON')
	.requiredOption('-o, --out <path>', 'output file path')
	.action(async (opts: { out: string }) => {
		const data = await loadInitData()
		const roots = collectAuxRoots(data)
		const total = countNodes(roots)

		await mkdir(dirname(opts.out), { recursive: true })
		await writeFile(opts.out, JSON.stringify(data, null, JSON_INDENT))
		console.log(`\nSaved ${total} nodes to ${opts.out}`)
	})

program.parse()
