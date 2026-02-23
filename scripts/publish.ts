#!/usr/bin/env bun
import { readFile } from 'node:fs/promises'

import { intro, log, outro, spinner } from '@clack/prompts'
import { bgCyan, black } from 'colorette'

const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1
const MS_PER_SECOND = 1000
const PRECISION = 2

interface PackageJson {
	name: string
	version: string
}

/** Reads and parses the local package.json. */
async function readPackageJson(): Promise<PackageJson> {
	const raw = await readFile('./package.json', 'utf8')

	return JSON.parse(raw) as PackageJson
}

/** Returns the currently published version, or null if unpublished. */
async function getPublishedVersion(name: string): Promise<string | null> {
	const proc = Bun.spawn(['npm', 'view', name, 'version'], {
		stderr: 'ignore',
		stdout: 'pipe',
	})

	const output = await new Response(proc.stdout).text()
	const code = await proc.exited

	if (code !== EXIT_SUCCESS) {
		return null
	}

	return output.trim()
}

const startTime = performance.now()
const args = process.argv.slice(PRECISION)
const dryRun = args.includes('--dry-run')

intro(bgCyan(black(' publish ')))

const s = spinner()
const pkg = await readPackageJson()
const { name, version } = pkg

log.info(`${name}@${version}${dryRun ? ' (dry run)' : ''}`)

s.start('Checking npm registry')

const published = await getPublishedVersion(name)

if (published === version) {
	s.stop(`v${version} already published`)
	outro('Nothing to do')

	process.exit(EXIT_SUCCESS)
}

s.stop(published ? `Latest published: v${published}` : 'Not yet published')

s.start('Building')

const build = Bun.spawn(['bun', 'run', 'build'], { stderr: 'inherit', stdout: 'inherit' })

if ((await build.exited) !== EXIT_SUCCESS) {
	s.stop('Build failed')

	process.exit(EXIT_FAILURE)
}

s.stop('Built')

s.start(`Publishing v${version}`)

const publishArgs = ['bun', 'publish', '--access', 'public', '--tag', 'latest']

if (dryRun) {
	publishArgs.push('--dry-run')
}

const publish = Bun.spawn(publishArgs, { stderr: 'inherit', stdout: 'inherit' })

if ((await publish.exited) !== EXIT_SUCCESS) {
	s.stop('Publish failed')

	process.exit(EXIT_FAILURE)
}

s.stop(`Published ${name}@${version}`)

const duration = ((performance.now() - startTime) / MS_PER_SECOND).toFixed(PRECISION)

outro(`${dryRun ? '[dry run] ' : ''}Done in ${duration}s`)
