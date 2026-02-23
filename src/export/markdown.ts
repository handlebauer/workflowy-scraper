import { stripHtml } from '../utils/html.ts'

import type { WfNode } from '../workflowy/types.ts'

const CHILD_DEPTH_OFFSET = 1
const ROOT_DEPTH = 0

/** Recursively converts a WorkFlowy node tree into indented markdown bullet points. */
export function nodeToMarkdown(node: WfNode, depth: number): string {
	const indent = '  '.repeat(depth)
	const name = stripHtml(node.nm)
	const prefix = node.cp ? '- [x]' : '-'

	let line = `${indent}${prefix} ${name}`

	if (node.no) {
		const note = stripHtml(node.no)
		const noteIndent = '  '.repeat(depth + CHILD_DEPTH_OFFSET)

		line += `\n${noteIndent}> ${note.replace(/\n/g, `\n${noteIndent}> `)}`
	}

	const lines = [line]

	if (node.ch) {
		for (const child of node.ch) {
			lines.push(nodeToMarkdown(child, depth + CHILD_DEPTH_OFFSET))
		}
	}

	return lines.join('\n')
}

/** Builds a complete markdown document for a top-level section node. */
export function buildSectionMarkdown(node: WfNode): string {
	const title = stripHtml(node.nm)
	const parts: string[] = [`# ${title}`, '']

	if (node.no) {
		parts.push(`> ${stripHtml(node.no)}`, '')
	}

	if (node.ch) {
		for (const child of node.ch) {
			parts.push(nodeToMarkdown(child, ROOT_DEPTH))
		}
	}

	parts.push('')

	return parts.join('\n')
}
