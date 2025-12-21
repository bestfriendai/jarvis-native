#!/usr/bin/env python3
"""
Fix broken arrow functions where hitSlop was incorrectly inserted
"""

import re
from pathlib import Path

SRC_DIR = Path("/mnt/d/claude dash/jarvis-native/src")

def fix_file(file_path):
    """Fix broken arrow functions"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Pattern: onPress={() =\n                hitSlop={HIT_SLOP}> ...}
    # Should be: onPress={() => ...}\n                hitSlop={HIT_SLOP}

    pattern = r'(\w+)=\{\(\)\s*=\s*\n\s+hitSlop=\{HIT_SLOP\}>\s*([^}]+)\}'

    def fix_arrow(match):
        prop_name = match.group(1)
        body = match.group(2).strip()
        return f'{prop_name}={{() => {body}}}\n                hitSlop={{HIT_SLOP}}'

    content = re.sub(pattern, fix_arrow, content)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed: {file_path.relative_to(SRC_DIR.parent)}")
        return True

    return False

def main():
    """Process all TypeScript files"""
    print("Fixing broken arrow functions...\n")

    modified = 0
    for tsx_file in SRC_DIR.rglob("*.tsx"):
        if fix_file(tsx_file):
            modified += 1

    print(f"\nFixed: {modified} files")

if __name__ == "__main__":
    main()
