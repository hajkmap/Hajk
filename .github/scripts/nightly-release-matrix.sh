#!/usr/bin/env bash
# Reads release tags (one per line) on stdin and prints two GitHub Actions outputs for nightly-releases.yml:
#   matrix: one entry per image to build, for the latest patch release of the two latest minor versions
#   keep:   the nightly tags that should exist, comma separated
# Run from the repository root. An image is skipped if its Dockerfile does not exist in the release.
set -euo pipefail

VERSIONS=2

mapfile -t refs < <(
  grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -rV | awk -F. '!seen[$1 "." $2]++' | head -n "$VERSIONS"
)

if [ "${#refs[@]}" -eq 0 ]; then
  echo "::error::Found no published releases to build" >&2
  exit 1
fi

entries=()
keep="nightly-develop"

for ref in "${refs[@]}"; do
  minor="${ref#v}"
  minor="${minor%.*}"
  keep+=",nightly-$minor"
  git fetch --quiet --depth 1 origin "refs/tags/$ref:refs/tags/$ref"

  while IFS='|' read -r image dockerfile title; do
    if git cat-file -e "$ref:$dockerfile" 2>/dev/null; then
      entries+=("$(jq -nc --arg ref "$ref" --arg minor "$minor" --arg image "$image" \
        --arg dockerfile "$dockerfile" --arg title "$title" '$ARGS.named')")
    else
      echo "::notice::$ref has no $dockerfile, so $image:nightly-$minor is not built" >&2
    fi
  done <<'IMAGES'
hajk|Dockerfile|Hajk
hajk-simple|Docker/Dockerfile.simple|Hajk simple (the Client only, served by nginx)
IMAGES
done

echo "matrix=$(printf '%s\n' "${entries[@]}" | jq -sc .)"
echo "keep=$keep"
