#!/usr/bin/env bash
set -euo pipefail

REPO="Solidaires-Etudiant-e-s/Solivote"
MANIFEST="../solivote_ynh/manifest.toml"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=== Solivote Release Script ==="
echo

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "master" ]; then
  echo "Error: must be on master branch (currently on $BRANCH)"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working directory has uncommitted changes"
  exit 1
fi

echo "Fetching latest release from GitHub..."
LATEST_TAG=$(curl -sf "https://api.github.com/repos/$REPO/releases/latest" | jq -r '.tag_name')
echo "Latest release on GitHub: $LATEST_TAG"
echo

read -rp "Enter version for new release (e.g., ${LATEST_TAG#v}): " NEXT_VERSION

if [ -z "$NEXT_VERSION" ]; then
  echo "Error: version cannot be empty"
  exit 1
fi

TAG="v$NEXT_VERSION"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Error: tag $TAG already exists"
  exit 1
fi

echo
echo "Creating tag $TAG..."
git tag -a "$TAG" -m "Release $TAG"

echo "Pushing tag $TAG..."
git push origin "$TAG"

echo
echo "Creating GitHub release..."
if command -v gh &>/dev/null; then
  gh release create "$TAG" --title "Release $TAG" --generate-notes
elif [ -n "${GITHUB_TOKEN:-}" ]; then
  curl -sf -X POST "https://api.github.com/repos/$REPO/releases" \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg tag "$TAG" --arg name "Release $TAG" '{tag_name: $tag, name: $name, generate_release_notes: true}')"
else
  echo "Warning: neither gh CLI nor GITHUB_TOKEN found. Skipping automatic release creation."
  echo "Create it manually at: https://github.com/$REPO/releases/new?tag=$TAG"
fi

echo
echo "Downloading tarball for $TAG..."
TARBALL_URL="https://github.com/$REPO/archive/refs/tags/$TAG.tar.gz"
TARBALL_FILE=$(mktemp)
trap 'rm -f "$TARBALL_FILE"' EXIT
curl -sfL "$TARBALL_URL" -o "$TARBALL_FILE"

if command -v sha256sum &>/dev/null; then
  SHA256=$(sha256sum "$TARBALL_FILE" | cut -d' ' -f1)
elif command -v python3 &>/dev/null; then
  SHA256=$(python3 -c "import hashlib; print(hashlib.sha256(open('$TARBALL_FILE', 'rb').read()).hexdigest())")
else
  echo "Error: no tool available to compute sha256 (sha256sum or python3 required)"
  exit 1
fi
echo "SHA256: $SHA256"

echo
echo "Updating $MANIFEST..."
MANIFEST_PATH="$PROJECT_DIR/$MANIFEST"
sed -i "s/^version = \".*\"/version = \"${NEXT_VERSION}~ynh1\"/" "$MANIFEST_PATH"
sed -i "s|^\( *\)url = \".*\"|\1url = \"$TARBALL_URL\"|" "$MANIFEST_PATH"
sed -i "s/^\( *\)sha256 = \".*\"/\1sha256 = \"$SHA256\"/" "$MANIFEST_PATH"

YNH_DIR="$PROJECT_DIR/../solivote_ynh"

echo "Committing changes in solivote_ynh..."
cd "$YNH_DIR"
git add manifest.toml
git commit -m "Upgrade Solivote to v$NEXT_VERSION"
git push

echo "Done!"
echo "  version: ${NEXT_VERSION}~ynh1"
echo "  url:     $TARBALL_URL"
echo "  sha256:  $SHA256"
