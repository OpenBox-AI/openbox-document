# List available recipes
default:
    @just --list

# Build and serve locally with llms.txt links pointing to localhost
serve-local:
    cd website && URL=http://localhost:3000 npm run build && npm run serve

# Production build
build:
    cd website && npm run build

# Serve the last build
serve:
    cd website && npm run serve

# Build docs and generate reference llms-ctx.txt with llmxctx
build-ctx:
    cd website && URL=http://localhost:3000 npm run build
    mkdir -p reference/llmxctx/output
    lsof -ti:3000 | xargs kill 2>/dev/null; sleep 1
    cd website && npm run serve -- --no-open & sleep 2; cd reference/llmxctx && uv run llms_txt2ctx ../../website/build/llms.txt | grep -v "^{'" > output/llms-ctx.txt; lsof -ti:3000 | xargs kill

# Build docs, generate reference llms-ctx.txt, and diff against plugin output in VS Code
diff-ctx: build-ctx
    code --diff website/build/llms-ctx.txt reference/llmxctx/output/llms-ctx.txt
