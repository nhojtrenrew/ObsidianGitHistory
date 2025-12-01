# Quick Start Guide - GitHub Vault Tracker

## Installation

1. Copy these files to your vault's plugin folder:
   ```
   <vault>/.obsidian/plugins/obsidian-github-tracker/
   ├── main.js
   ├── manifest.json
   └── styles.css
   ```

2. Restart Obsidian or reload the vault

3. Enable the plugin:
   - Settings → Community Plugins → Enable "GitHub Vault Tracker"

## First-Time Setup (5 minutes)

### Step 1: Configure Paths
Open plugin settings and enter:
- **Working Vault Path**: Path to your working/editing vault
- **Production Vault Path**: Path to your production/published vault

### Step 2: Configure GitHub
- **GitHub Token**: Personal access token with repo permissions
  - Create at: https://github.com/settings/tokens
  - Required scopes: `repo`
- **Repository Owner**: Your GitHub username or organization
- **Repository Name**: Name of your vault repository

### Step 3: Check Requirements
Click **"Check Requirements"** button

The plugin will verify:
- ✅ Git is installed and accessible
- ✅ Git is configured with your identity
- ✅ Vault paths exist
- ✅ GitHub credentials are set

**If Git is missing:**
- Plugin will try to auto-detect it
- Or show you how to install it
- Or let you specify the path manually

**If Git is not configured:**
- Plugin will prompt for your name and email
- Automatically configures Git for you

### Step 4: Initialize Git Repositories
Click **"Git Setup"** button

This will:
1. Initialize working vault as Git repository (working branch)
2. Initialize production vault as Git repository (main branch)
3. Connect both to your GitHub repository
4. Create initial commits
5. Push to GitHub

**Done!** Your vaults are now connected and ready to use.

## Daily Usage

### Promote Changes from Working to Production

1. Make changes in your working vault
2. Open Command Palette (Ctrl/Cmd + P)
3. Run: **"Promote Changes"**
4. Review the changes in the confirmation dialog
5. Click "Confirm"

The plugin will:
- Commit changes in working vault
- Push to GitHub working branch
- Create/merge pull request
- Update production vault from GitHub
- Generate a change report

### Generate Change Report

To see what's different between vaults without promoting:

1. Open Command Palette
2. Run: **"Generate Change Report"**

A detailed report will be saved to `Update Logs/` in your production vault.

## Troubleshooting

### "Git is not installed"
1. Click "Auto-detect Git" in settings
2. If not found, download from: https://git-scm.com/download/win
3. Install and restart Obsidian
4. Click "Retry"

### "Working vault is not a Git repository"
1. Go to plugin settings
2. Click "Git Setup"
3. Follow the prompts

### "Author identity unknown"
1. Plugin will automatically prompt you
2. Enter your name and email
3. Click "Save & Continue"

### Check What's Wrong
Run **"Check System Requirements"** from Command Palette to see detailed status of all prerequisites.

## Command Palette Commands

- **Promote Changes** - Promote working vault changes to production
- **Generate Change Report** - Create a diff report without promoting
- **Check Git Status** - Diagnostic info about both vaults
- **Check System Requirements** - Validate all prerequisites

## Settings Reference

### Required Settings
- Working Vault Path
- Production Vault Path
- GitHub Token
- GitHub Repository Owner
- GitHub Repository Name

### Git Identity Settings (Recommended)
- **Git User Name** - Your name for Git commits (e.g., "John Doe")
- **Git User Email** - Your email for Git commits (e.g., "john@example.com")
- These will be used if Git global config is not set
- Saves you from configuring Git separately

### Optional Settings
- **Custom Git Path** - Specify git.exe location if not in PATH

### Utility Buttons
- **Validate Vault Paths** - Check if paths exist
- **Validate GitHub Token** - Test GitHub authentication
- **Auto-detect Git** - Find Git installation automatically
- **Check Requirements** - Validate all prerequisites
- **Git Setup** - Initialize Git repositories

## Tips

1. **First time?** Always run "Check Requirements" before "Git Setup"
2. **Git not in PATH?** Use "Auto-detect Git" button
3. **Multiple Git installations?** Specify the one you want in "Custom Git Path"
4. **Troubleshooting?** Check the developer console (Ctrl+Shift+I) for detailed logs
5. **Change reports** are saved to `Update Logs/` folder in production vault

## Support

If you encounter issues:
1. Run "Check System Requirements" to diagnose
2. Check the developer console for error details
3. Review INSTALLATION.md for detailed troubleshooting
4. Check GIT_AUTO_SETUP_FEATURE.md for technical details

## Workflow Example

```
Working Vault (editing)
    ↓ Make changes
    ↓ Run "Promote Changes"
    ↓ Review & Confirm
    ↓
GitHub (working branch)
    ↓ Pull Request created & merged
    ↓
GitHub (main branch)
    ↓ Production vault pulls changes
    ↓
Production Vault (published)
    ↓ Change report generated
    ↓
Update Logs/change-report-YYYY-MM-DD.md
```

## Next Steps

After setup:
1. Make some test changes in working vault
2. Run "Generate Change Report" to see the diff
3. Run "Promote Changes" to push to production
4. Check the generated report in `Update Logs/`
5. Verify changes appear in production vault

Enjoy seamless vault management! 🚀
