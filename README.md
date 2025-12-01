# Obsidian GitHub Vault Tracker

An Obsidian plugin for managing the promotion of design standards from a working vault to a production vault using Git version control and GitHub. Automatically syncs files, generates detailed change reports, and maintains complete version history.

## Documentation

- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide (start here!)
- **[USER_GUIDE.md](USER_GUIDE.md)** - Complete setup and usage instructions
- **[INSTALLATION.md](INSTALLATION.md)** - Installation and troubleshooting guide
- **[GIT_AUTO_SETUP_FEATURE.md](GIT_AUTO_SETUP_FEATURE.md)** - Automatic Git detection and setup
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and design details
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes

## Quick Start

1. Install plugin in both vaults
2. Configure settings (vault paths, GitHub token)
3. Click **"Check Requirements"** - plugin will auto-detect Git
4. Click **"Git Setup"** - plugin will configure everything
5. Edit files in working vault
6. Run "Promote Changes" to sync to production

**New to the plugin?** See [QUICK_START.md](QUICK_START.md) for a guided walkthrough.

## Overview

This plugin is designed for teams that maintain design standards and work instructions in Obsidian vaults. It enables a designated user to review changes made by an edit team in a working vault and promote approved changes to a production vault consumed by view-only end users.

### Architecture

The plugin uses a **dual-vault, dual-branch Git architecture**:
- **Working Vault** = Your source content (Git `working` branch)
- **Production Vault** = Deployment target (Git `main` branch)
- **Both vaults** point to the same GitHub repository but different branches
- **Changes flow**: Working branch → Pull Request → Main branch (standard GitHub workflow)

This architecture ensures:
- Working vault content is never overwritten by production
- All changes go through GitHub's pull request review process
- Full Git history and change tracking via GitHub

## Features

### Core Features
- **🚀 One-Click Promotion**: Automatically sync files from working to production vault
- **📊 Visual Change Reports**: Color-coded folder trees (🟢 added, 🔵 modified, 🟡 moved, 🔴 deleted) and detailed diffs
- **🔄 Git Setup**: Automatic initialization of both vaults with correct branches
- **📝 Change Tracking**: Complete version history maintained on GitHub
- **🎯 Smart File Sync**: Preserves production-only folders (Update Logs)
- **✅ Confirmation Modal**: Review changes before promoting
- **🌳 Folder Tree View**: See exactly what's changing where
- **🔍 Diagnostic Tools**: Check Git status of both vaults anytime

### ✨ New: Automatic Git Setup
- **🔎 Auto-Detection**: Finds Git installation even if not in PATH
- **⚙️ Auto-Configuration**: Prompts for Git identity if not configured
- **✔️ Requirements Check**: Validates all prerequisites before setup
- **🛠️ Custom Git Path**: Specify git.exe location manually if needed
- **📋 System Diagnostics**: Detailed status of all requirements
- **🎯 Smart Error Handling**: User-friendly guidance when issues arise
- **🔄 Retry Mechanism**: Easy recovery after fixing issues

## Requirements

- **Git**: Must be installed on your system
  - ✨ **NEW**: Plugin auto-detects Git even if not in PATH
  - ✨ **NEW**: Guides you through installation if missing
  - ✨ **NEW**: Auto-configures Git identity if needed
- **GitHub Account**: With a personal access token that has `repo` permissions
- **GitHub Repository**: An empty or existing repository (plugin will set up branches)
- **Obsidian**: Version 0.15.0 or higher
- **Desktop Only**: This plugin requires Node.js child_process for Git commands

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Navigate to Community Plugins and disable Safe Mode
3. Click Browse and search for "GitHub Vault Tracker"
4. Click Install, then Enable

### Manual Installation

1. Download the latest release from GitHub
2. Extract the files into your vault's `.obsidian/plugins/obsidian-github-tracker/` directory
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### Development

1. Clone this repository into your vault's `.obsidian/plugins/` directory
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start compilation in watch mode
4. Enable the plugin in Obsidian settings

## Configuration

After installing the plugin, configure it in Obsidian Settings → GitHub Vault Tracker:

### Required Settings

1. **Working Vault Path**: Absolute path to your working vault directory (contains your source content)
   - Example: `C:\Users\YourName\Documents\WorkingVault` (Windows)
   - Example: `/Users/yourname/Documents/WorkingVault` (Mac/Linux)
   - This is where your edit team makes changes

2. **Production Vault Path**: Absolute path to your production vault directory (deployment target)
   - Example: `C:\Users\YourName\Documents\ProductionVault` (Windows)
   - Example: `/Users/yourname/Documents/ProductionVault` (Mac/Linux)
   - Can be empty initially - the Git Setup will configure it

3. **GitHub Token**: Personal access token with `repo` permissions
   - Create at: https://github.com/settings/tokens
   - Required scopes: `repo` (full control of private repositories)
   - The token is stored securely in Obsidian's data storage

4. **GitHub Repository Owner**: GitHub username or organization that owns the repository
   - Example: `myusername` or `myorganization`

5. **GitHub Repository Name**: Name of the repository (can be new or existing)
   - Example: `vault-standards`

### ✨ New: Automatic Setup with Requirements Check

The plugin now includes intelligent setup that handles Git detection and configuration:

1. Configure all settings above
2. Click **"Check Requirements"** button
   - Plugin validates all prerequisites
   - Auto-detects Git if not in PATH
   - Shows detailed status of each requirement
3. If Git is missing:
   - Plugin searches common installation locations
   - Offers to use found Git automatically
   - Or guides you to install Git
4. If Git is not configured:
   - Plugin prompts for your name and email
   - Automatically configures Git identity
