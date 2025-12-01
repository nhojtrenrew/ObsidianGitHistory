# Settings Page Reorganization

## Overview

The plugin settings page has been reorganized into clear, logical sections with improved descriptions and visual hierarchy.

## New Structure

### 1. 📁 Obsidian Vault File Paths
**Purpose:** Configure the working and production vault locations

**Fields:**
- **Working Vault Path** - Where your team makes edits
- **Production Vault Path** - Published version (must be Git repository)
- **Validate Paths** button - Verify both paths exist and are accessible

**Why needed:** Essential for the plugin to know which vaults to track and sync.

---

### 2. 🔗 GitHub Settings
**Purpose:** Configure GitHub integration for PR creation and change tracking

#### Repository Configuration
- **Repository Owner** - GitHub username or organization
- **Repository Name** - Name of the repository (without owner)

**Why needed:** Required to create pull requests and interact with GitHub API.

#### Authentication
- **Personal Access Token** - GitHub token with "repo" permissions
  - Displayed as password field for security
  - Link to token creation page included in description
- **Validate GitHub Connection** button - Test token and repository access

**Why needed:** Required for GitHub API authentication.

#### Git Identity (Optional)
- **Git User Name** - Name for Git commits
- **Git User Email** - Email for Git commits
- **Validate Git Identity** button - Check format is valid

**Why needed:** Used as fallback when Git global config is not set. If user has Git configured globally, these can be left empty.

**Note:** Changed from "Required" to "Optional" with clear explanation that these are fallback values.

---

### 3. ⚙️ Advanced Settings
**Purpose:** Advanced configuration for Git installation and system setup

#### Git Installation
- **Custom Git Path** - Specify custom git.exe location
- **Auto-detect Git** button - Automatically find Git on Windows

**Why needed:** For systems where Git is not in PATH or has non-standard installation.

#### System Diagnostics
- **Check System Requirements** button - Verify all prerequisites

**Why needed:** Helps users troubleshoot setup issues.

---

### 4. 🚀 Setup Wizard
**Purpose:** First-time setup automation

- **Initialize Git Repositories** button - Automated setup for both vaults

**Why needed:** Simplifies initial configuration for new users.

---

## Key Improvements

### Visual Hierarchy
- **H1:** Main title "GitHub Tracker Settings"
- **H2:** Major sections (📁 Vault Paths, 🔗 GitHub, ⚙️ Advanced, 🚀 Setup)
- **H3:** Subsections (Repository Config, Authentication, Git Identity, etc.)
- **Icons:** Emoji icons for quick visual identification

### Better Descriptions
- Each section has a clear purpose statement
- Field descriptions explain what to enter and why
- Helpful hints (e.g., link to GitHub token creation)
- Clarified optional vs required fields

### Improved UX
- Related fields grouped together
- Validation buttons placed logically after their related fields
- CTA buttons highlighted with `.setCta()` for important actions
- Wider input fields for long paths and tokens (300-400px)
- Trimmed input values to prevent whitespace issues

### Field Analysis

| Field | Status | Reason |
|-------|--------|--------|
| Working Vault Path | ✅ Required | Core functionality |
| Production Vault Path | ✅ Required | Core functionality |
| Repository Owner | ✅ Required | GitHub API |
| Repository Name | ✅ Required | GitHub API |
| GitHub Token | ✅ Required | GitHub authentication |
| Git User Name | ⚠️ Optional | Fallback for Git config |
| Git User Email | ⚠️ Optional | Fallback for Git config |
| Custom Git Path | ⚠️ Optional | Only if Git not in PATH |

## User Flow

### First-Time Setup
1. **Vault Paths** → Enter and validate paths
2. **GitHub Settings** → Configure repository and token
3. **Git Identity** → (Optional) Set if no global Git config
4. **Setup Wizard** → Run automated Git repository setup
5. **System Diagnostics** → Verify everything is working

### Existing Users
- Settings are organized logically for easy updates
- Validation buttons help verify configuration
- Clear descriptions explain each setting's purpose

## Technical Changes

### Code Improvements
- Added `.trim()` to all text inputs to prevent whitespace issues
- Improved button styling with `.setCta()` for primary actions
- Better error messages in validation
- Consistent placeholder text format
- Wider input fields for better UX

### Security
- GitHub token field uses `type="password"` for security
- Email validation uses ReDoS-safe regex pattern
- Input sanitization with `.trim()`

## Migration Notes

**No breaking changes** - All existing settings are preserved. The reorganization only affects the UI presentation, not the underlying data structure.

## Future Enhancements

Potential improvements for future versions:
- Collapsible sections for cleaner UI
- Progress indicators for setup wizard
- Inline validation (real-time feedback)
- Import/export settings functionality
- Preset configurations for common setups
