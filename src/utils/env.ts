const EXIT_FAILURE = 1

/** Reads a required env var, exiting with an error message if missing. */
export function requireEnv(name: string, hint?: string): string {
	const value = process.env[name]

	if (!value) {
		const message = hint ? `Missing ${name} env var.\n${hint}` : `Missing ${name} env var.`

		console.error(message)
		process.exit(EXIT_FAILURE)
	}

	return value
}
