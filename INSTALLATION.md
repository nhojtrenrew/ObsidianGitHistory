# Manual Installation Guide - GitHub Vault Tracker Plugin

## Quick Installation (Current Machine)

The plugin has been installed to both vaults:
- ✅ Production Vault: `C:\Users\jcwer\Documents\_tWt\7 - AI\DC_TRM_ChangeLog\Production Vault`
- ✅ Working Vault: `C:\Users\jcwer\Documents\_tWt\7 - AI\DC_TRM_ChangeLog\Working Vault`

**Next Steps:**
1. Restart Obsidian (or reload both vaults)
2. Go to Settings → Community Plugins
3. Enable "GitHub Vault Tracker"

---

## Manual Installation on a New Machine

### Prerequisites
- Node.js and npm installed
- Git installed (if cloning from repository)
- Obsidian installed

### Method 1: From Source Code

1. **Get the plugin source code**
   ```bash
   # Clone or copy the plugin project folder to your machine
   cd path/to/plugin/folder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the plugin**
   ```bash
   npm run build
   ```
   This creates the `main.js` file needed by Obsidian.

4. **Copy files to your vault**
   
   For each vault, copy these 3 files:
   - `main.js`
   - `manifest.json`
   - `styles.css`
   
   To this location:
   ```
   <VAULT_PATH>/.obsidian/plugins/obsidian-github-tracker/
   ```
   
   **Windows Example:**
   ```powershell
   # Create plugin directory
   mkdir "C:\Path\To\Your\Vault\.obsidian\plugins\obsidian-github-tracker" -Force
   
   # Copy files
   Copy-Item main.js, manifest.json, styles.css "C:\Path\To\Your\Vault\.obsidian\plugins\obsidian-github-tracker\"
   ```
   
   **Mac/Linux Example:**
   ```bash
   # Create plugin directory
   mkdir -p "/path/to/your/vault/.obsidian/plugins/obsidian-github-tracker"
   
   # Copy files
   cp main.js manifest.json styles.css "/path/to/your/vault/.obsidian/plugins/obsidian-github-tracker/"
   ```

5. **Enable the plugin in Obsidian**
   - Restart Obsidian or reload the vault
   - Go to Settings → Community Plugins
   - Find "GitHub Vault Tracker" and toggle it on

### Method 2: Pre-built Files (No Build Required)

If you have the pre-built files (`main.js`, `manifest.json`, `styles.css`):

1. **Locate your vault's plugin folder**
   ```
   <VAULT_PATH>/.obsidian/plugins/
   ```

2. **Create the plugin directory**
   ```
   <VAULT_PATH>/.obsidian/plugins/obsidian-github-tracker/
   ```

3. **Copy the 3 required files** into this directory:
   - `main.js`
   - `manifest.json`
   - `styles.css`

4. **Enable in Obsidian**
   - Restart Obsidian
   - Settings → Community Plugins → Enable "GitHub Vault Tracker"

---

## First-Time Setup

After installing the plugin, follow these steps:

1. **Open Plugin Settings**
   - Go to Settings → Community Plugins → GitHub Vault Tracker → Settings

2. **Check System Requirements**
   - Click "Check Requirements" button
   - This will verify:
     - Git installation
     - Git configuration (user name/email)
     - Vault paths
     - GitHub credentials

3. **Auto-detect Git (if needed)**
   - If Git is installed but not in PATH, click "Detect" under "Auto-detect Git"
   - The plugin will search common installation locations
   - Or manually specify the path to git.exe in "Custom Git Path"

4. **Configure Git Identity (if needed)**
   - If Git is not configured, the plugin will prompt you to set:
     - Your name (for commit author)
     - Your email (for commit author)

5. **Run Git Setup**
   - Once all requirements are met, click "Git Setup"
   - This initializes both vaults as Git repositories
   - Connects them to your GitHub repository

## Troubleshooting

### Git not found
**Symptom:** Plugin says "Git is not installed"

**Solutions:**
1. **Check if Git is installed:**
   - Open Command Prompt and type: `git --version`
   - If you see a version number, Git is installed but not in PATH

2. **Auto-detect Git:**
   - Go to plugin settings
   - Click "Auto-detect Git" button
   - Plugin will search common locations

3. **Install Git:**
   - Download from: https://git-scm.com/download/win
   - Run installer with default options
   - Restart Obsidian after installation

4. **Manual path specification:**
   - Find git.exe on your system (usually `C:\Program Files\Git\cmd\git.exe`)
   - Enter the full path in "Custom Git Path" setting

### Git not configured
**Symptom:** Plugin says "Git user name or email not configured"

**Solutions:**
1. **Configure in plugin settings (Easiest):**
   - Go to Settings → GitHub Vault Tracker
   - Enter your name in "Git User Name"
   - Enter your email in "Git User Email"
   - Plugin will use these for all commits

2. **Let the plugin prompt you:**
   - The plugin will automatically show a configuration modal
   - Enter your details and they'll be saved to plugin settings

3. **Configure Git globally (Optional):**
   - Run in Command Prompt:
     ```
     git config --global user.name "Your Name"
     git config --global user.email "your@email.com"
     ```

### Working vault not a Git repository
**Symptom:** "Working vault is not a Git repository"

**Solution:**
- Run the "Git Setup" command from plugin settings
- This will initialize both vaults properly

### Plugin doesn't appear in Community Plugins list
- Ensure the folder name is exactly `obsidian-github-tracker`
- Verify all 3 files are present in the plugin folder
- Restart Obsidian completely (not just reload)

### Plugin fails to load
- Check that `main.js` was built successfully (not empty)
- Verify the manifest.json has valid JSON syntax
- Check Obsidian's developer console (Ctrl+Shift+I) for errors

### "This plugin requires a newer version of Obsidian"
- Update Obsidian to version 0.15.0 or higher
- Check the `minAppVersion` in manifest.json

---

## File Structure

After installation, your vault should have:
```
Your Vault/
└── .obsidian/
    └── plugins/
        └── obsidian-github-tracker/
            ├── main.js
            ├── manifest.json
            └── styles.css
```

---

## Updating the Plugin

To update to a new version:
1. Build the new version (`npm run build`)
2. Copy the updated files to the plugin folder (overwrite existing)
3. Reload Obsidian or the vault

---

## Development Mode

For active development:
1. Create a symbolic link from your development folder to the vault's plugin folder
2. Run `npm run dev` to watch for changes
3. Reload the plugin in Obsidian after changes (Ctrl+R or Settings → Community Plugins → Reload)
