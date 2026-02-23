import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { countNodes } from '../workflowy/tree.ts'
import { nodeToMarkdown } from './markdown.ts'

import type { InitData, WfNode } from '../workflowy/types.ts'
import type { WriteResult } from './types.ts'

const JSON_INDENT = 2
const ROOT_DEPTH = 0

/** Assembles auxiliary (shared/team) trees into a single list of top-level nodes. */
export function collectAuxRoots(data: InitData): WfNode[] {
	return data.projectTreeData.auxiliaryProjectTreeInfos.map(a => ({
		...a.rootProject,
		ch: a.rootProjectChildren,
	}))
}

/** Builds a single markdown document from a list of root nodes. */
function buildMarkdown(roots: WfNode[]): string {
	const lines = roots.map(node => nodeToMarkdown(node, ROOT_DEPTH))

	return `${lines.join('\n')}\n`
}

/** Writes the raw init data JSON and a markdown rendering of the given roots to disk. */
export async function writeOutput(
	data: InitData,
	roots: WfNode[],
	outputDir: string,
): Promise<WriteResult> {
	await mkdir(outputDir, { recursive: true })

	const nodeCount = countNodes(roots)

	const jsonPath = join(outputDir, 'workflowy.json')

	await writeFile(jsonPath, JSON.stringify(data, null, JSON_INDENT))

	const mdPath = join(outputDir, 'workflowy.md')

	await writeFile(mdPath, buildMarkdown(roots))

	return { jsonPath, mdPath, nodeCount }
}
