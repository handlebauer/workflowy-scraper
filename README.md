# workflowy-scraper

CLI tool to export your personal [WorkFlowy](https://workflowy.com) data as Markdown or JSON.

WorkFlowy doesn't offer a public API or bulk export. This tool uses their internal API to pull your entire outline (including shared/team trees), optionally filter it by node name, and write the results to stdout or a file. Useful for local backups, search, CI pipelines, or feeding your notes into other tools.

## Setup

```bash
bun install
```

## Authentication

The CLI needs your WorkFlowy session cookie. It checks these sources in order:

1. `WORKFLOWY_SESSION_ID` environment variable
2. Local config file (`~/.config/wf/config.json`)

### Interactive login (recommended for local use)

```bash
wf login
# Paste your session ID (DevTools → Application → Cookies → sessionid): ********
# → Saved to ~/.config/wf/config.json
```

### Environment variable (recommended for CI)

```bash
export WORKFLOWY_SESSION_ID=<your-session-id>
```

The session cookie is valid for ~6 months. In CI, store it as a secret and rotate when it expires.

## CLI

### Export (default command)

Loads WorkFlowy data, optionally filters by node name, and writes markdown to stdout. Use `-o` to write to a file, `--json` for JSON output.

```bash
# Markdown to stdout
wf

# Pipe / redirect
wf "Academics Root" --exact > academics.md
wf "Academics Root" --exact | head -100

# Write to a file
wf -o workflowy.md
wf "Academics Root" --exact -o academics.md

# JSON output
wf --json
wf "Academics Root" --exact --json -o academics.json

# Read from a local JSON file instead of fetching
wf -f workflowy.json
wf "Academics Root" -f workflowy.json --exact -o academics.md

# Match modes
wf "Academics"                          # contains (default)
wf "Academics Root" --exact             # exact match
wf "Acad" --starts-with                 # starts-with
wf "^Academics.*Root$" --regex          # regex
```

### Fetch

Downloads the raw WorkFlowy initialization data as JSON — useful for caching locally.

```bash
wf fetch -o workflowy.json
```

### Options reference

```
wf [pattern] [-o <path>] [-f <file>] [--json] [--exact | --starts-with | --regex]
wf fetch -o <path>
wf login
```

| Flag                | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `-o, --out <path>`  | Write output to a file instead of stdout                     |
| `-f, --file <path>` | Read from a local JSON file instead of fetching from the API |
| `--json`            | Output JSON instead of markdown                              |
| `--exact`           | Match node name exactly                                      |
| `--starts-with`     | Match nodes whose name starts with the pattern               |
| `--regex`           | Treat the pattern as a regular expression                    |

When no match flag is given, the default mode is **contains**.

### How matching works

The filter performs a **depth-first search** across the entire tree, not just top-level nodes. When a node's name matches the pattern, that node and its **full subtree** are included in the output. Children of a matched node are not searched further (no duplicate results).

Given a tree like:

```
Work
├── Projects
│   ├── Alpha
│   └── Beta
└── Archive
    └── Alpha (old)
Hobbies
└── Reading
```

| Command                 | Matches                | Output includes                |
| ----------------------- | ---------------------- | ------------------------------ |
| `wf "Alpha"`            | `Alpha`, `Alpha (old)` | Both nodes with their subtrees |
| `wf "Projects" --exact` | `Projects`             | `Projects` → `Alpha`, `Beta`   |
| `wf "Al" --starts-with` | `Alpha`, `Alpha (old)` | Both nodes                     |
| `wf "^Work$" --regex`   | `Work`                 | Entire `Work` subtree          |

Key behaviours:

- Matching is on the **node name only** (not notes)
- HTML tags in node names are stripped before matching
- A matched node's children come along for free; they are not individually tested

## Build

```bash
bun run build    # bundle to dist/ via tsdown
```

## Development

```bash
# Run from source
bun run wf -- "Academics Root" --exact -o academics.md

# Markdown to stdout
bun run wf -- "Academics Root" --exact

# Lint + format
bun run check
```

## Library

The package also exports its internals for programmatic use:

```ts
import { WorkFlowyClient, queryNodes, collectAuxRoots, buildMarkdown } from 'workflowy-scraper'
```
