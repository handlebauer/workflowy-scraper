import { bold, dim } from 'colorette'

import { isInteractive, Spinner } from './spinner.ts'

import type { RunStepOptions } from './types.ts'

const EXIT_INDENT = '  '
const INDENT_SPACES = 4
const MILLIS_PER_SECOND = 1000
const ROUND_MILLISECONDS = 0
const DURATION_DECIMALS = 2

type ShellError = Error &
	Readonly<{
		exitCode: number
		stderr: Buffer
		stdout: Buffer
	}>

type RunTask<T> = () => T | Promise<T>

/**
 * Check whether an error carries shell output (stderr/stdout).
 *
 * Bun shell commands that fail throw a `ShellError` with Buffer
 * properties. This guard narrows the type without importing internals.
 */
function isShellError(error: unknown): error is ShellError {
	return error instanceof Error && 'exitCode' in error && 'stderr' in error && 'stdout' in error
}

/**
 * Indent every line of a multi-line string.
 */
function indentLines(text: string, indent: string): string {
	return text
		.split('\n')
		.map(line => `${indent}${line}`)
		.join('\n')
}

/**
 * Log the stderr/stdout from a failed shell command.
 */
function logShellError(error: ShellError): void {
	console.error(`${EXIT_INDENT}Exit Code: ${String(error.exitCode)}`)

	const stdout = error.stdout.toString().trim()
	const stderr = error.stderr.toString().trim()

	if (stdout) {
		console.error(`${EXIT_INDENT}Stdout:`)
		console.error(indentLines(stdout, ' '.repeat(INDENT_SPACES)))
	}

	if (stderr) {
		console.error(`${EXIT_INDENT}Stderr:`)
		console.error(indentLines(stderr, ' '.repeat(INDENT_SPACES)))
	}
}

/**
 * Log additional error details after a step failure.
 *
 * In TTY mode the spinner already rendered the failure line, so only
 * extra details (exit code, stdout, stderr) are printed. In non-TTY
 * mode the header is printed since the spinner was silent.
 *
 * For non-shell errors the caller (e.g. a builtin check) is expected
 * to have already printed its own context, so only shell errors get
 * extra detail here.
 *
 * @param label - Step label (used in non-TTY header)
 * @param error - Caught error
 */
function logStepFailure(label: string, error: unknown): void {
	if (!isInteractive()) {
		console.error(`✖ Failed: ${label}`)
	}

	if (isShellError(error)) {
		console.error('')
		logShellError(error)
	}
}

/**
 * Format elapsed time since start (ms or seconds).
 *
 * @param startTimeMs - Start timestamp in milliseconds
 * @returns Formatted duration string (e.g. "[1.23s]" or "[184ms]")
 */
function formatDuration(startTimeMs: number): string {
	const elapsedMs = Date.now() - startTimeMs
	const formatted =
		elapsedMs < MILLIS_PER_SECOND
			? `${Math.round(elapsedMs).toFixed(ROUND_MILLISECONDS)}ms`
			: `${(elapsedMs / MILLIS_PER_SECOND).toFixed(DURATION_DECIMALS)}s`

	return dim(`[${formatted}]`)
}

/**
 * Run a task with spinner/timing and structured error output.
 *
 * Supports:
 * - `runStep('Done!')`
 * - `runStep('Running checks', fn, 'Checks passed')`
 * - `runStep('Publishing', fn, result => \`Published \${result.version}\`)`
 *
 * The `replace` option clears the spinner line on success instead of printing
 * a final success line.
 */
export async function runStep(text: string): Promise<void>
// eslint-disable-next-line max-params
export async function runStep<T>(
	text: string,
	action: RunTask<T>,
	successText?: string | ((result: T) => string),
	options?: RunStepOptions,
): Promise<T>
// eslint-disable-next-line max-params
export async function runStep<T>(
	text: string,
	action?: RunTask<T>,
	successText?: string | ((result: T) => string),
	options?: RunStepOptions,
): Promise<T | void> {
	const spinner = new Spinner(text)

	if (!action) {
		spinner.start()
		spinner.update('success', bold(text))
		spinner.stop()

		return
	}

	spinner.start()

	const startTimeMs = Date.now()

	try {
		const result = await action()

		if (options?.replace) {
			spinner.clear()
		} else {
			const finalText =
				typeof successText === 'function' ? successText(result) : (successText ?? text)

			spinner.update('success', `${bold(finalText)} ${formatDuration(startTimeMs)}`)
			spinner.stop()
		}

		return result
	} catch (error: unknown) {
		spinner.update('error')
		spinner.stop()

		logStepFailure(text, error)

		throw error
	}
}
