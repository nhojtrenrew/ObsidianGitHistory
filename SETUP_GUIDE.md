# Complete Setup Guide - GitHub Vault Tracker

## Step-by-Step Setup (5 Minutes)

### Step 1: Install the Plugin

1. Copy plugin files to: `<vault>/.obsidian/plugins/obsidian-github-tracker/`
   - `main.js`
   - `manifest.json`
   - `styles.css`

2. Restart Obsidian or reload the vault

3. Enable the plugin:
   - Settings → Community Plugins → Enable "GitHub Vault Tracker"

### Step 2: Configure Vault Paths

Open Settings → GitHub Vault Tracker

**Working Vault Path:**
```
C:\Users\YourName\Documents\Working Vault
```
This is where you edit files.

**Production Vault Path:**
```
C:\Users\YourName\Documents\Production Vault
```
This is where published files go.

### Step 3: Configure Git Identity

**Git User Name:**
```
Your Full Name
```
Example: `John Doe`

**Git User Email:**
```
your@email.com
```
Example: `john.doe@company.com`

💡 **Why?** These are used for Git commit authorship. No need to configure Git separately!

### Step 4: Configure GitHub

**GitHub Token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: `Obsidian Vault Tracker`
4. Select scope: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token and paste it here

**GitHub Repository Owner:**
```
your-github-username
```
Or your organization name if using an org repo.

**GitHub Repository Name:**
```
your-vault-repo
```
The repository name (can be new or existing).

### Step 5: Verify Setup

Click **"Check Requirements"** button

You should see:
- ✅ Git Installation
- ✅ Git Configuration (from plugin settings)
- ✅ Working Vault Path
- ✅ Production Vault Path
- ✅ GitHub Token
- ✅ GitHub Repository

If anything shows ❌:
- **Git Installation:** Click "Auto-detect Git" or install from https://git-scm.com/download/win
- **Git Configuration:** Already done in Step 3!
- **Vault Paths:** Check the paths exist
- **GitHub:** Verify token and repository settings

### Step 6: Initialize Git Repositories

Click **"Git Setup"** button

The plugin will:
1. ✅ Initialize working vault as Git repository (working branch)
2. ✅ Initialize production vault as Git repository (main branch)
3. ✅ Connect both to your GitHub repository
4. ✅ Create initial commits
5. ✅ Push to GitHub

**If authentication is needed:**
- A modal will appear with setup instructions
- Follow the guide to set up Git Credential Manager (recommended)
- Or use a Personal Access Token
- See GIT_AUTHENTICATION_GUIDE.md for details

Wait for "✅ Git setup complete!" message.

### Step 7: Test It Out

1. Make a small change in your working vault (edit a file)
2. Open Command Palette (Ctrl/Cmd + P)
3. Run: **"GitHub Vault Tracker: Generate Change Report"**
4. Check `Update Logs/` folder in production vault for the report

## Settings Reference

### Required Settings

| Setting | Example | Purpose |
|---------|---------|---------|
| Working Vault Path | `C:\Users\...\Working Vault` | Where you edit files |
| Production Vault Path | `C:\Users\...\Production Vault` | Where published files go |
| Git User Name | `John Doe` | Your name for commits |
| Git User Email | `john@example.com` | Your email for commits |
| GitHub Token | `ghp_xxxxxxxxxxxx` | Authentication for GitHub |
| GitHub Repository Owner | `myusername` | Your GitHub username |
| GitHub Repository Name | `my-vault-repo` | Repository name |

### Optional Settings

| Setting | Example | When to Use |
|---------|---------|-------------|
| Custom Git Path | `C:\Program Files\Git\cmd\git.exe` | If Git not in PATH |

## Common Issues

### ❌ Git Installation
**Problem:** "Git is not installed"

**Solution:**
1. Click "Auto-detect Git" button
2. If not found, download from: https://git-scm.com/download/win
3. Install with default options
4. Restart Obsidian
5. Click "Check Requirements" again

### ❌ Git Configuration
**Problem:** "Git user name or email not configured"

**Solution:**
Just enter your name and email in the "Git Identity" section of plugin settings. That's it!

### ❌ GitHub Token
**Problem:** "Invalid GitHub token"

**Solution:**
1. Go to: https://github.com/settings/tokens
2. Generate new token with `repo` scope
3. Copy and paste into plugin settings

### ❌ Git Authentication
**Problem:** "Authentication failed" or browser window opens

**Solution:**
1. Create a GitHub Personal Access Token:
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic) with "repo" scope
   - Copy the token

2. Configure Git to use Windows Credential Manager:
   ```bash
   git config --global credential.helper wincred
   ```

3. Restart Obsidian

4. Try Git Setup again

5. When prompted:
   - Username: Your GitHub username
   - Password: Paste the token

See GIT_AUTHENTICATION_GUIDE.md for detailed instructions and alternatives.

### ❌ Vault Paths
**Problem:** "Path does not exist"

**Solution:**
1. Create the folders if they don't exist
2. Use full absolute paths (not relative)
3. Use forward slashes `/` or double backslashes `\\`

## Quick Commands

Once setup is complete, use these commands:

| Command | What It Does |
|---------|--------------|
| **Promote Changes** | Sync working → production |
| **Generate Change Report** | Create diff report |
| **Check Git Status** | Diagnostic info |
| **Check System Requirements** | Verify all settings |

## Workflow Example

```
1. Edit files in Working Vault
   ↓
2. Run "Promote Changes"
   ↓
3. Review changes in confirmation dialog
   ↓
4. Click "Confirm"
   ↓
5. Plugin creates PR, merges it, updates production
   ↓
6. Change report generated in Update Logs/
   ↓
7. Production Vault now has your changes!
```

## Tips

💡 **First time?** Always run "Check Requirements" before "Git Setup"

💡 **Git not in PATH?** Use "Auto-detect Git" button - it searches common locations

💡 **Multiple Git installations?** Specify the one you want in "Custom Git Path"

💡 **Forgot your GitHub token?** Generate a new one - old tokens can be revoked

💡 **Want to test?** Use "Generate Change Report" to preview changes without promoting

## Support

If you encounter issues:
1. Run "Check System Requirements" to diagnose
2. Check the developer console (Ctrl+Shift+I) for errors
3. Review INSTALLATION.md for detailed troubleshooting
4. Check GIT_USER_SETTINGS_UPDATE.md for Git identity help

## Success Checklist

- [ ] Plugin installed and enabled
- [ ] Vault paths configured
- [ ] Git identity configured (name and email)
- [ ] GitHub token and repository configured
- [ ] "Check Requirements" shows all ✅
- [ ] "Git Setup" completed successfully
- [ ] Test change report generated successfully

Once all items are checked, you're ready to use the plugin! 🎉

---

**Need help?** See QUICK_START.md, INSTALLATION.md, or GIT_USER_SETTINGS_UPDATE.md for more details.