5. Click **"Git Setup"** button
   - Only proceeds when all requirements are met
   - Shows clear progress at each step

The Git Setup will:
- Initialize working vault as a Git repository on the `working` branch
- Commit and push your working vault content to GitHub
- Initialize production vault as a Git repository on the `main` branch
- Create main branch from working branch (or empty if production has content)
- Push main branch to GitHub

After Git Setup completes, both vaults will be connected to the same repository with proper branch configuration.

**Troubleshooting?** The plugin now provides:
- Auto-detection of Git installations
- Custom Git path setting for non-standard installations
- Interactive modals with step-by-step guidance
- Retry mechanism after fixing issues

### Manual Setup (Alternative)

If you prefer to set up Git manually:

```bash
# In working vault
cd /path/to/working/vault
git init
git checkout -b working
git remote add origin https://github.com/yourusername/your-repo.git
git add -A
git commit -m "Initial working vault content"
git push -u origin working

# In production vault
cd /path/to/production/vault
git init
git remote add origin https://github.com/yourusername/your-repo.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Usage

All commands are accessible via the Command Palette (Ctrl/Cmd + P):

### Compare Vaults

**Command**: `GitHub Vault Tracker: Compare Vaults`

Compares the working vault with the production vault and displays a summary notification showing:
- Number of files added
- Number of files modified
- Number of files deleted

Use this command to preview changes before promoting them.

### Promote Changes

**Command**: `GitHub Vault Tracker: Promote Changes`

Promotes changes from the working vault to the production vault with automatic merge:

1. Analyzes changes between working and production branches
2. Shows a confirmation modal with a summary of changes
3. If confirmed:
   - Commits changes in the working vault to the `working` branch
   - Pushes the `working` branch to GitHub
   - Creates a pull request from `working` to `main`
   - **Automatically merges the pull request**
   - **Pulls the merged changes into the production vault**
   - Generates and saves a change report
4. Displays a success notification confirming the promotion

**Important**: This command automatically merges the PR and updates the production vault files. The confirmation modal allows you to review the changes before they are promoted, ensuring you don't accidentally promote unwanted changes.

**What happens to production vault files:**
- After successful promotion, the production vault will be updated with all changes from the working vault
- Files are updated via Git pull after the PR is merged
- You'll see the changes immediately in your production vault

### Generate Change Report

**Command**: `GitHub Vault Tracker: Generate Change Report`

Generates a detailed markdown change report for an existing feature branch:

1. Prompts for a branch name (or uses the current feature branch)
2. Executes a Git diff for the specified branch
3. Creates a formatted markdown report with:
   - Pull request URL (if available)
   - Summary section with file counts and lists
   - Detailed diff sections for each file
   - Obsidian wikilinks for added/modified files
   - Syntax-highlighted diff blocks
4. Saves the report to the production vault with a timestamped filename

Reports are saved as `change-report-[timestamp].md` in the production vault.

## Change Report Format

Generated reports use Obsidian-flavored markdown with the following structure:

```markdown
# Change Report - [Timestamp]

**Pull Request:** [PR URL]

## Summary

**Files Added:** 2
- [[new-file-1.md]]
- [[new-file-2.md]]

**Files Modified:** 3
- [[existing-file-1.md]]
- [[existing-file-2.md]]
- [[existing-file-3.md]]

**Files Moved:** 1
- [[renamed-file.md]] (from old-folder/old-name.md)

**Files Deleted:** 1
- deleted-file.md

## Changes

### [[new-file-1.md]]
```diff
+ This is a new file
+ With new content
```

### [[existing-file-1.md]]
```diff
  Existing content
- Old line removed
+ New line added
  More existing content
```
```

## Workflow Example

1. Edit team makes changes in the working vault
2. You open Obsidian with the production vault
3. Run "Compare Vaults" to see what changed
4. Run "Promote Changes" to create a pull request
5. Review the generated change report in your production vault
6. Review and merge the pull request on GitHub
7. Pull the changes in your production vault: `git pull origin main`

## Troubleshooting

### ✨ New: Automatic Troubleshooting

Run **"Check System Requirements"** from Command Palette or Settings to get detailed diagnostics.

### "Git is not installed" error

**The plugin now handles this automatically:**
1. Click "Auto-detect Git" in settings - plugin searches common locations
2. Or specify path manually in "Custom Git Path" setting
3. Or install Git from: https://git-scm.com/downloads

The plugin will guide you through the process with helpful modals.

### "Not a Git repository" error

Initialize your production vault as a Git repository:
```bash
cd /path/to/production/vault
git init
git remote add origin https://github.com/yourusername/your-repo.git
```

### "Invalid GitHub token" error

1. Verify your token has `repo` permissions
2. Create a new token at: https://github.com/settings/tokens
3. Update the token in plugin settings

### "Permission denied" errors

Ensure you have:
- Read/write access to both vault directories
- Push access to the GitHub repository
- Proper Git credentials configured

### Changes not appearing

1. Verify both vault paths are correct in settings
2. Ensure the working vault has actual changes
3. Check that files are not in `.gitignore`

## Security Considerations

- GitHub tokens are stored in Obsidian's encrypted data storage
- Tokens are never logged or displayed in plain text
- All GitHub API calls use HTTPS
- File operations are restricted to configured vault paths
- Git commands are sanitized to prevent injection attacks

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Project Structure

- `main.ts`: Plugin entry point and command registration
- `manifest.json`: Plugin metadata
- `versions.json`: Version compatibility tracking
- `esbuild.config.mjs`: Build configuration

## Support

For issues, feature requests, or contributions, please visit:
https://github.com/yourusername/obsidian-github-tracker

## License

MIT

## Credits

Developed for teams managing design standards and work instructions in Obsidian vaults.
