# Obsidian GitHub Vault Tracker - User Guide

## Overview

This plugin manages the promotion of design standards from a working vault to a production vault using Git version control and GitHub. It automatically handles file synchronization, creates detailed change reports, and maintains a complete version history on GitHub.

## Architecture

### Dual-Vault System
- **Working Vault**: Your source content where edits are made (Git `working` branch)
- **Production Vault**: Deployment target for approved content (Git `main` branch)
- **GitHub Repository**: Central source of truth maintaining version history

### How It Works
```
Working Vault (local files) ←→ working branch (GitHub)
                                      ↓ (Promotion)
Production Vault (local files) ←→ main branch (GitHub)
```

## Installation

### Prerequisites
1. **Git** installed and accessible from command line
2. **GitHub account** with a repository created
3. **GitHub Personal Access Token** with `repo` permissions
   - Create at: https://github.com/settings/tokens

### Setup Steps

1. **Install Plugin**
   - Copy plugin files to `.obsidian/plugins/obsidian-github-tracker/` in both vaults
   - Enable in Settings → Community Plugins

2. **Configure Settings**
   - Open Settings → GitHub Vault Tracker
   - Set **Working Vault Path**: Full path to your working vault
   - Set **Production Vault Path**: Full path to your production vault
   - Set **GitHub Token**: Your personal access token
   - Set **GitHub Repository Owner**: Your GitHub username/org
   - Set **GitHub Repository Name**: Your repository name

3. **Run Git Setup**
   - Click "Git Setup" button in settings
   - This initializes both vaults with correct Git configuration
   - Creates `working` and `main` branches on GitHub

## Commands

### 1. Promote Changes

**Purpose**: Promote approved changes from working vault to production vault

**Workflow**:
1. Edit files in working vault
2. Run command: `GitHub Vault Tracker: Promote Changes`
3. Review confirmation modal showing:
   - Files to be added (green)
   - Files to be modified (blue)
   - Files to be moved/renamed (yellow)
   - Files to be deleted (red)
4. Click "Confirm" to proceed
5. Plugin automatically:
   - Commits changes in working vault
   - Pushes to GitHub `working` branch
   - Creates Pull Request (for audit trail)
   - Copies files to production vault
   - Commits and force-pushes to GitHub `main` branch
   - Generates change report

**Result**:
- ✅ Production vault updated with working vault files
- ✅ GitHub main branch updated
- ✅ Change report saved to `Update Logs/` folder
- ✅ Version history preserved

### 2. Generate Change Report

**Purpose**: Create a detailed markdown report of differences

**Workflow**:
1. Run command: `GitHub Vault Tracker: Generate Change Report`
2. Report is generated and saved to `Update Logs/` folder

**Report Contents**:
- Timestamp and GitHub repository links
- Folder tree view showing all changes
- Color-coded file status (🟢 added, 🔵 modified, 🟡 moved, 🔴 deleted)
- Detailed diffs for each file
- Old path reference for moved/renamed files
- Folder paths for organization

### 3. Check Git Status (Diagnostic)

**Purpose**: View current Git status of both vaults

**Workflow**:
1. Run command: `GitHub Vault Tracker: Check Git Status (Diagnostic)`
2. View notification showing:
   - Current branch for each vault
   - Number of files in each vault
   - Git status (clean/uncommitted changes)
   - Last commit message

## Change Reports

### Report Structure

```markdown
# Change Report - [Timestamp]

**GitHub Repository:** https://github.com/user/repo
**Branch:** main
**View History:** https://github.com/user/repo/commits/main

## Summary

**Total Changes:** 5 files
- 🟢 2 added
- 🔵 2 modified
- 🟡 0 moved
- 🔴 1 deleted

### Folder Tree

```
├── 📁 **(root)**
│   ├── 🟢 new-file.md
│   └── 🔵 edited-file.md
└── 📁 **Subfolder**
    └── 🔴 deleted-file.md
