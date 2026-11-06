# Task runner (replaces a Makefile). Every script runs inside a Docker container.
# Requires: just, docker.

image := "branch-name-generator-tools"
user := `id -u` + ":" + `id -g`
port := "8080"

# Containers run as the current user so generated files are not owned by root.
run := "docker run --rm --user " + user + " -e HOME=/tmp -v \"$PWD\":/app -w /app " + image

default:
    @just --list

# Build the tooling image
image:
    docker build -t {{image}} docker

# Run unit tests
test: image
    {{run}} node --test "tests/*.test.js"

# Syntax-check JS modules and validate static metadata files
check: image
    {{run}} sh -c 'for f in assets/js/*.js; do node --check "$f" || exit 1; done'
    {{run}} node tools/check-site.mjs

# Regenerate favicon set, PWA icons and the Open Graph preview from the SVG sources
icons: image
    {{run}} sh tools/build-icons.sh

# Serve the site at http://localhost:8080
serve: image
    docker run --rm -it -p {{port}}:8080 --user {{user}} -v "$PWD":/app -w /app {{image}} python3 -m http.server 8080

# Everything CI-like
all: test check

# Browser smoke test in the Playwright image (installs the playwright package inside the container only)
e2e:
    docker run --rm --ipc=host --user {{user}} -e HOME=/tmp -v "$PWD":/app:ro -w /tmp mcr.microsoft.com/playwright:v1.64.1-noble \
      sh -c 'npm init -y >/dev/null && npm i --silent playwright@1.64.1 >/dev/null && cp /app/tests/e2e.mjs . && node e2e.mjs'
