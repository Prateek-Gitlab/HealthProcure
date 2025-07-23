#!/bin/bash

# This script rewrites the Git commit history based on the changelog.md file.
# It uses git filter-branch to change commit messages in bulk.

set -e

CHANGELOG="changelog.md"
MAPFILE=".git_commit_map"
REWRITER_SCRIPT=".git_commit_rewriter.sh"

echo "Step 1: Creating a temporary map of commits from $CHANGELOG..."

# Create a map file from the changelog. The format is: <hash> <new_message>
rm -f "$MAPFILE"

grep -E '^**[0-9a-f]{7}**:s*`.*`$' "$CHANGELOG" | while IFS= read -r line; do
  hash=$(echo "$line" | awk -F'**|**:' '{print $2}')
  message=$(echo "$line" | awk -F'`|`' '{print $2}')
  echo "$hash $message" >> "$MAPFILE"
done

echo "Step 2: Creating a temporary rewriter script..."

# Create the script that will be called by git filter-branch for each commit.
cat > "$REWRITER_SCRIPT" <<'EOF'
#!/bin/bash
MAPFILE="$1"
original_message=$(cat)
hash=$(git rev-parse --short HEAD)
new_message=$(grep "^$hash " "$MAPFILE" | cut -d' ' -f2-)
if [ -n "$new_message" ]; then
    echo "$new_message"
else
    echo "$original_message"
fi
EOF
chmod +x "$REWRITER_SCRIPT"

echo "Step 3: Rewriting commit history. This may take a moment..."

# Determine the range of commits to rewrite.
# We'll start from the oldest commit in the changelog.
oldest_commit_hash=$(tail -n 1 "$MAPFILE" | cut -d' ' -f1)

# Rewrite the history for the specified range of commits.
git filter-branch --force --msg-filter "./$REWRITER_SCRIPT $MAPFILE" -- "$oldest_commit_hash..HEAD"

echo "Step 4: Cleaning up temporary files..."
rm "$MAPFILE"
rm "$REWRITER_SCRIPT"

echo ""
echo "Success! Your local commit history has been updated."
echo ""
echo "Next steps:"
echo "1. Review the new history with: git log --oneline"
echo "2. If you are satisfied, push the changes to your remote repository with: git push --force"
