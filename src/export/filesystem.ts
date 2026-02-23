import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { countNodes } from '../workflowy/tree.ts'
import { nodeToMarkdown } from './markdown.ts'

import type { InitData, WfNode } from '../workflowy/types.ts'

const JSON_INDENT = 2
const ROOT_DEPTH = 0

/** Collects all top-level nodes from both the main tree and auxiliary (shared/team) trees. */
export function collectAllRoots(data: InitData): WfNode[] {
	const main = data.projectTreeData.mainProjectTreeInfo.rootProjectChildren
	const aux = data.projectTreeData.auxiliaryProjectTreeInfos.flatMap(a => {
		const root: WfNode = { ...a.rootProject, ch: a.rootProjectChildren }

		return [root]
	})

	return [...main, ...aux]
}

/** Assembles auxiliary (shared/team) trees into a single list of top-level nodes. */
export function collectAuxRoots(data: InitData): WfNode[] {
	return data.projectTreeData.auxiliaryProjectTreeInfos.map(a => ({
		...a.rootProject,
		ch: a.rootProjectChildren,
	}))
}

/** Builds a single markdown document from a list of root nodes. */
export function buildMarkdown(roots: WfNode[]): string {
	const lines = roots.map(node => nodeToMarkdown(node, ROOT_DEPTH))

	return `${lines.join('\n')}\n`
}

/** Serializes a list of root nodes as pretty-printed JSON. */
export function buildJson(roots: WfNode[]): string {
	return JSON.stringify(roots, null, JSON_INDENT)
}

/** Writes content to a file, creating parent directories as needed. */
export async function writeToFile(content: string, filePath: string): Promise<number> {
	await mkdir(dirname(filePath), { recursive: true })
	await writeFile(filePath, content)

	return content.length
}

/** Returns the total node count for a set of roots. */
export function totalNodeCount(roots: WfNode[]): number {
	return countNodes(roots)
}
