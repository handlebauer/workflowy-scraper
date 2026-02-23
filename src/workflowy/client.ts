import type { InitData } from './types.ts'

const CLIENT_VERSION = 21
const BASE_URL = 'https://workflowy.com'

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
			throw new Error(`WorkFlowy API returned ${res.status}: ${res.statusText}`)
		}

		return (await res.json()) as InitData
	}
}
