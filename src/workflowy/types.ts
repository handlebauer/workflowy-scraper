export type MatchMode = 'contains' | 'exact' | 'regex' | 'starts-with'

export interface QueryOptions {
	mode: MatchMode
	pattern: string
}

export interface WfNode {
	id: string
	nm: string
	no?: string
	ct: number
	lm: number
	lmb?: number
	cb?: number
	cp?: number
	ch?: WfNode[]
	metadata?: Record<string, unknown>
}

export interface AuxTreeInfo {
	rootProject: WfNode
	rootProjectChildren: WfNode[]
	shareId?: string
	shareType?: string
	accessToken?: string
	permissionLevel?: number
	initialMostRecentOperationTransactionId?: string
	[key: string]: unknown
}

export interface MainTreeInfo {
	rootProject: WfNode | null
	rootProjectChildren: WfNode[]
	dateJoinedTimestampInSeconds: number
	initialMostRecentOperationTransactionId?: string
	[key: string]: unknown
}

export interface InitData {
	projectTreeData: {
		auxiliaryProjectTreeInfos: AuxTreeInfo[]
		clientId: string
		mainProjectTreeInfo: MainTreeInfo
	}
	[key: string]: unknown
}
