#!/usr/bin/env python3
"""
Fix import statements that were incorrectly inserted
"""

import os
import re
from pathlib import Path

SRC_DIR = Path("/mnt/d/claude dash/jarvis-native/src")

def fix_file(file_path):
    """Fix incorrectly inserted import statements"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'import { HIT_SLOP }' not in content:
        return False

    lines = content.split('\n')
    new_lines = []
    hit_slop_import = None
    skip_next = False

    for i, line in enumerate(lines):
        # If this line is the HIT_SLOP import that's in the wrong place
        if 'import { HIT_SLOP }' in line and i < len(lines) - 1:
            # Check if it's in the middle of a multi-line import
            if i > 0 and (lines[i-1].strip().startswith('import') or lines[i-1].strip() == '{'):
                # Save it for later
                hit_slop_import = line
                continue

        new_lines.append(line)

    # If we found a misplaced import, add it after all imports
    if hit_slop_import:
        # Find last import line
        last_import_idx = -1
        for i, line in enumerate(new_lines):
            stripped = line.strip()
            if stripped.startswith('import ') or (i > 0 and new_lines[i-1].strip().startswith('import') and stripped.startswith('}')):
                last_import_idx = i

        if last_import_idx >= 0:
            new_lines.insert(last_import_idx + 1, hit_slop_import)

    new_content = '\n'.join(new_lines)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✓ Fixed: {file_path.relative_to(SRC_DIR.parent)}")
        return True

    return False

def main():
    """Process all TypeScript files"""
    print("Fixing import statements...\n")

    modified = 0
    for tsx_file in SRC_DIR.rglob("*.tsx"):
        if fix_file(tsx_file):
            modified += 1

    print(f"\nFixed: {modified} files")

if __name__ == "__main__":
    main()
