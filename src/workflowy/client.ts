import type { InitData } from './types.ts'

const CLIENT_VERSION = 21
const BASE_URL = 'https://workflowy.com'
const MS_PER_SECOND = 1000
const TOFIXED_DECIMALS = 1

/** HTTP client for the WorkFlowy API, authenticated via session cookie. */
export class WorkFlowyClient {
	private readonly sessionId: string

	constructor(sessionId: string) {
		this.sessionId = sessionId
	}

	/** Fetches the full WorkFlowy tree via the initialization data endpoint. */
	async fetchInitData(): Promise<InitData> {
		console.log('Fetching initialization data from WorkFlowy...')

		const start = performance.now()
		const url = `${BASE_URL}/get_initialization_data?client_version=${CLIENT_VERSION}`

		const res = await fetch(url, {
			headers: { Cookie: `sessionid=${this.sessionId}` },
		})

		if (!res.ok) {
			throw new Error(`WorkFlowy API returned ${res.status}: ${res.statusText}`)
		}

		const data = (await res.json()) as InitData
		const elapsed = ((performance.now() - start) / MS_PER_SECOND).toFixed(TOFIXED_DECIMALS)

		console.log(`Fetched in ${elapsed}s`)

		return data
	}
}