```

## Changes

> [!abstract]- 🟢 new-file
> **📁 Folder:** (root)
> **📄 Path:** new-file
>
> ```diff
> +++ b/new-file.md
> +This is new content
> ```

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

### Report Features

- **Folder Tree**: Visual hierarchy of all changes
- **Color Coding**: 
  - 🟢 Green = Added files
  - 🔵 Blue = Modified files
  - 🟡 Yellow = Moved/renamed files
  - 🔴 Red = Deleted files
- **Collapsible Sections**: Click to expand/collapse diffs
- **No Wikilinks**: File paths shown as plain text (no .md extension)
- **Folder Context**: Each file shows its folder location

## File Exclusions

The following are automatically excluded from sync and reports:
- `.git/` - Git repository data
- `.obsidian/` - Obsidian configuration
- `Update Logs/` - Change reports (production-only)

## Workflow Best Practices

### Daily Workflow

1. **Edit in Working Vault**
   - Make all changes in working vault
   - No need to manually commit

2. **Review Changes**
   - Run "Generate Change Report" to preview
   - Review the report in `Update Logs/`

3. **Promote When Ready**
   - Run "Promote Changes"
   - Review confirmation modal
   - Confirm to apply changes

4. **Verify in Production**
   - Close and reopen production vault
   - Verify files are updated correctly

### Version History

- Every promotion creates a commit on GitHub main branch
- Commit message: `Force sync from working vault - [timestamp]`
- View history: `https://github.com/user/repo/commits/main`
- Revert if needed using GitHub interface

## Troubleshooting

### Files Don't Appear in Production Vault

**Solution**: Close and reopen the production vault in Obsidian to refresh the file view.

### "No Changes to Promote"

**Cause**: Working vault changes haven't been committed yet.

**Solution**: The plugin auto-commits before comparing. If you still see this, check that files actually differ between vaults.

### Git Setup Fails

**Cause**: Invalid paths or GitHub credentials.

**Solution**:
1. Verify both vault paths exist
2. Click "Validate Vault Paths"
3. Click "Validate GitHub Token"
4. Ensure repository exists on GitHub

### Report Shows Old Deleted Files

**Cause**: GitHub branches are out of sync.

**Solution**: Run another promotion to sync GitHub branches with current vault state.

### Merge Conflicts

**Cause**: Manual changes made to GitHub branches.

**Solution**: The plugin uses force-push to avoid conflicts. Working vault always wins.

## Technical Details

### Git Operations

**Promotion Process**:
1. Working vault: `git add -A` → `git commit` → `git push origin working`
2. Production vault: Copy files → `git add -A` → `git commit` → `git push origin main --force`

**Comparison Process**:
1. Fetch both branches: `git fetch origin main` + `git fetch origin working`
2. Compare: `git diff origin/main origin/working`

### File Sync Logic

- **Copy**: All files from working → production
- **Delete**: Files in production not in working
- **Preserve**: `Update Logs/` folder (production-only)

### GitHub Integration

- **Pull Requests**: Created for audit trail (not merged via GitHub)
- **Force Push**: Used to ensure working vault always wins
- **Version History**: Maintained on main branch

## Advanced Usage

### Manual Git Operations

You can perform manual Git operations in either vault:

```bash
# View commit history
cd /path/to/production/vault
git log --oneline

# View specific commit
git show <commit-hash>

# Revert to previous version
git reset --hard <commit-hash>
git push origin main --force
```

### Custom Workflows

The plugin supports custom workflows:
- Edit in working vault
- Promote to production
- Production users view read-only content
- Full version history on GitHub

## FAQ

**Q: Can I edit files in production vault?**
A: Not recommended. Production vault is overwritten on each promotion. Make all edits in working vault.

**Q: What happens to the Pull Request?**
A: PRs are created for audit trail but remain open. The actual sync happens via force-push.

**Q: Can I have multiple working vaults?**
A: Not currently. The plugin supports one working vault and one production vault.

**Q: How do I revert a promotion?**
A: Use GitHub to revert the commit on main branch, then manually pull in production vault.

**Q: Are images and attachments synced?**
A: Yes, all files are synced including images, PDFs, and other attachments.

## Support

For issues or questions:
1. Check this guide
2. Run "Check Git Status" diagnostic
3. Review GitHub commit history
4. Check Obsidian developer console (Ctrl+Shift+I)

## Version History

- **v1.0.0**: Initial release with promotion, reporting, and Git setup features
