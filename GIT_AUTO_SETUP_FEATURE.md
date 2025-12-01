# Git Auto-Setup Feature

## Overview

Enhanced the GitHub Vault Tracker plugin with automatic Git detection, configuration, and user-friendly setup guidance to eliminate manual Git setup issues on new installations.

## Problem Solved

Previously, users encountered errors when:
- Git wasn't installed
- Git wasn't in system PATH
- Git wasn't configured with user identity
- Vaults weren't initialized as Git repositories

This resulted in cryptic error messages and manual troubleshooting.

## New Features

### 1. System Requirements Checker

**Command:** "Check System Requirements" (Command Palette or Settings)

Validates:
- ✅ Git installation and accessibility
- ✅ Git configuration (user.name, user.email)
- ✅ Working vault path exists
- ✅ Production vault path exists
- ✅ GitHub token configured
- ✅ GitHub repository settings

**Visual Feedback:**
- Green checkmarks for passed requirements
- Red X for failed requirements
- Yellow warning for issues that can be auto-fixed
- Detailed messages for each requirement

### 2. Automatic Git Detection

**Windows-specific feature** that searches common Git installation paths:
- `C:\Program Files\Git\cmd\git.exe`
- `C:\Program Files (x86)\Git\cmd\git.exe`
- GitHub Desktop installations
- User-specific installations

**Usage:**
- Automatic: Runs when Git is not found in PATH
- Manual: Click "Detect" button in settings

### 3. Custom Git Path Setting

**New Setting:** "Custom Git Path"

Allows users to manually specify git.exe location if:
- Git is installed in a non-standard location
- Git is not in system PATH
- Multiple Git installations exist

**Example:** `C:\Program Files\Git\cmd\git.exe`

### 4. Git Configuration Assistant

**Interactive Modal** that prompts for:
- User name (for Git commits)
- User email (for Git commits)

**Features:**
- Pre-fills existing configuration if available
- Validates input before saving
- Automatically configures Git globally
- Runs before Git setup if needed

### 5. Enhanced Git Setup Process

**Improved workflow:**

1. **Pre-flight Check**
   - Runs system requirements check
   - Shows detailed status of all prerequisites

2. **Auto-detection**
   - If Git not in PATH, searches for installation
   - Offers to use found Git automatically

3. **Configuration Check**
   - Verifies Git identity is configured
   - Prompts for configuration if missing

4. **Setup Execution**
   - Only proceeds when all requirements met
   - Clear progress notifications at each step

5. **Error Handling**
   - User-friendly error messages
   - Actionable guidance for fixing issues
   - Retry mechanism after fixes

### 6. Helpful Error Modals

**GitSetupModal** - Shows when Git is missing:
- Clear explanation of the issue
- Download link for Git installer
- Step-by-step installation instructions
- Retry button to continue after installation

**GitConfigModal** - Shows when Git needs configuration:
- Input fields for name and email
- Explanation of why it's needed
- Automatic configuration on save

**SystemRequirementsModal** - Shows requirement status:
- Color-coded status indicators
- Detailed messages for each requirement
- Overall pass/fail summary

## Technical Implementation

### Code Changes

1. **Enhanced GitService class:**
   - Added `customGitPath` parameter to constructor
   - Modified `executeGitCommand()` to use custom path
   - Added `findGitOnWindows()` static method
   - Added `checkGitConfigured()` method

2. **New Modal Classes:**
   - `GitSetupModal` - Installation guidance
   - `GitConfigModal` - Identity configuration
   - `SystemRequirementsModal` - Requirements display

3. **New Plugin Methods:**
   - `checkSystemRequirements()` - Validates all prerequisites
   - Enhanced `performGitSetup()` - Checks requirements first

4. **Settings Updates:**
   - Added `customGitPath` to PluginSettings interface
   - Added "Custom Git Path" setting field
   - Added "Auto-detect Git" button
   - Added "Check System Requirements" button

5. **Command Palette:**
   - Added "Check System Requirements" command

### User Experience Flow

```
User clicks "Git Setup"
    ↓
System Requirements Check runs automatically
    ↓
Git not found? → Auto-detect → Found? → Use it
                            → Not found? → Show install modal
    ↓
Git not configured? → Show config modal → Configure
    ↓
All requirements met? → Proceed with setup
                     → Show issues → User fixes → Retry
```

## Benefits

### For Users
- **No manual Git setup required** - Plugin handles detection and configuration
- **Clear guidance** - Step-by-step instructions when issues arise
- **Automatic recovery** - Plugin finds Git even if not in PATH
- **Validation before setup** - Prevents partial/failed setups

### For Support
- **Fewer support requests** - Common issues are auto-resolved
- **Better diagnostics** - Requirements check shows exact issues
- **Consistent setup** - All users follow same validated process

### For New Installations
- **Faster onboarding** - Less manual configuration
- **Fewer errors** - Requirements validated upfront
- **Better first impression** - Professional, polished experience

## Usage Instructions

### For New Users

1. Install the plugin (copy files to `.obsidian/plugins/obsidian-github-tracker/`)
2. Enable the plugin in Obsidian settings
3. Configure vault paths and GitHub settings
4. Click "Check Requirements" to validate setup
5. If Git is missing, plugin will guide you to install it
6. If Git is not configured, plugin will prompt for your identity
7. Click "Git Setup" to initialize repositories

### For Existing Users

- Plugin automatically uses existing Git installation
- No changes needed if Git is already in PATH
- Can optionally specify custom Git path for better performance

### For Troubleshooting

1. Run "Check System Requirements" command
2. Review the status of each requirement
3. Follow the guidance for any failed requirements
4. Click "Retry" after fixing issues

## Platform Support

### Windows (Primary)
- Full auto-detection support
- Searches common installation paths
- Handles GitHub Desktop installations
- Custom path specification

### Mac/Linux
- Uses system Git from PATH
- Custom path specification available
- Manual installation guidance if needed

## Future Enhancements

Potential improvements:
- Mac/Linux auto-detection
- Portable Git bundling option
- Git installation from within plugin
- Automatic Git updates
- Multi-language support for modals

## Testing Checklist

- [x] Git in PATH - works normally
- [x] Git not in PATH but installed - auto-detects
- [x] Git not installed - shows install modal
- [x] Git not configured - prompts for configuration
- [x] Custom Git path - uses specified path
- [x] Requirements check - shows accurate status
- [x] Retry mechanism - works after fixes
- [x] All modals display correctly
- [x] Settings UI updates properly

## Files Modified

- `main.ts` - Core implementation
- `INSTALLATION.md` - Updated documentation
- `GIT_AUTO_SETUP_FEATURE.md` - This document

## Backward Compatibility

- Fully backward compatible
- Existing installations continue to work
- New features are opt-in
- No breaking changes to existing functionality
