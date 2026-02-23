const SUCCESS_EXIT_CODE = 0
const TIMEOUT_EXIT_CODE = -1

type CommandError = Error & {
	exitCode: number
	stderr: Buffer
	stdout: Buffer
}

/**
 * Create an Error with attached shell output for failed command invocations.
 *
 * @param message - Error message
 * @param exitCode - Process exit code (or -1 for timeout)
 * @param stdout - Raw stdout bytes
 * @param stderr - Raw stderr bytes
 * @returns Error instance with exitCode, stdout, and stderr properties
 */
function createCommandError(
	message: string,
	exitCode: number,
	stdout: Uint8Array,
	stderr: Uint8Array,
): CommandError {
	const error = new Error(message) as CommandError

	error.exitCode = exitCode
	error.stdout = Buffer.from(stdout)
	error.stderr = Buffer.from(stderr)

	return error
}

/**
 * Run a shell command and throw on non-zero exit or timeout.
 *
 * Uses `sh -lc` so the command runs in a login shell with full env.
 *
 * @param command - Command string to execute
 * @param timeoutMs - Optional timeout in milliseconds; process is killed if exceeded
 * @throws CommandError when the command exits non-zero or times out
 */
export async function runCommand(command: string, timeoutMs?: number): Promise<void> {
	const process = Bun.spawn(['sh', '-lc', command], {
		stderr: 'pipe',
		stdout: 'pipe',
	})
	let didTimeout = false
	let timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined

	if (timeoutMs !== undefined) {
		timeoutHandle = setTimeout(() => {
			didTimeout = true
			process.kill()
		}, timeoutMs)
	}

	const [exitCode, stdoutData, stderrData] = await Promise.all([
		process.exited,
		new Response(process.stdout).bytes(),
		new Response(process.stderr).bytes(),
	])

	if (timeoutHandle !== undefined) {
		clearTimeout(timeoutHandle)
	}

	if (exitCode !== SUCCESS_EXIT_CODE) {
		const timeoutSuffix = didTimeout ? ` (timed out after ${String(timeoutMs)}ms)` : ''

		throw createCommandError(
			`command failed with exit code ${String(exitCode)}${timeoutSuffix}`,
			didTimeout ? TIMEOUT_EXIT_CODE : exitCode,
			stdoutData,
			stderrData,
		)
	}
}
