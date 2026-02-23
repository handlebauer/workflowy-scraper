# workflowy-scraper

Fetch, filter, and export [WorkFlowy](https://workflowy.com) trees as JSON and Markdown.

## Setup

```bash
bun install
```

Authentication uses your WorkFlowy session cookie. Grab it from DevTools → Application → Cookies → `sessionid`, then:

```bash
export WORKFLOWY_SESSION_ID=<your-session-id>
```

## CLI

### Export (default command)

Loads WorkFlowy data, optionally filters by node name, and writes `workflowy.json` + `workflowy.md` to the output directory.

```bash
# Export everything from the API
wf -o ./out

# Export everything from a local JSON file
wf -f workflowy.json -o ./out

# Filter by substring (default match mode)
wf "Academics" -f workflowy.json -o ./out

# Exact match
wf "Academics Root" -f workflowy.json -o ./out --exact

# Starts-with match
wf "Acad" -f workflowy.json -o ./out --starts-with

# Regex match
wf "^Academics.*Root$" -f workflowy.json -o ./out --regex

# Fetch from API + filter in one shot
wf "Academics Root" -o ./out --exact
```

### Fetch

Downloads the raw WorkFlowy JSON without any processing — useful for caching locally.

```bash
wf fetch -o ./cache/workflowy.json
```

### Options reference

```
wf [pattern] -o <dir> [-f <file>] [--exact | --starts-with | --regex]
wf fetch -o <path>
```

| Flag                | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| `-o, --out <path>`  | Output directory (export) or file path (fetch). **Required.** |
| `-f, --file <path>` | Read from a local JSON file instead of fetching from the API  |
| `--exact`           | Match node name exactly                                       |
| `--starts-with`     | Match nodes whose name starts with the pattern                |
| `--regex`           | Treat the pattern as a regular expression                     |

When no match flag is given, the default mode is **contains**.

## Build

```bash
bun run build    # bundle to dist/ via tsdown
```

## Development

```bash
# Run from source
bun run wf -- -f workflowy.json -o ./out "Academics Root" --exact

# Lint + format
bun run check
```

## Library

The package also exports its internals for programmatic use:

```ts
import { WorkFlowyClient, queryNodes, collectAuxRoots } from 'workflowy-scraper'
```
