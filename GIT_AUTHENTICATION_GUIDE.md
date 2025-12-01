# Git Authentication Setup Guide

## Overview

Git needs to authenticate with GitHub to push changes. The plugin will detect authentication failures and guide you through the setup process.

## When You'll See This

During Git Setup, when the plugin tries to push to GitHub, you may see:
- A browser window opening for GitHub login
- A modal asking you to set up Git authentication
- An error about authentication failure

This is normal! Git needs permission to push to your GitHub repository.

## Recommended Method: Personal Access Token with Windows Credential Manager

### Why This Method?

This is the most reliable method for Windows and works with all Git versions.

### Setup Steps

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a name: `Obsidian Vault Tracker`
   - Select scope: `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Configure Git to use Windows Credential Manager:**
   ```bash
   git config --global credential.helper wincred
   ```

3. **Restart Obsidian**

4. **Try Git Setup again** in the plugin

5. **When prompted for credentials:**
   - Username: Your GitHub username
   - Password: **Paste the token** (not your GitHub password!)

6. **Credentials will be saved** in Windows Credential Manager for future use

### Benefits
- ✅ Works with all Git versions on Windows
- ✅ Secure - credentials stored in Windows Credential Manager
- ✅ Works with 2FA (Two-Factor Authentication)
- ✅ One-time setup

## Alternative Method 1: Git Credential Manager Core

### When to Use
- If you have Git for Windows 2.29 or newer
- If you prefer browser-based authentication

### Setup Steps

1. **Check if you have Git Credential Manager Core:**
   ```bash
   git credential-manager-core --version
   ```

2. **If installed, configure Git:**
   ```bash
   git config --global credential.helper manager-core
   ```
   
   Or try:
   ```bash
   git config --global credential.helper wincred
   ```

3. **Restart Obsidian**

4. **Try Git Setup again** - a browser window will open

5. **Sign in to GitHub** and authorize

### Benefits
- ✅ Browser-based authentication
- ✅ Automatic token management
- ✅ Works with 2FA

## Alternative Method 2: Plain Text Storage (Not Recommended)

### When to Use
- Only as a last resort if other methods don't work
- For testing purposes

### Setup Steps

1. **Create a Personal Access Token** (same as above)

2. **Configure Git to store credentials in plain text:**
   ```bash
   git config --global credential.helper store
   ```

3. **Try Git Setup again** in the plugin

4. **When prompted for credentials:**
   - Username: Your GitHub username
   - Password: **Paste the token** (not your GitHub password!)

5. **Credentials will be saved** in `~/.git-credentials` for future use

### Security Warning
⚠️ The `store` helper saves credentials in **plain text**. Use Windows Credential Manager (`wincred`) instead for better security.

## Alternative Method 3: SSH Keys

### When to Use
- If you prefer SSH over HTTPS
- If you want passwordless authentication
- If you're comfortable with SSH key management

### Setup Steps

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your@email.com"
   ```
   Press Enter to accept default location and optionally set a passphrase.

2. **Add SSH key to ssh-agent:**
   ```bash
   # Start ssh-agent
   eval "$(ssh-agent -s)"
   
   # Add your key
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Copy your public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

4. **Add to GitHub:**
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key
   - Click "Add SSH key"

5. **Update repository URL to use SSH:**
   
   In both vaults, run:
   ```bash
   cd "path\to\vault"
   git remote set-url origin git@github.com:username/repository.git
   ```

6. **Try Git Setup again** in the plugin

### Full Guide
For detailed SSH setup instructions, see: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

## Troubleshooting

### "Authentication failed" Error

**Cause:** Git can't authenticate with GitHub

**Solution:**
1. Set up one of the authentication methods above
2. Restart Obsidian
3. Try Git Setup again

### Browser Window Opens to localhost:127.0.0.1

**What it means:** Git Credential Manager is trying to authenticate

**What to do:**
1. The browser should redirect to GitHub
2. Sign in to GitHub
3. Authorize the application
4. The window will close automatically
5. Git Setup will continue

**If it doesn't redirect:**
1. Close the browser window
2. Run: `git config --global credential.helper manager`
3. Restart Obsidian
4. Try again

### "could not read Username" or "could not read Password"

**Cause:** Git is trying to prompt for credentials but can't in the plugin environment

**Solution:**
1. Set up Git Credential Manager (recommended)
2. Or configure credential storage with a token
3. Restart Obsidian
4. Try Git Setup again

### Token Authentication Failed

**Possible causes:**
- Token expired
- Token doesn't have `repo` scope
- Wrong token pasted

**Solution:**
1. Generate a new token with `repo` scope
2. Delete old credentials:
   ```bash
   # Windows
   cmdkey /delete:git:https://github.com
   
   # Or delete ~/.git-credentials file
   ```
3. Try Git Setup again with new token

### SSH Authentication Failed

**Possible causes:**
- SSH key not added to GitHub
- SSH agent not running
- Wrong repository URL format

**Solution:**
1. Verify SSH key is added to GitHub
2. Test SSH connection:
   ```bash
   ssh -T git@github.com
   ```
   Should say: "Hi username! You've successfully authenticated..."
3. Verify repository URL uses SSH format:
   ```bash
   git remote -v
   ```
   Should show: `git@github.com:username/repo.git`

## Checking Current Authentication

### Check Credential Helper
```bash
git config --global credential.helper
```

Should show:
- `manager` (Git Credential Manager)
- `store` (Plain text storage)
- `cache` (Temporary cache)
- Or empty (no helper configured)

### Test GitHub Connection
```bash
# For HTTPS
git ls-remote https://github.com/username/repository.git

# For SSH
ssh -T git@github.com
```

## Best Practices

### ✅ Recommended
- Use Git Credential Manager (most secure and convenient)
- Use SSH keys (secure, passwordless)
- Keep tokens secure and rotate them regularly

### ❌ Not Recommended
- Storing passwords in plain text
- Using your GitHub password (use tokens instead)
- Sharing tokens or SSH keys

## Summary

The plugin will detect authentication failures and show you a helpful modal with these options. Choose the method that works best for you:

1. **Git Credential Manager** - Easiest, most secure
2. **Personal Access Token** - Simple, works everywhere
3. **SSH Keys** - Advanced, passwordless

Once set up, authentication is automatic for all future operations!

---

**Related Docs:** SETUP_GUIDE.md, INSTALLATION.md
**Last Updated:** December 1, 2025
