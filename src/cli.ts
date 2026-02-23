#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { cancel, intro, isCancel, log, note, outro, password, spinner } from '@clack/prompts'
import { bgCyan, black, cyan, underline } from 'colorette'
import { Command } from 'commander'

import { getConfigPath, resolveSessionId, writeConfig } from './config/index.ts'
import {
	buildJson,
	buildMarkdown,
	collectAllRoots,
	totalNodeCount,
	writeToFile,
} from './export/index.ts'
import { blank } from './log.ts'
import { WorkFlowyClient, countNodes, queryNodes } from './workflowy/index.ts'

import type { InitData, MatchMode } from './workflowy/index.ts'

const EXIT_FAILURE = 1
const JSON_INDENT = 2
const SINGLE = 1
const VERSION = typeof __VERSION__ === 'string' ? __VERSION__ : 'dev'

/** Whether stdout is connected to a terminal (not piped). */
const isTTY = Boolean(process.stdout.isTTY)

/** Extracts a human-readable message from an unknown error. */
function errorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message
	}

	return String(error)
}

/** Styled file path for CLI output. */
function path(value: string): string {
	return underline(cyan(value))
}

/** Loads init data from a local file or the WorkFlowy API. */
async function loadInitData(s: ReturnType<typeof spinner>, file?: string): Promise<InitData> {
	if (file) {
		s.start(`Reading from ${path(file)}`)

		const raw = await readFile(file, 'utf8')
		const data = JSON.parse(raw) as InitData

		s.stop(`Read from ${path(file)}`)

		return data
	}

	const sessionId = await resolveSessionId()

	if (!sessionId) {
		s.stop('No data source found')

		throw new Error(
			'No data source. Use --file <path>, set WORKFLOWY_SESSION_ID, or run `wf login`.',
		)
	}

	s.start('Fetching from WorkFlowy API')

	const client = new WorkFlowyClient(sessionId)
	const data = await client.fetchInitData()

	s.stop('Fetched from WorkFlowy API')

	return data
}

const program = new Command()
	.name('wf')
	.description('WorkFlowy scraper: fetch, filter, and export WorkFlowy trees')
	.version(VERSION)

program
	.argument('[pattern]', 'filter nodes whose name matches this pattern')
	.option('-o, --out <path>', 'write output to a file instead of stdout')
	.option('-f, --file <path>', 'read from a local JSON file instead of fetching')
	.option('--json', 'output JSON instead of markdown')
	.option('--exact', 'match node name exactly')
	.option('--starts-with', 'match nodes whose name starts with the pattern')
	.option('--regex', 'treat the pattern as a regular expression')
	.action(
		async (
			pattern: string | undefined,
			opts: {
				exact?: boolean
				file?: string
				json?: boolean
				out?: string
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

			if (isTTY) {
				blank()
				intro(bgCyan(black(' wf export ')))
			}

			const s = spinner()

			try {
				const data = await loadInitData(s, opts.file)

				let roots = collectAllRoots(data)

				if (pattern) {
					if (isTTY) {
						log.info(`Filter: mode=${mode} pattern="${pattern}"`)
					}

					s.start('Filtering')
					roots = queryNodes(roots, { mode, pattern })

					const matchLabel = roots.length === SINGLE ? 'node' : 'nodes'
					const subCount = countNodes(roots).toLocaleString()

					s.stop(`Matched ${roots.length} ${matchLabel} (${subCount} sub-nodes)`)
				}

				const content = opts.json ? buildJson(roots) : buildMarkdown(roots)

				if (opts.out) {
					s.start(`Writing to ${path(opts.out)}`)
					await writeToFile(content, opts.out)

					const nodeCount = totalNodeCount(roots).toLocaleString()

					s.stop(`Wrote ${nodeCount} nodes to ${path(opts.out)}`)
				} else {
					process.stdout.write(content)
				}

				if (isTTY) {
					outro('Done')
				}
			} catch (error: unknown) {
				s.stop('Failed')
				log.error(errorMessage(error))
				blank()
				process.exitCode = EXIT_FAILURE
			}
		},
	)

program
	.command('fetch')
	.description('Fetch WorkFlowy data and save the raw JSON')
	.requiredOption('-o, --out <path>', 'output file path')
	.action(async (opts: { out: string }) => {
		blank()
		intro(bgCyan(black(' wf fetch ')))

		const s = spinner()

		try {
			const data = await loadInitData(s)
			const roots = collectAllRoots(data)
			const total = countNodes(roots)

			s.start(`Writing to ${path(opts.out)}`)
			await mkdir(dirname(opts.out), { recursive: true })
			await writeFile(opts.out, JSON.stringify(data, null, JSON_INDENT))
			s.stop(`Wrote ${total.toLocaleString()} nodes to ${path(opts.out)}`)

			outro('Done')
		} catch (error: unknown) {
			s.stop('Failed')
			log.error(errorMessage(error))
			blank()
			process.exitCode = EXIT_FAILURE
		}
	})

program
	.command('login')
	.description('Save your WorkFlowy session ID to the local config file')
	.action(async () => {
		blank()
		intro(bgCyan(black(' wf login ')))

		note('DevTools → Application → Cookies → workflowy.com → sessionid', 'How to find it')

		const sessionId = await password({
			message: 'Session ID',
			validate: (value = '') => {
				if (!value.trim()) {
					return 'Session ID cannot be empty.'
				}
			},
		})

		if (isCancel(sessionId)) {
			cancel('Login cancelled.')
			blank()

			return
		}

		await writeConfig({ sessionId: sessionId.trim() })

		outro(`Saved to ${path(getConfigPath())}`)
	})

program.parse()
