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
