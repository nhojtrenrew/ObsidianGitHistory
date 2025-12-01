# Obsidian GitHub Vault Tracker - Complete User Guide

## Table of Contents

1. [Overview](#overview)
2. [Quick Start (5 Minutes)](#quick-start-5-minutes)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Daily Usage](#daily-usage)
6. [Change Reports](#change-reports)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Topics](#advanced-topics)
9. [FAQ](#faq)

---

## Overview

### What is This Plugin?

The GitHub Vault Tracker manages the promotion of content from a **working vault** (where edits are made) to a **production vault** (published version) using Git and GitHub for version control.

### Key Features

- 🚀 **One-Click Promotion** - Sync files from working to production
- 📊 **Visual Change Reports** - Color-coded diffs and folder trees
- 🔄 **Automated Git Setup** - Auto-detects and configures Git
- 📝 **Complete History** - All changes tracked on GitHub
- ✅ **Safe Workflow** - Review changes before promoting
- 🎯 **Smart Sync** - Preserves production-only content

### Architecture

```
Working Vault (local) ←→ working branch (GitHub)
                               ↓ Promotion
Production Vault (local) ←→ main branch (GitHub)
```

**How it works:**
1. Edit files in working vault
2. Run "Promote Changes"
3. Plugin syncs to GitHub and production vault
4. Change report generated automatically

---

## Quick Start (5 Minutes)

### Step 1: Install Plugin

Copy these files to both vaults:
```
<vault>/.obsidian/plugins/obsidian-github-tracker/
├── main.js
├── manifest.json
└── styles.css
```

Enable in: **Settings → Community Plugins → GitHub Vault Tracker**

### Step 2: Configure Settings

Open **Settings → GitHub Vault Tracker**:

1. **Vault Paths**
   - Working Vault Path: `C:\Users\...\WorkingVault`
   - Production Vault Path: `C:\Users\...\ProductionVault`

2. **GitHub Settings**
   - Repository Owner: `your-username`
   - Repository Name: `your-repo`
   - Personal Access Token: `ghp_...` (create at https://github.com/settings/tokens)

3. **Git Identity** (optional if Git configured globally)
   - Git User Name: `Your Name`
   - Git User Email: `your@email.com`

### Step 3: Check Requirements

Click **"Check Requirements"** button

The plugin will:
- ✅ Verify Git is installed
- ✅ Check Git configuration
- ✅ Validate vault paths
- ✅ Test GitHub credentials

**If Git is missing:**
- Plugin auto-detects it in common locations
- Or guides you to install it
- Or lets you specify path manually

**If Git not configured:**
- Plugin prompts for name and email
- Automatically configures Git for you

### Step 4: Initialize Git

Click **"Git Setup"** button

This will:
1. Initialize working vault (working branch)
2. Initialize production vault (main branch)
3. Connect both to GitHub
4. Create initial commits
5. Push to GitHub

**Done!** You're ready to promote changes.

### Step 5: First Promotion

1. Make changes in working vault
2. Press `Ctrl/Cmd + P` (Command Palette)
3. Run: **"Promote Changes"**
4. Review changes in modal
5. Click "Confirm"

Changes are now in production vault! 🎉

---

## Installation

### Prerequisites

- **Git** - Will be auto-detected by plugin
- **GitHub Account** - With a repository created
- **GitHub Token** - With `repo` permissions ([create here](https://github.com/settings/tokens))
- **Obsidian** - Version 0.15.0 or higher

### Installation Methods

#### Method 1: Manual Installation

1. **Build the plugin** (if from source):
   ```bash
   npm install
   npm run build
   ```

2. **Copy files** to both vaults:
   ```
   <vault>/.obsidian/plugins/obsidian-github-tracker/
   ├── main.js
   ├── manifest.json
   └── styles.css
   ```

3. **Enable plugin**:
   - Restart Obsidian
   - Settings → Community Plugins
   - Enable "GitHub Vault Tracker"

#### Method 2: From Community Plugins (Future)

1. Settings → Community Plugins
2. Browse → Search "GitHub Vault Tracker"
3. Install → Enable

### Verify Installation

1. Open Command Palette (`Ctrl/Cmd + P`)
2. Type "GitHub"
3. You should see plugin commands listed

---

## Configuration

### Settings Overview

The settings page has 4 sections:

#### 1. 📁 Obsidian Vault File Paths

**Working Vault Path**
- Full path to your working vault
- Example: `C:\Users\YourName\Documents\WorkingVault`
- This is where your team makes edits

**Production Vault Path**
- Full path to your production vault
- Example: `C:\Users\YourName\Documents\ProductionVault`
- This is the published version

**Validate Paths** button
- Verifies both paths exist and are accessible

#### 2. 🔗 GitHub Settings

**Repository Configuration**
- **Repository Owner**: Your GitHub username or organization
- **Repository Name**: Name of your repository

**Authentication**
- **Personal Access Token**: GitHub token with `repo` permissions
  - Create at: https://github.com/settings/tokens
  - Required scopes: `repo` (full control)
  - Stored securely, never displayed

**Validate GitHub** button
- Tests token and repository access

**Git Identity (Optional)**
- **Git User Name**: Your name for commits (e.g., "John Doe")
- **Git User Email**: Your email for commits (e.g., "john@example.com")
- Only needed if Git not configured globally
- Used as fallback values

**Validate Identity** button
- Checks format is valid

#### 3. ⚙️ Advanced Settings

**Git Installation**
- **Custom Git Path**: Specify git.exe location if not in PATH
- **Auto-detect Git** button: Automatically find Git installation

**System Diagnostics**
- **Run Diagnostics** button: Verify all prerequisites

#### 4. 🚀 Setup Wizard

**Initialize Git Repositories** button
- Automated setup for both vaults
- Creates branches and connects to GitHub

### Configuration Workflow

1. **Enter all required settings**
2. **Click "Validate Paths"** - Verify vault locations
3. **Click "Validate GitHub"** - Test GitHub connection
4. **Click "Check Requirements"** - Verify all prerequisites
5. **Click "Run Setup Wizard"** - Initialize Git repositories

---

## Daily Usage

### Commands

All commands available via Command Palette (`Ctrl/Cmd + P`):

#### 1. Promote Changes

**Purpose**: Sync working vault changes to production

**Workflow**:
1. Make edits in working vault
2. Run command: `GitHub Vault Tracker: Promote Changes`
3. Review confirmation modal:
   - 🟢 Files to be added
   - 🔵 Files to be modified
   - 🟡 Files to be moved/renamed
   - 🔴 Files to be deleted
4. Click "Confirm"

**What happens**:
- ✅ Working vault committed and pushed to GitHub
- ✅ Pull request created (audit trail)
- ✅ PR automatically merged
- ✅ Files copied to production vault
- ✅ Production vault committed and pushed
- ✅ Change report generated

**Result**: Production vault updated with all changes

#### 2. Generate Change Report

**Purpose**: Create detailed diff report without promoting

**Workflow**:
1. Run command: `GitHub Vault Tracker: Generate Change Report`
2. Report saved to `Update Logs/` folder

**Report includes**:
- Timestamp and GitHub links
- File count summary
- Folder tree visualization
- Detailed diffs for each file
- Color-coded status indicators

#### 3. Compare Vaults

**Purpose**: Quick comparison without full report

**Workflow**:
1. Run command: `GitHub Vault Tracker: Compare Vaults`
2. View notification with file counts

**Shows**:
- Number of files added
- Number of files modified
- Number of files deleted

#### 4. Check Git Status (Diagnostic)

**Purpose**: View current Git status of both vaults

**Workflow**:
1. Run command: `GitHub Vault Tracker: Check Git Status (Diagnostic)`
2. View detailed notification

**Shows**:
- Current branch for each vault
- Number of files in each vault
- Git status (clean/uncommitted)
- Last commit message

### Typical Workflow

**Daily Editing**:
```
1. Open working vault
2. Make changes to files
3. Save files (Ctrl+S)
4. Continue editing
```

**Weekly Promotion**:
```
1. Run "Generate Change Report" (optional preview)
2. Review report in Update Logs/
3. Run "Promote Changes"
4. Review confirmation modal
5. Click "Confirm"
6. Verify changes in production vault
```

**Monthly Review**:
```
1. Check GitHub commit history
2. Review change reports in Update Logs/
3. Verify production vault is up to date
```

---

## Change Reports

### Report Structure

```markdown
# Change Report - 2024-12-01 14:30:00

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
│   ├── 🟢 new-file
│   └── 🔵 edited-file
└── 📁 **Subfolder**
    └── 🔴 deleted-file
```

## Changes

> [!abstract]- 🟢 new-file
> **📁 Folder:** (root)
> **📄 Path:** new-file
>
> ```diff
> +++ b/new-file.md
> +This is new content
> +Added line 2
> ```

> [!info]- 🔵 edited-file
> **📁 Folder:** (root)
> **📄 Path:** edited-file
>
> ```diff
> @@ -1,3 +1,3 @@
>  Existing line
> -Old content
> +New content
>  Another line
> ```
```

### Report Features

**Color Coding**:
- 🟢 Green = Added files
- 🔵 Blue = Modified files
- 🟡 Yellow = Moved/renamed files
- 🔴 Red = Deleted files

**Folder Tree**:
- Visual hierarchy of all changes
- Shows folder structure
- Color-coded file status

**Collapsible Sections**:
- Click to expand/collapse diffs
- Keeps report organized
- Easy to navigate

**File Details**:
- Folder location
- Full path (without .md extension)
- Old path for moved files
- Complete diff content

### Reading Reports

1. **Summary** - Quick overview of changes
2. **Folder Tree** - Visual structure
3. **Changes** - Detailed diffs

**Tips**:
- Expand only sections you need to review
- Use folder tree to understand organization
- Check moved files for old paths
- Review diffs for content changes

---

## Troubleshooting

### Git Issues

#### "Git is not installed"

**Solutions**:
1. **Auto-detect** (Easiest):
   - Settings → Advanced Settings
   - Click "Auto-detect Git"
   - Plugin searches common locations

2. **Manual path**:
   - Find git.exe on your system
   - Usually: `C:\Program Files\Git\cmd\git.exe`
   - Enter in "Custom Git Path" setting

3. **Install Git**:
   - Download: https://git-scm.com/downloads
   - Run installer with defaults
   - Restart Obsidian
   - Click "Auto-detect Git"

#### "Git not configured"

**Solutions**:
1. **Use plugin settings** (Easiest):
   - Enter name in "Git User Name"
   - Enter email in "Git User Email"
   - Plugin uses these for commits

2. **Let plugin prompt you**:
   - Plugin shows configuration modal
   - Enter details and save

3. **Configure globally** (Optional):
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your@email.com"
   ```

#### "Not a Git repository"

**Solution**:
- Run "Git Setup" from settings
- This initializes both vaults properly

### GitHub Issues

#### "Invalid GitHub token"

**Solutions**:
1. Verify token has `repo` permissions
2. Create new token: https://github.com/settings/tokens
3. Update in plugin settings
4. Click "Validate GitHub"

#### "Repository not found"

**Solutions**:
1. Verify repository exists on GitHub
2. Check owner and name in settings
3. Ensure token has access to repository

#### "Permission denied"

**Solutions**:
1. Verify you have push access to repository
2. Check token permissions
3. Ensure repository is not archived

### File Issues

#### "Files don't appear in production vault"

**Solution**:
- Close and reopen production vault
- Obsidian needs to refresh file view

#### "No changes to promote"

**Causes**:
- No actual differences between vaults
- Files are identical

**Solution**:
- Make changes in working vault
- Run "Compare Vaults" to verify differences

#### "Some files not syncing"

**Check**:
1. Files not in `.gitignore`
2. Files not in excluded folders
3. File permissions are correct

**Excluded by default**:
- `.git/`
- `.obsidian/`
- `Update Logs/`

### Setup Issues

#### "Git Setup fails"

**Solutions**:
1. Run "Check Requirements" first
2. Verify all prerequisites are met
3. Check vault paths are correct
4. Verify GitHub credentials
5. Try again after fixing issues

#### "Requirements check fails"

**Solutions**:
1. Read the detailed status message
2. Fix the specific issue mentioned
3. Click "Retry" or run check again

### Performance Issues

#### "Promotion takes too long"

**Causes**:
- Large number of files
- Large file sizes
- Slow network connection

**Solutions**:
- Be patient (first promotion is slowest)
- Subsequent promotions are faster
- Check network connection

#### "Obsidian freezes during promotion"

**Solution**:
- Wait for operation to complete
- Check developer console for errors (`Ctrl+Shift+I`)
- Report issue if persistent

---

## Advanced Topics

### Manual Git Operations

You can perform manual Git operations in either vault:

```bash
# View commit history
cd /path/to/vault
git log --oneline

# View specific commit
git show <commit-hash>

# View current status
git status

# View diff
git diff
```

### Reverting Changes

**Via GitHub**:
1. Go to repository on GitHub
2. Navigate to commit history
3. Find commit to revert
4. Click "Revert" button
5. Pull changes in production vault

**Via Git**:
```bash
cd /path/to/production/vault
git reset --hard <commit-hash>
git push origin main --force
```

### Custom Workflows

**Multiple Editors**:
- All editors work in working vault
- One person runs promotions
- Production vault is read-only

**Scheduled Promotions**:
- Set regular promotion schedule
- Review changes before promoting
- Generate reports for records

**Audit Trail**:
- All promotions create PRs on GitHub
- PRs remain open for audit
- Complete history preserved

### File Exclusions

**Default Exclusions**:
- `.git/` - Git data
- `.obsidian/` - Obsidian config
- `Update Logs/` - Change reports

**Custom Exclusions**:
- Add to `.gitignore` in vault root
- Patterns follow Git ignore syntax

**Example .gitignore**:
```
.obsidian/workspace.json
.trash/
*.tmp
private/
```

### GitHub Integration

**Pull Requests**:
- Created automatically on promotion
- Remain open for audit trail
- Not manually merged (plugin handles it)

**Commit Messages**:
- Auto-commits: `Auto-commit before promotion - [timestamp]`
- Promotions: `Force sync from working vault - [timestamp]`

**Branch Strategy**:
- `working` branch = working vault
- `main` branch = production vault
- Force-push ensures working always wins

---

## FAQ

### General

**Q: What is this plugin for?**
A: Managing content promotion from a working vault (edits) to a production vault (published) with full version control.

**Q: Do I need to know Git?**
A: No! The plugin handles all Git operations automatically.

**Q: Can I use this with existing vaults?**
A: Yes! The Git Setup will initialize your existing vaults.

### Workflow

**Q: Can I edit files in production vault?**
A: Not recommended. Production vault is overwritten on each promotion. Make all edits in working vault.

**Q: What happens to the Pull Request?**
A: PRs are created for audit trail but automatically merged by the plugin.

**Q: Can I have multiple working vaults?**
A: Not currently. The plugin supports one working vault and one production vault.

**Q: How do I revert a promotion?**
A: Use GitHub to revert the commit on main branch, then manually pull in production vault.

### Files

**Q: Are images and attachments synced?**
A: Yes, all files are synced including images, PDFs, and other attachments.

**Q: What about Obsidian settings?**
A: `.obsidian/` folder is excluded by default. Each vault maintains its own settings.

**Q: Can I exclude specific files?**
A: Yes, add them to `.gitignore` in the vault root.

### Technical

**Q: Does this work on mobile?**
A: No, this plugin requires Node.js child_process which is desktop-only.

**Q: What if I lose my GitHub token?**
A: Create a new token and update it in plugin settings.

**Q: Can I use a different Git service?**
A: Currently only GitHub is supported. GitLab/Bitbucket support may be added in future.

**Q: How is my token stored?**
A: Securely in Obsidian's encrypted data storage. Never logged or displayed.

### Troubleshooting

**Q: Why don't I see changes in production vault?**
A: Close and reopen the vault to refresh Obsidian's file view.

**Q: What if Git Setup fails?**
A: Run "Check Requirements" to diagnose the issue, fix it, then try again.

**Q: How do I check if everything is working?**
A: Run "Check Git Status" command to see detailed status of both vaults.

---

## Support

### Getting Help

1. **Check this guide** - Most issues covered here
2. **Run diagnostics** - "Check Requirements" and "Check Git Status"
3. **Check console** - Developer console (`Ctrl+Shift+I`) for errors
4. **Review GitHub** - Check commit history and PRs

### Reporting Issues

When reporting issues, include:
- Obsidian version
- Plugin version
- Operating system
- Error message (if any)
- Steps to reproduce
- Console output

### Resources

- **ARCHITECTURE.md** - Technical details
- **CHANGELOG.md** - Version history
- **GitHub Repository** - Source code and issues

---

## Appendix

### Keyboard Shortcuts

- `Ctrl/Cmd + P` - Command Palette
- `Ctrl/Cmd + Shift + I` - Developer Console

### File Locations

- **Plugin**: `<vault>/.obsidian/plugins/obsidian-github-tracker/`
- **Settings**: `<vault>/.obsidian/plugins/obsidian-github-tracker/data.json`
- **Reports**: `<production-vault>/Update Logs/`

### Git Commands Used

```bash
# Initialization
git init
git remote add origin <url>
git checkout -b <branch>

# Operations
git add -A
git commit -m "<message>"
git push origin <branch>
git fetch origin <branch>
git diff origin/main origin/working

# Force push (main branch only)
git push origin main --force
```

### GitHub API Endpoints

- Create PR: `POST /repos/{owner}/{repo}/pulls`
- Merge PR: `PUT /repos/{owner}/{repo}/pulls/{number}/merge`
- List PRs: `GET /repos/{owner}/{repo}/pulls`
- Validate token: `GET /user`

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**License**: MIT
