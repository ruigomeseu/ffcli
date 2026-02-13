# ffcli — Fireflies.ai in your terminal

Fast, scriptable CLI for querying your [Fireflies.ai](https://fireflies.ai) meeting data. List meetings, view transcripts, read AI summaries, and filter by date or participant — all from the command line. JSON and Markdown output built in.

## Features

- **List meetings** — browse recent meetings with date, duration, and participant info
- **View transcripts** — read full meeting transcripts with speaker names and timestamps
- **AI summaries** — access Fireflies' AI-generated overviews, action items, and key topics
- **Flexible filtering** — filter by date range, participant email, or keyword search
- **Multiple output formats** — JSON (default) for scripting, Markdown (`--md`) for reading

## Installation

### Homebrew

```bash
brew install ruigomeseu/tap/ffcli
```

### npm

```bash
npm install -g ffcli
```

### Download binary

Pre-compiled binaries for macOS (arm64, x64), Linux (arm64, x64), and Windows (x64) are available on the [Releases](https://github.com/ruigomeseu/ffcli/releases) page.

### Build from source

```bash
git clone https://github.com/ruigomeseu/ffcli.git
cd ffcli
bun install
bun run build
```

## Quick Start

### 1. Get your API key

Go to [Fireflies.ai Settings](https://app.fireflies.ai/settings) → **Developer Settings** → **API Key**.

### 2. Authenticate

```bash
ffcli auth <your-api-key>
```

This validates the key against the Fireflies API and stores it in `~/.config/ffcli/config.json`.

Alternatively, simply set the `FIREFLIES_API_KEY` environment variable.

### 3. List your meetings

```bash
ffcli list --limit 5
```

### 4. View a meeting

```bash
ffcli show <meeting-id> --md
```

## Authentication

ffcli uses a Fireflies API key for authentication. The key can be provided in two ways:

1. **Config file** — run `ffcli auth <key>` to store it securely
2. **Environment variable** — set `FIREFLIES_API_KEY`

The environment variable takes precedence over the config file.

```bash
# Store API key
ffcli auth <key>

# Verify stored key works
ffcli auth --check

# Or use env var
export FIREFLIES_API_KEY=your-key-here
```

Config location: `~/.config/ffcli/config.json` (mode `0600`).

## Commands

### `auth` — Store and verify your API key

```bash
ffcli auth <key>          # Validate and store API key
ffcli auth --check        # Verify the stored key works
```

### `me` — Show current user info

```bash
ffcli me                  # JSON output
ffcli me --md             # Markdown output
```

Example output (`--md`):

```
# Jane Doe

**Email:** jane@example.com
**Transcripts:** 142
**Minutes Consumed:** 8540
**Admin:** Yes
```

### `list` — List meetings

```bash
ffcli list                                    # Last 20 meetings (default)
ffcli list --limit 50                         # Last 50 meetings
ffcli list --from 2025-01-01 --to 2025-01-31  # Date range
ffcli list --participant alice@example.com    # Filter by participant
ffcli list --search "standup"                 # Search by title keyword
ffcli list --include-summaries                # Include AI summaries
ffcli list --md                               # Markdown table output
```

Options:

| Flag | Description |
|------|-------------|
| `--limit <n>` | Number of meetings to return (default: 20) |
| `--from <date>` | Start date (YYYY-MM-DD) |
| `--to <date>` | End date (YYYY-MM-DD) |
| `--search <query>` | Filter by title keyword |
| `--participant <email>` | Filter by participant email |
| `--include-summaries` | Include AI summaries in output |
| `--md` | Output as Markdown table |
| `--json` | Output as JSON (default) |

### `show` — Show full meeting detail

```bash
ffcli show <id>                       # Full meeting detail (JSON)
ffcli show <id> --md                  # Full meeting detail (Markdown)
ffcli show <id> --summary-only --md   # Just the AI summary
ffcli show <id> --transcript-only --md # Just the transcript
ffcli show <id> --include-transcript  # Include transcript in output
```

Options:

| Flag | Description |
|------|-------------|
| `--include-transcript` | Include the full transcript |
| `--summary-only` | Show only the AI summary |
| `--transcript-only` | Show only the transcript |
| `--md` | Output as Markdown |
| `--json` | Output as JSON (default) |

## Output Formats

### JSON (default)

Machine-readable output for scripting and piping:

```bash
ffcli list --limit 5 | jq '.[0].title'
```

### Markdown (`--md`)

Human-friendly output for reading in the terminal:

```bash
ffcli list --md
ffcli show <id> --md
```

The `show` command with `--md` produces a full document with YAML frontmatter, metadata, summary sections, and optionally the timestamped transcript.

## Examples

### Find recent meetings with a specific person

```bash
ffcli list --participant alice@example.com --from 2025-01-01 --md
```

### Export a meeting summary

```bash
ffcli show <id> --summary-only --md > meeting-summary.md
```

### Get action items from recent meetings

```bash
ffcli list --limit 10 --include-summaries | jq '.[].summary.action_items'
```

### Search for meetings by keyword

```bash
ffcli list --search "product review" --md
```

### Pipe meeting data to other tools

```bash
# Get all meeting IDs from last week
ffcli list --from 2025-01-06 --to 2025-01-10 | jq -r '.[].id'

# Export all transcripts from a date range
for id in $(ffcli list --from 2025-01-01 --to 2025-01-31 | jq -r '.[].id'); do
  ffcli show "$id" --include-transcript --md > "transcript-${id}.md"
done
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FIREFLIES_API_KEY` | API key (overrides config file) |

## Development

```bash
git clone https://github.com/ruigomeseu/ffcli.git
cd ffcli
bun install

# Run in development
bun run src/index.ts

# Run tests
bun run test

# Type check
bun run typecheck

# Build binary
bun run build
```

## License

MIT

## Links

- [GitHub Repository](https://github.com/ruigomeseu/ffcli)
- [npm Package](https://www.npmjs.com/package/ffcli)
