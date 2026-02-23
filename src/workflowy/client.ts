import type { InitData } from './types.ts'

const CLIENT_VERSION = 21
const BASE_URL = 'https://workflowy.com'
const NOT_FOUND = 404
const UNAUTHORIZED = 401
const FORBIDDEN = 403

/** HTTP client for the WorkFlowy API, authenticated via session cookie. */
export class WorkFlowyClient {
	private readonly sessionId: string

	constructor(sessionId: string) {
		this.sessionId = sessionId
	}

	/** Fetches the full WorkFlowy tree via the initialization data endpoint. */
	async fetchInitData(): Promise<InitData> {
		const url = `${BASE_URL}/get_initialization_data?client_version=${CLIENT_VERSION}`

		const res = await fetch(url, {
			headers: { Cookie: `sessionid=${this.sessionId}` },
		})

		if (!res.ok) {
			if (
				res.status === NOT_FOUND ||
				res.status === UNAUTHORIZED ||
				res.status === FORBIDDEN
			) {
				throw new Error(
					'Session expired or invalid. Run `wf login` to re-authenticate, or set WORKFLOWY_SESSION_ID.',
				)
			}

			throw new Error(`WorkFlowy API returned ${res.status}: ${res.statusText}`)
		}

		const contentType = res.headers.get('content-type') ?? ''

		if (!contentType.includes('application/json')) {
			throw new Error(
				'Session expired or invalid. Run `wf login` to re-authenticate, or set WORKFLOWY_SESSION_ID.',
			)
		}

		return (await res.json()) as InitData
	}
}
