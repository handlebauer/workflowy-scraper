import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getConfigDir, getConfigPath, readConfig, resolveSessionId, writeConfig } from './config.ts'

let savedEnv: Record<string, string | undefined> = {}
let tempDir = ''

beforeEach(async () => {
	savedEnv = {
		APPDATA: process.env['APPDATA'],
		WORKFLOWY_SESSION_ID: process.env['WORKFLOWY_SESSION_ID'],
		XDG_CONFIG_HOME: process.env['XDG_CONFIG_HOME'],
	}
	tempDir = await mkdtemp(join(tmpdir(), 'wf-test-'))
})

afterEach(async () => {
	for (const [key, value] of Object.entries(savedEnv)) {
		if (value === undefined) {
			delete process.env[key]
		} else {
			process.env[key] = value
		}
	}

	await rm(tempDir, { force: true, recursive: true })
})

describe('getConfigDir', () => {
	test('uses XDG_CONFIG_HOME when set', () => {
		process.env['XDG_CONFIG_HOME'] = '/custom/config'

		expect(getConfigDir()).toBe('/custom/config/wf')
	})

	test('falls back to ~/.config/wf when XDG_CONFIG_HOME is unset', () => {
		delete process.env['XDG_CONFIG_HOME']
		delete process.env['APPDATA']

		expect(getConfigDir()).toMatch(/\.config\/wf$/)
	})
})

describe('getConfigPath', () => {
	test('appends config.json to the config dir', () => {
		process.env['XDG_CONFIG_HOME'] = '/custom/config'

		expect(getConfigPath()).toBe('/custom/config/wf/config.json')
	})
})

describe('writeConfig + readConfig', () => {
	test('writes and reads back a session ID', async () => {
		process.env['XDG_CONFIG_HOME'] = tempDir

		await writeConfig({ sessionId: 'test-session-123' })

		const config = await readConfig()

		expect(config.sessionId).toBe('test-session-123')
	})

	test('merges with existing config', async () => {
		process.env['XDG_CONFIG_HOME'] = tempDir

		await writeConfig({ sessionId: 'first' })
		await writeConfig({ sessionId: 'second' })

		const config = await readConfig()

		expect(config.sessionId).toBe('second')
	})

	test('persists valid JSON to disk', async () => {
		process.env['XDG_CONFIG_HOME'] = tempDir

		await writeConfig({ sessionId: 'abc' })

		const raw = await readFile(join(tempDir, 'wf', 'config.json'), 'utf8')
		const parsed = JSON.parse(raw)

		expect(parsed).toEqual({ sessionId: 'abc' })
	})

	test('returns empty object when config file does not exist', async () => {
		process.env['XDG_CONFIG_HOME'] = join(tempDir, 'nonexistent')

		const config = await readConfig()

		expect(config).toEqual({})
	})
})

describe('resolveSessionId', () => {
	test('prefers env var over config file', async () => {
		process.env['XDG_CONFIG_HOME'] = tempDir
		process.env['WORKFLOWY_SESSION_ID'] = 'from-env'

		await writeConfig({ sessionId: 'from-file' })

		const result = await resolveSessionId()

		expect(result).toBe('from-env')
	})

	test('falls back to config file when env var is unset', async () => {
		process.env['XDG_CONFIG_HOME'] = tempDir
		delete process.env['WORKFLOWY_SESSION_ID']

		await writeConfig({ sessionId: 'from-file' })

		const result = await resolveSessionId()

		expect(result).toBe('from-file')
	})

	test('returns undefined when neither source is available', async () => {
		process.env['XDG_CONFIG_HOME'] = join(tempDir, 'nonexistent')
		delete process.env['WORKFLOWY_SESSION_ID']

		const result = await resolveSessionId()

		expect(result).toBeUndefined()
	})
})
