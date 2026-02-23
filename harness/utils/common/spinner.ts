import { blue, green, red } from 'colorette'

import type { TaskStatus } from './types.ts'

const SPINNER_INTERVAL_MS = 80
const STARTING_FRAME_INDEX = 0
const NEXT_FRAME_STEP = 1
const CHECK_MARK = '\u2714'
const CROSS_MARK = '\u2716'
const ANSI_CLEAR_LINE = '\u001B[2K'
const ANSI_CURSOR_HIDE = '\u001B[?25l'
const ANSI_CURSOR_SHOW = '\u001B[?25h'

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

/**
 * Check if stdout is a TTY (interactive terminal).
 *
 * @returns True if output is to a terminal
 */
export function isInteractive(): boolean {
	return Boolean(process.stdout.isTTY)
}

/**
 * Format a single spinner line for display.
 *
 * @param status - Current task status
 * @param text - Label text
 * @param frame - Spinner frame character (when running)
 * @returns Formatted line string
 */
function formatSpinnerLine(status: TaskStatus, text: string, frame: string): string {
	if (status === 'running') {
		return `${blue(frame)} ${text}`
	}

	if (status === 'success') {
		return `${green(CHECK_MARK)} ${text}`
	}

	if (status === 'error') {
		return `${red(CROSS_MARK)} Failed: ${text}`
	}

	return text
}

/**
 * Terminal spinner for long-running tasks.
 *
 * Shows animated frame when running, check/cross on success/error.
 * No-ops when stdout is not a TTY.
 */
export class Spinner {
	private frameIndex = STARTING_FRAME_INDEX
	private intervalId: ReturnType<typeof globalThis.setInterval> | undefined = undefined
	private lineWasRendered = false
	private status: TaskStatus = 'pending'
	private text: string

	constructor(text: string) {
		this.text = text
	}

	/**
	 * Start the spinner animation.
	 */
	start(): void {
		if (!isInteractive()) {
			return
		}

		process.stdout.write(ANSI_CURSOR_HIDE)
		this.status = 'running'
		this.render()
		this.intervalId = globalThis.setInterval(() => {
			this.frameIndex = (this.frameIndex + NEXT_FRAME_STEP) % SPINNER_FRAMES.length

			this.render()
		}, SPINNER_INTERVAL_MS)
	}

	/**
	 * Update status and optionally the display text.
	 *
	 * @param status - New status (running, success, error)
	 * @param text - Optional new label text
	 */
	update(status: TaskStatus, text?: string): void {
		this.status = status

		if (text) {
			this.text = text
		}
	}

	/**
	 * Stop the spinner and show final state.
	 */
	stop(): void {
		if (this.intervalId) {
			globalThis.clearInterval(this.intervalId)
			this.intervalId = undefined
		}

		if (!isInteractive()) {
			return
		}

		this.render()
		process.stdout.write(ANSI_CURSOR_SHOW)
	}

	/**
	 * Clear the spinner line without showing final state.
	 */
	clear(): void {
		if (this.intervalId) {
			globalThis.clearInterval(this.intervalId)
			this.intervalId = undefined
		}

		if (isInteractive() && this.lineWasRendered) {
			process.stdout.write(`\r${ANSI_CLEAR_LINE}`)
			process.stdout.write(ANSI_CURSOR_SHOW)
			this.lineWasRendered = false
		}
	}

	private render(): void {
		const line = formatSpinnerLine(
			this.status,
			this.text,
			SPINNER_FRAMES[this.frameIndex] ?? ' ',
		)

		process.stdout.write(`\r${ANSI_CLEAR_LINE}${line}`)

		if (this.status === 'success' || this.status === 'error') {
			process.stdout.write('\n')
		}

		this.lineWasRendered = true
	}
}
