# Quick Authentication Setup - Windows

## The Working Method for Windows

### Step 1: Create GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `Obsidian Vault Tracker`
4. Scope: Check `repo`
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)

### Step 2: Configure Git

Open Command Prompt or PowerShell and run:

```bash
git config --global credential.helper wincred
```

This tells Git to use Windows Credential Manager to store your credentials securely.

### Step 3: Use in Plugin

1. Restart Obsidian
2. Run "Git Setup" in the plugin
3. When prompted for credentials:
   - **Username:** Your GitHub username (e.g., `johndoe`)
   - **Password:** Paste the token you copied (NOT your GitHub password!)

### Step 4: Done!

Windows Credential Manager will save your credentials. You won't need to enter them again!

## Verification

Check if it's configured:
```bash
git config --global credential.helper
```

Should show: `wincred`

## Troubleshooting

### "git config is not recognized"
- Git is not in your PATH
- Use the full path: `"C:\Program Files\Git\cmd\git.exe" config --global credential.helper wincred`
- Or add Git to PATH and restart Command Prompt

### "Authentication failed" after setup
- Make sure you used the **token** as password, not your GitHub password
- Make sure the token has `repo` scope
- Generate a new token and try again

### Token expired
- Tokens can expire if you set an expiration date
- Generate a new token
- Delete old credentials:
  ```bash
  cmdkey /delete:git:https://github.com
  ```
- Try Git Setup again with new token

## Why This Works

- `wincred` = Windows Credential Manager
- Built into Windows
- Secure storage
- Works with all Git versions on Windows
- No additional software needed

## Alternative: Check What's Already Configured

```bash
# Check current credential helper
git config --global credential.helper

# Check all Git config
git config --global --list
```

## Quick Test

Test if authentication works:
```bash
git ls-remote https://github.com/yourusername/yourrepo.git
```

If it prompts for credentials, enter:
- Username: Your GitHub username
- Password: Your token

If it lists branches without prompting, authentication is already set up!

---

**This is the recommended method for Windows users.**
**See GIT_AUTHENTICATION_GUIDE.md for other methods.**
