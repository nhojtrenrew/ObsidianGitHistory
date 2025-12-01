# Moved Files Feature Implementation

## Overview

Added support for detecting and displaying moved/renamed files in the Obsidian GitHub Tracker plugin. Git automatically detects when files are renamed or moved, and the plugin now properly categorizes and displays these changes.

## Changes Made

### 1. Data Model Updates

**DiffFile Interface** (`main.ts`)
- Added `'moved'` to the status union type
- Added optional `oldPath` property to store the original file path

```typescript
interface DiffFile {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'moved';
    changes: string;
    oldPath?: string; // For moved files
}
```

**DiffStats Interface** (`main.ts`)
- Added `filesMoved` counter

```typescript
interface DiffStats {
    filesAdded: number;
    filesModified: number;
    filesDeleted: number;
    filesMoved: number;
    totalFiles: number;
}
```

**GitDiffResult Interface** (`main.ts`)
- Added `moved` array to `filesByStatus`

```typescript
filesByStatus: {
    added: string[];
    modified: string[];
    deleted: string[];
    moved: string[];
}
```

### 2. Diff Parsing Logic

**parseDiff Method** (`ReportGenerator` class)
- Detects Git's rename markers (`rename from` / `rename to`)
- Checks similarity index to distinguish pure moves from move+edit
- Extracts old path for moved files
- Categorizes files as:
  - `'moved'` - Pure rename/move (100% similarity)
  - `'modified'` - Move with content changes (<100% similarity)

### 3. Report Formatting

**formatSummary Method**
- Added moved files count to summary: `- 🟡 ${stats.filesMoved} moved`
- Moved files included in folder tree with yellow icon (🟡)

**formatDiffSection Method**
- Added yellow callout type for moved files: `calloutType = 'info'`, `statusIcon = '🟡'`
- Displays old path for moved files: `**📤 Moved from:** ${oldPathWithoutExt}`

**buildFolderTree Method**
- Updated to accept `'moved'` status
- Processes moved files array from `filesByStatus.moved`

**formatFolderTree Method**
- Added yellow icon (🟡) for moved files in tree view

### 4. Documentation Updates

**CHANGELOG.md**
- Added "Moved File Detection" to features list
- Updated color-coded reports description to include yellow (moved)
- Added old path reference to change reports features

**USER_GUIDE.md**
- Updated confirmation modal description to include moved files
- Updated report contents to include moved status
- Added moved files to color coding legend
- Added example of moved file in report format

**README.md**
- Updated visual change reports feature description
- Added moved files example to report format section

**design.md**
- Updated `DiffFile` interface documentation
- Updated `DiffStats` interface documentation
- Added moved files to report structure example

## How It Works

### Git Rename Detection

Git automatically detects file renames/moves using similarity analysis:
- When a file is deleted and a similar file is added, Git marks it as a rename
- Similarity index shows how similar the files are (0-100%)
- 100% similarity = pure move (no content changes)
- <100% similarity = move + edit

### Plugin Detection Logic

```typescript
// Check for rename markers
if (sectionText.includes('rename from') && sectionText.includes('rename to')) {
    // Extract old path
    const renameFromMatch = section.match(/rename from (.+)/);
    if (renameFromMatch) {
        oldPath = renameFromMatch[1].trim();
    }
    
    // Check similarity
    const similarityMatch = section.match(/similarity index (\d+)%/);
    if (similarityMatch && parseInt(similarityMatch[1]) === 100) {
        status = 'moved'; // Pure move
    } else {
        status = 'modified'; // Move + edit
    }
    filePath = pathB;
}
```

## Visual Indicators

### Status Icons
- 🟢 Green = Added files
- 🔵 Blue = Modified files
- 🟡 Yellow = Moved/renamed files
- 🔴 Red = Deleted files

### Report Display

**Summary Section:**
```markdown
**Total Changes:** 5 files
- 🟢 2 added
- 🔵 1 modified
- 🟡 1 moved
- 🔴 1 deleted
```

**Folder Tree:**
```
├── 📁 Subfolder
│   └── 🟡 renamed-file.md
```

**Changes Section:**
```markdown
> [!info]- 🟡 renamed-file
> **📁 Folder:** Subfolder
> **📄 Path:** Subfolder/renamed-file
> **📤 Moved from:** old-folder/old-name
>
> ```diff
> rename from old-folder/old-name.md
> rename to Subfolder/renamed-file.md
> similarity index 100%
> ```
```

## Testing

To test the moved files feature:

1. **Pure Move (100% similarity)**
   ```bash
   cd working-vault
   git mv old-name.md new-name.md
   # Run "Promote Changes" - should show as moved (🟡)
   ```

2. **Move + Edit (<100% similarity)**
   ```bash
   cd working-vault
   git mv old-name.md new-name.md
   echo "new content" >> new-name.md
   # Run "Promote Changes" - should show as modified (🔵)
   ```

3. **Folder Move**
   ```bash
   cd working-vault
   git mv folder1/file.md folder2/file.md
   # Run "Promote Changes" - should show as moved (🟡)
   ```

## Benefits

1. **Clarity**: Users can distinguish between new files and renamed files
2. **Traceability**: Old path is preserved, making it easy to track file history
3. **Accuracy**: Reflects Git's actual detection of renames
4. **Consistency**: Matches Git's behavior and terminology

## Future Enhancements

Potential improvements:
- Show similarity percentage in report
- Link to old path in report (if file still exists in history)
- Batch rename detection summary
- Folder-level move detection

## Build & Deploy

```bash
# Build the plugin
npm run build

# Output: main.js (ready for deployment)
```

No breaking changes - fully backward compatible with existing reports.
