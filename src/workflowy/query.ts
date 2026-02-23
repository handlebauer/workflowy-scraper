import { stripHtml } from '../utils/html.ts'

import type { QueryOptions, WfNode } from './types.ts'

/** Builds a predicate function from the given query options. */
function buildMatcher(options: QueryOptions): (name: string) => boolean {
	const { mode, pattern } = options

	switch (mode) {
		case 'exact': {
			return name => name === pattern
		}

		case 'starts-with': {
			return name => name.startsWith(pattern)
		}

		case 'contains': {
			return name => name.includes(pattern)
		}

		case 'regex': {
			const re = new RegExp(pattern)

			return name => re.test(name)
		}
	}
}

/**
 * Searches the tree depth-first and returns all nodes whose stripped name
 * matches the query. Matched nodes are returned with their full subtree intact.
 */
export function queryNodes(roots: WfNode[], options: QueryOptions): WfNode[] {
	const matches = buildMatcher(options)
	const results: WfNode[] = []

	/** Walks the tree, collecting nodes that match. */
	function walk(nodes: WfNode[]): void {
		for (const node of nodes) {
			if (matches(stripHtml(node.nm))) {
				results.push(node)
			} else if (node.ch) {
				walk(node.ch)
			}
		}
	}

	walk(roots)

	return results
}
