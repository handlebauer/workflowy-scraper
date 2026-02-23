import { stripHtml } from '../utils/html.ts'

import type { AuxTreeInfo, InitData, WfNode } from './types.ts'

/** Counts all nodes in a tree (including nested children). */
export function countNodes(nodes: WfNode[]): number {
	let count = 0

	for (const node of nodes) {
		count++

		if (node.ch) {
			count += countNodes(node.ch)
		}
	}

	return count
}

/** Finds an auxiliary (shared) tree by its display name. */
export function findAuxTree(data: InitData, name: string): AuxTreeInfo | undefined {
	return data.projectTreeData.auxiliaryProjectTreeInfos.find(
		a => stripHtml(a.rootProject.nm) === name,
	)
}

/** Returns the display names of all auxiliary (shared) trees. */
export function listAuxTreeNames(data: InitData): string[] {
	return data.projectTreeData.auxiliaryProjectTreeInfos.map(a => stripHtml(a.rootProject.nm))
}

const INITIAL_DEPTH = 0
const DEPTH_INCREMENT = 1

/** Invokes a callback for every node in the tree (depth-first). */
export function walkNodes(
	nodes: WfNode[],
	callback: (node: WfNode, depth: number) => void,
	depth = INITIAL_DEPTH,
): void {
	for (const node of nodes) {
		callback(node, depth)

		if (node.ch) {
			walkNodes(node.ch, callback, depth + DEPTH_INCREMENT)
		}
	}
}
