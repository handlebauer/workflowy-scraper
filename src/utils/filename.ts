import { stripHtml } from './html.ts'

const MAX_FILENAME_LENGTH = 100
const FILENAME_SLICE_START = 0

/** Converts a string to a safe filesystem filename (strips HTML, removes illegal chars). */
export function sanitizeFilename(name: string): string {
	const clean = stripHtml(name)
		.replace(/[/\\:*?"<>|]/g, '-')
		.replace(/\s+/g, ' ')
		.replace(/\.+$/g, '')
		.trim()

	if (!clean) {
		return 'untitled'
	}

	return clean.length > MAX_FILENAME_LENGTH
		? clean.slice(FILENAME_SLICE_START, MAX_FILENAME_LENGTH).trim()
		: clean
}
