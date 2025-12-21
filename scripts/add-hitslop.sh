#!/bin/bash
# Script to add hitSlop to all IconButton components
# This adds both the import and the hitSlop prop to IconButtons that don't have it

set -e

SRC_DIR="/mnt/d/claude dash/jarvis-native/src"

# Files that already have HIT_SLOP imported (skip these)
SKIP_FILES=(
  "src/components/ProjectCard.tsx"
  "src/components/ui/SearchBar.tsx"
  "src/screens/main/HabitsScreen.tsx"
  "src/screens/main/TasksScreen.tsx"
)

# Find all files with IconButton
FILES=$(find "$SRC_DIR" -name "*.tsx" -type f -exec grep -l "from 'react-native-paper'" {} \; | grep -v node_modules)

echo "Processing files with react-native-paper IconButton..."

for file in $FILES; do
  # Skip if file doesn't contain IconButton
  if ! grep -q "IconButton" "$file"; then
    continue
  fi

  # Skip if already has HIT_SLOP import
  if grep -q "HIT_SLOP" "$file"; then
    echo "SKIP (already has HIT_SLOP): $file"
    continue
  fi

  echo "Processing: $file"

  # Create backup
  cp "$file" "$file.bak"

  # Determine relative path for import
  rel_path=$(python3 -c "import os; print(os.path.relpath('/mnt/d/claude dash/jarvis-native/src/constants/ui', os.path.dirname('$file')))")

  # Check directory depth and create correct relative import
  depth=$(echo "$file" | tr -cd '/' | wc -c)
  src_depth=$(echo "$SRC_DIR" | tr -cd '/' | wc -c)
  rel_depth=$((depth - src_depth - 1))

  if [ $rel_depth -eq 0 ]; then
    import_path="./constants/ui"
  elif [ $rel_depth -eq 1 ]; then
    import_path="../constants/ui"
  elif [ $rel_depth -eq 2 ]; then
    import_path="../../constants/ui"
  elif [ $rel_depth -eq 3 ]; then
    import_path="../../../constants/ui"
  else
    import_path="../../../../constants/ui"
  fi

  # Add import after other imports (after the last import line)
  last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)

  if [ -n "$last_import_line" ]; then
    # Add import
    sed -i "${last_import_line}a\\import { HIT_SLOP } from '$import_path';" "$file"
    echo "  - Added HIT_SLOP import"
  fi
done

echo ""
echo "Import phase complete. Run type-check to verify."
