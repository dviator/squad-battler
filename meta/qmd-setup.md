# qmd setup — semantic retrieval for the pipeline

[qmd](https://github.com/tobi/qmd) is the primary context-retrieval layer for the
autonomous pipeline. `scripts/meta-context.sh` wraps it and **falls back to
`grep`/`rg`** when qmd (or its index) isn't available, so the loop never breaks if
qmd is missing — it just returns keyword matches instead of semantic ones.

## One-time local setup

```bash
# Install (see the qmd README for the current method)
# Then register this repo's knowledge corpus as a collection named `squad-meta`:
qmd collection add ./meta     --name squad-meta
qmd collection add ./backlog  --name squad-meta
qmd collection add ./docs     --name squad-meta

# Optional: describe the collection to improve reranking
qmd context add qmd://squad-meta "Squad Battler design docs, backlog tickets/designs, and curated dev feedback"

# Build embeddings (downloads GGUF models on first run, a few hundred MB)
qmd embed
```

After adding new feedback or backlog items, refresh the index:

```bash
qmd embed   # incremental
```

`/capture-feedback` runs this automatically after writing a feedback file.

## Usage

```bash
scripts/meta-context.sh "breeding balance feedback"     # ranked snippets
scripts/meta-context.sh --raw "shop economy"            # file paths only
```

The pipeline skills call this to assemble curated, relevant context for a cold
session instead of loading the whole corpus.

## Caveat: ephemeral cloud sessions

The `squad-meta` index and the GGUF models live in `~/.cache/qmd/`, which is
**not** in the repo and **not** persisted across ephemeral cloud-routine runs.
There, `meta-context.sh` degrades to `grep` automatically — adequate for keyword
recall, just not semantic. The richest recall is therefore on your local machine
where the index persists. If you later want full semantic recall in the cloud
too, add a `qmd collection add … && qmd embed` bootstrap step to the routine
prompt (it pays the model-download cost each fire).
