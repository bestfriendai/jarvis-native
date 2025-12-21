#!/usr/bin/env python3
"""
Script to add hitSlop prop to all IconButton components
"""

import os
import re
from pathlib import Path

SRC_DIR = Path("/mnt/d/claude dash/jarvis-native/src")

# Files that already have HIT_SLOP (skip these)
SKIP_FILES = {
    "src/components/ProjectCard.tsx",
    "src/components/ui/SearchBar.tsx",
    "src/screens/main/HabitsScreen.tsx",
    "src/screens/main/TasksScreen.tsx",
    "src/components/BudgetCard.tsx",
    "src/components/BudgetFormModal.tsx",
}

def get_relative_import(file_path):
    """Calculate relative import path for constants/ui"""
    rel_parts = os.path.relpath(SRC_DIR / "constants/ui.ts", file_path.parent)
    # Remove .ts extension and convert to proper import
    rel_parts = rel_parts.replace(".ts", "").replace("\\", "/")
    if not rel_parts.startswith("."):
        rel_parts = "./" + rel_parts
    return rel_parts

def process_file(file_path):
    """Add HIT_SLOP import and hitSlop props to IconButtons"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if no IconButton
    if 'IconButton' not in content or 'react-native-paper' not in content:
        return False

    # Skip if already has HIT_SLOP
    if 'HIT_SLOP' in content:
        print(f"SKIP (has HIT_SLOP): {file_path.relative_to(SRC_DIR.parent)}")
        return False

    modified = False

    # Add import
    import_path = get_relative_import(file_path)
    import_statement = f"import {{ HIT_SLOP }} from '{import_path}';"

    # Find last import line
    lines = content.split('\n')
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            last_import_idx = i

    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, import_statement)
        content = '\n'.join(lines)
        modified = True

    # Add hitSlop to IconButton components that don't have it
    # Match IconButton with any props, check if it doesn't have hitSlop
    pattern = r'(<IconButton[^>]*?)(/?>)'

    def add_hitslop(match):
        tag = match.group(1)
        closing = match.group(2)

        # Skip if already has hitSlop
        if 'hitSlop' in tag:
            return match.group(0)

        # Add hitSlop before closing
        return f"{tag}\n                hitSlop={{HIT_SLOP}}{closing}"

    new_content = re.sub(pattern, add_hitslop, content, flags=re.DOTALL)

    if new_content != content:
        modified = True
        content = new_content

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Modified: {file_path.relative_to(SRC_DIR.parent)}")
        return True

    return False

def main():
    """Process all TypeScript files"""
    print("Adding hitSlop to IconButton components...\n")

    processed = 0
    modified = 0

    for tsx_file in SRC_DIR.rglob("*.tsx"):
        rel_path = str(tsx_file.relative_to(SRC_DIR.parent))
        if rel_path in SKIP_FILES:
            continue

        processed += 1
        if process_file(tsx_file):
            modified += 1

    print(f"\nProcessed: {processed} files")
    print(f"Modified: {modified} files")

if __name__ == "__main__":
    main()
