#!/usr/bin/env python3
"""
Fix all broken import statements where HIT_SLOP was inserted incorrectly
"""

import re
from pathlib import Path

SRC_DIR = Path("/mnt/d/claude dash/jarvis-native/src")

def fix_file(file_path):
    """Fix broken import statements"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Pattern: import {\nimport { HIT_SLOP } from ...;\n  actual,\n  imports,\n} from '...';
    # Fix: move HIT_SLOP import after the complete import block

    # Find cases where HIT_SLOP import is in the middle of another import
    pattern = r"(import\s+\{)\s*\nimport\s+\{\s*HIT_SLOP\s*\}\s+from\s+['\"]([^'\"]+)['\"];\s*\n(\s+[^}]+\n\}\s+from\s+['\"][^'\"]+['\"];)"

    def fix_import(match):
        import_start = match.group(1)
        hit_slop_path = match.group(2)
        rest_of_import = match.group(3)
        return f"{import_start}\n{rest_of_import}\nimport {{ HIT_SLOP }} from '{hit_slop_path}';"

    content = re.sub(pattern, fix_import, content)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed: {file_path.relative_to(SRC_DIR.parent)}")
        return True

    return False

def main():
    """Process all TypeScript files"""
    print("Fixing broken import statements...\n")

    modified = 0
    for tsx_file in SRC_DIR.rglob("*.tsx"):
        if fix_file(tsx_file):
            modified += 1

    print(f"\nFixed: {modified} files")

if __name__ == "__main__":
    main()
