# Git Identity Troubleshooting Guide

## The "Author identity unknown" Error

### What It Means

Git needs to know who is making commits. This error appears when Git doesn't have a user name and email configured.

### How the Plugin Handles It

The plugin now has **three layers of protection** to prevent this error:

1. **Plugin Settings** - You can configure identity directly in plugin settings
2. **Git Global Config** - Plugin checks if Git is already configured globally
3. **Local Configuration** - Plugin configures Git locally before each commit

## Step-by-Step Fix

### Option 1: Configure in Plugin Settings (Recommended)

1. **Open Obsidian Settings**
   - Settings → GitHub Vault Tracker

2. **Scroll to "Git Identity" section**

3. **Enter Your Name**
   - Example: `John Doe`
   - Must not be empty
   - Will be trimmed of extra spaces

4. **Enter Your Email**
   - Example: `john.doe@company.com`
   - Must be a valid email format
   - Use the same email as your GitHub account

5. **Click "Validate"**
   - Tests that both fields are filled
   - Checks email format
   - Shows confirmation if valid

6. **Save and Test**
   - Settings save automatically
   - Run "Check System Requirements" to verify
   - Should show ✅ for Git Configuration

### Option 2: Configure Git Globally

If you prefer to configure Git system-wide:

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

The plugin will detect and use this configuration.

### Option 3: Let the Plugin Prompt You

During Git Setup, if identity is not configured, the plugin will:
1. Show a configuration modal
2. Ask for your name and email
3. Save to plugin settings
4. Optionally save to Git global config

## Common Mistakes

### ❌ Empty Fields
**Problem:** Leaving name or email blank

**Solution:** Both fields must be filled. The plugin will show a notice if you try to validate with empty fields.

### ❌ Invalid Email Format
**Problem:** Email doesn't contain @ or domain

**Solution:** Use a proper email format: `name@domain.com`

### ❌ Extra Spaces
**Problem:** Spaces before/after name or email

**Solution:** Plugin automatically trims spaces, but double-check your input.

### ❌ Special Characters in Name
**Problem:** Using quotes or special characters

**Solution:** Use plain text for your name. Example: `John Doe` not `"John Doe"`

## Verification Steps

### 1. Check Plugin Settings
- Open Settings → GitHub Vault Tracker
- Verify "Git User Name" is filled
- Verify "Git User Email" is filled
- Click "Validate" button

### 2. Check System Requirements
- Run "Check System Requirements" command
- Look for "Git Configuration" status
- Should show ✅ with your name and email
- Should indicate source (plugin settings or Git global config)

### 3. Test with Git Setup
- If not already set up, run "Git Setup"
- Plugin will configure Git locally before commits
- Should complete without "Author identity unknown" error

## How It Works Internally

### Before Each Commit

The plugin runs:
```bash
git config --local user.name "Your Name"
git config --local user.email "your@email.com"
git commit -m "message"
```

This ensures:
- ✅ Identity is set for this specific repository
- ✅ Doesn't affect other Git repositories
- ✅ Works even if Git global config is not set
- ✅ Uses plugin settings automatically

### During Git Setup

The plugin:
1. Checks if identity is configured (plugin settings or Git global)
2. If not, prompts user to configure
3. Saves to plugin settings
4. Configures Git locally in both vaults before any commits
5. Proceeds with setup

## Common Error Messages

### "fatal: --local can only be used inside a git repository"

**What it means:** Git tried to configure locally before the repository was initialized.

**Fixed in latest version:** The plugin now ensures Git is initialized before configuring locally.

**If you still see this:**
1. Make sure you're using the latest version of the plugin
2. Restart Obsidian after updating
3. Try Git Setup again

## Still Having Issues?

### Check These:

1. **Settings are saved**
   - Enter name and email
   - Wait for "✅ Git user name saved" notice
   - Wait for "✅ Git user email saved" notice

2. **Restart Obsidian**
   - Close and reopen Obsidian
   - Settings should persist

3. **Check the console**
   - Press Ctrl+Shift+I (Windows) or Cmd+Option+I (Mac)
   - Look for any error messages
   - Share these if asking for help

4. **Verify Git is working**
   - Open Command Prompt in vault folder
   - Run: `git config --local user.name`
   - Should show your name after plugin configures it

### Debug Commands

Run these in Command Prompt to check Git configuration:

```bash
# Check global config
git config --global user.name
git config --global user.email

# Check local config (in vault folder)
cd "path\to\vault"
git config --local user.name
git config --local user.email

# Check all config sources
git config --list
```

## Best Practices

### ✅ Do This:
- Use your real name (as you want it to appear in commits)
- Use your GitHub email (for proper attribution)
- Validate after entering
- Run "Check System Requirements" before Git Setup

### ❌ Don't Do This:
- Leave fields empty
- Use fake or placeholder emails
- Use special characters or quotes
- Skip validation

## Example Configuration

### Good Examples:
```
Name: John Doe
Email: john.doe@company.com

Name: Jane Smith
Email: jane@example.com

Name: Bob Johnson
Email: bob.johnson@gmail.com
```

### Bad Examples:
```
Name: (empty)
Email: notanemail

Name: "John Doe"  ← Don't use quotes
Email: john@  ← Incomplete

Name: John
Email: john  ← Not an email
```

## Success Indicators

You'll know it's working when:
- ✅ "Validate" button shows success message
- ✅ "Check System Requirements" shows ✅ for Git Configuration
- ✅ "Git Setup" completes without errors
- ✅ Commits are created successfully
- ✅ No "Author identity unknown" errors

## Summary

The plugin now makes Git identity configuration **foolproof**:

1. **Easy to configure** - Just two fields in settings
2. **Automatic validation** - Checks format and completeness
3. **Automatic application** - Configures Git before each commit
4. **Multiple fallbacks** - Plugin settings → Git global → Prompt user
5. **Clear feedback** - Shows exactly what's configured and where

You should never see the "Author identity unknown" error again!

---

**Last Updated:** December 1, 2025
**Related Docs:** GIT_USER_SETTINGS_UPDATE.md, SETUP_GUIDE.md
