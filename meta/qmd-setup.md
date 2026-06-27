# qmd setup — semantic retrieval for the pipeline

[qmd](https://github.com/tobi/qmd) is the primary context-retrieval layer for the
autonomous pipeline. It is available both as an **MCP plugin** (in-session, preferred)
and a **CLI tool** (for scripts and cloud runs).

## Collections

Three collections are registered, one per corpus directory:

| Collection | Path | Content |
|---|---|---|
| `meta` | `meta/` | Policies, feedback, STATE, INBOX |
| `backlog` | `backlog/` | Tickets, designs, ideas |
| `docs` | `docs/` | Design framework, system docs |

## Using the MCP plugin (in-session)

When the `plugin:qmd:qmd` MCP server is connected, use the tools directly:

```
mcp__plugin_qmd_qmd__query  — lex/vec/hyde search across collections
mcp__plugin_qmd_qmd__get    — retrieve a full document by path or docid
mcp__plugin_qmd_qmd__status — check collection health
```

Always pass `collections: ["meta","backlog","docs"]` to search across all corpus
directories, or scope to one collection when you know where the content lives.

## Using the CLI (scripts / cloud fallback)

`scripts/meta-context.sh` wraps the CLI and **falls back to `grep`/`rg`** when
qmd or its index isn't available, so the loop never breaks.

```bash
scripts/meta-context.sh "breeding balance feedback"     # ranked snippets
scripts/meta-context.sh --raw "shop economy"            # file paths only
```

Direct CLI:
```bash
qmd query "mutation balance" -c meta -c backlog -c docs
```

## One-time local setup

```bash
# Install qmd (see the qmd README for the current method), then:
qmd collection add ./meta    --name meta
qmd collection add ./backlog --name backlog
qmd collection add ./docs    --name docs

# Build embeddings (downloads GGUF model on first run, ~334MB)
qmd embed
```

After adding new feedback or backlog items, refresh:

```bash
qmd update && qmd embed   # incremental
```

`/capture-feedback` runs this automatically after writing a feedback file.

## Caveat: ephemeral cloud sessions

The index and GGUF models live in `~/.cache/qmd/`, which is **not** persisted
across ephemeral cloud-routine runs. There, `meta-context.sh` degrades to `grep`
automatically — adequate for keyword recall, just not semantic. For full semantic
recall in cloud routines, add a `qmd collection add … && qmd embed` bootstrap step.
