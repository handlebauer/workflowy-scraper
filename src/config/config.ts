import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CONFIG_FILENAME = 'config.json'
const JSON_INDENT = 2

interface Config {
	sessionId?: string
}

/** Returns the platform-appropriate config directory for the `wf` CLI. */
export function getConfigDir(): string {
	const xdg = process.env['XDG_CONFIG_HOME']

	if (xdg) {
		return join(xdg, 'wf')
	}

	if (process.platform === 'win32') {
		const appData = process.env['APPDATA']

		if (appData) {
			return join(appData, 'wf')
		}
	}

	return join(homedir(), '.config', 'wf')
}

/** Returns the full path to the config file. */
export function getConfigPath(relative = false): string {
	if (relative) {
		return CONFIG_FILENAME
	}

	return join(getConfigDir(), CONFIG_FILENAME)
}

/** Reads the config file, returning an empty object if it doesn't exist. */
export async function readConfig(): Promise<Config> {
	try {
		const raw = await readFile(getConfigPath(), 'utf8')

		return JSON.parse(raw) as Config
	} catch {
		return {}
	}
}

/** Writes the config file, merging with any existing values. */
export async function writeConfig(updates: Config): Promise<void> {
	const existing = await readConfig()
	const merged = { ...existing, ...updates }
	const dir = getConfigDir()

	await mkdir(dir, { recursive: true })
	await writeFile(getConfigPath(), JSON.stringify(merged, null, JSON_INDENT))
}

/**
 * Resolves the WorkFlowy session ID from the first available source:
 * 1. `WORKFLOWY_SESSION_ID` env var
 * 2. Config file (`~/.config/wf/config.json` or platform equivalent)
 */
export async function resolveSessionId(): Promise<string | undefined> {
	const fromEnv = process.env['WORKFLOWY_SESSION_ID']

	if (fromEnv) {
		return fromEnv
	}

	const config = await readConfig()

	return config.sessionId
}
