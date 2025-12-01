# Design Document

## Overview

The Obsidian GitHub Tracker plugin is a lightweight orchestration layer that leverages native Git commands to manage the promotion of design standards from a working vault to a production vault. The plugin's primary responsibilities are:

1. Execute Git commands to compare and synchronize vault directories
2. Create GitHub pull requests via the GitHub API
3. Parse Git diff output and format it into styled markdown reports
4. Provide a simple command palette interface for user interactions

The plugin does not implement custom file comparison or version control logic. Instead, it delegates all comparison, diff, and version control operations to Git, focusing solely on user experience enhancements like formatted reports and simplified workflows.

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Obsidian Plugin API                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Plugin Main Class                       │
│  - Register commands                                         │
│  - Initialize settings                                       │
│  - Coordinate components                                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│   Settings   │    │   Git Service    │    │   GitHub     │
│   Manager    │    │                  │    │   Service    │
│              │    │  - Execute Git   │    │              │
│  - Vault     │    │    commands      │    │  - Create PR │
│    paths     │    │  - Parse output  │    │  - API calls │
│  - GitHub    │    │                  │    │              │
│    config    │    └──────────────────┘    └──────────────┘
└──────────────┘              │
                              ▼
                    ┌──────────────────┐
                    │  Report          │
                    │  Generator       │
                    │                  │
                    │  - Format diff   │
                    │  - Create .md    │
                    └──────────────────┘
```



## Components and Interfaces

### 1. Plugin Main Class

The entry point for the plugin that extends Obsidian's `Plugin` class.

**Responsibilities:**
- Register command palette commands using `addCommand()`
- Initialize and load settings using `loadData()` and `saveData()`
- Add settings tab using `addSettingTab()`
- Coordinate interactions between services
- Handle plugin lifecycle (load/unload)

**Key Methods:**
- `onload()`: Initialize plugin, register commands, load settings, add settings tab
- `onunload()`: Cleanup resources and event listeners
- `registerCommands()`: Register all command palette entries using Obsidian's command API

**Obsidian API Usage:**
- Extends `Plugin` class from obsidian module
- Uses `this.addCommand()` to register commands
- Uses `this.loadData()` and `this.saveData()` for settings persistence
- Uses `this.addSettingTab()` to register settings panel

### 2. Settings Tab

Manages plugin configuration UI and persists user settings following Obsidian's settings pattern.

**Responsibilities:**
- Provide settings UI using Obsidian's `PluginSettingTab` class
- Store and retrieve vault paths (working and production)
- Store and retrieve GitHub authentication token
- Store and retrieve GitHub repository information
- Validate configuration on save
- Use Obsidian's `Setting` component for each configuration field

**Data Structure:**
```typescript
interface PluginSettings {
  workingVaultPath: string;
  productionVaultPath: string;
  githubToken: string;
  githubRepoOwner: string;
  githubRepoName: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
  workingVaultPath: '',
  productionVaultPath: '',
  githubToken: '',
  githubRepoOwner: '',
  githubRepoName: ''
}
```

**Key Methods:**
- `display()`: Render settings UI using Obsidian's Setting API
- `validatePaths()`: Check that vault paths exist and are accessible
- `validateGitHubToken()`: Test GitHub API authentication

**Obsidian API Usage:**
- Extends `PluginSettingTab` class
- Uses `new Setting(containerEl)` to create setting fields
- Uses `addText()`, `addTextArea()` for input fields
- Settings automatically saved via plugin's `saveData()` method



### 3. Git Service

Executes native Git commands and parses their output. This is the core service that interfaces with Git.

**Responsibilities:**
- Execute Git commands via child process
- Parse Git command output (status, diff, log)
- Handle Git errors and return meaningful messages
- Verify Git installation and repository status

**Key Methods:**
- `checkGitInstalled()`: Verify Git is available on the system
- `isGitRepository(path)`: Check if a directory is a Git repository
- `createBranch(branchName)`: Create a new feature branch
- `stageFiles(files)`: Stage files for commit using `git add`
- `commit(message)`: Create a commit with a message
- `push(branch)`: Push branch to remote repository
- `diff(source, target)`: Get diff between two references
- `status()`: Get current repository status
- `copyAndStage(sourcePath, targetPath)`: Copy files from working to production and stage them

**Git Commands Used:**
- `git --version`: Check Git installation
- `git rev-parse --is-inside-work-tree`: Verify Git repository
- `git checkout -b <branch>`: Create feature branch
- `git add <files>`: Stage changes
- `git commit -m "<message>"`: Create commit
- `git push origin <branch>`: Push to remote
- `git diff <ref1> <ref2>`: Get differences
- `git status --porcelain`: Get file status
- `git diff --stat`: Get diff statistics



### 4. GitHub Service

Interfaces with the GitHub API to create pull requests.

**Responsibilities:**
- Authenticate with GitHub using personal access token
- Create pull requests via REST API
- Return pull request URL and metadata

**Key Methods:**
- `createPullRequest(branch, title, body)`: Create a PR from feature branch to main
- `validateToken()`: Test authentication token validity

**API Endpoints Used:**
- `POST /repos/{owner}/{repo}/pulls`: Create pull request

**Data Structure:**
```typescript
interface PullRequestResponse {
  url: string;
  number: number;
  title: string;
  createdAt: string;
}
```

### 5. Report Generator

Parses Git diff output and generates formatted markdown reports using Obsidian's Vault API.

**Responsibilities:**
- Parse Git diff output into structured data
- Format diff information with markdown syntax
- Create Obsidian wikilinks to vault files
- Generate summary statistics
- Save report to production vault using Obsidian's file API

**Key Methods:**
- `generateReport(diffOutput, prInfo)`: Create formatted markdown report in single file
- `parseDiff(diffOutput)`: Parse Git diff into structured format with file lists
- `formatSummary(stats, filesByStatus)`: Format summary section with counts and file lists
- `formatDiffSection(file, changes)`: Format individual file changes
- `createFileLink(filePath)`: Generate Obsidian wikilink format `[[filename]]`
- `saveReport(content, filename)`: Write single report file using Obsidian Vault API

**Obsidian API Usage:**
- Uses `this.app.vault.create()` to save single report file
- Uses only Obsidian-flavored markdown (wikilinks, callouts, code blocks)
- Uses Obsidian wikilink format `[[filename]]` for internal links to added/modified files
- Plain text for deleted files (no wikilinks since they don't exist)
- Accesses vault path via `this.app.vault.adapter.basePath`

**Report Structure:**
The report uses only Obsidian-flavored markdown (wikilinks, callouts, etc.) and is contained in a single file.

```markdown
# Change Report - [Timestamp]

**Pull Request:** [PR URL]

## Summary

**Files Added:** X
- [[file1.md]]
- [[file2.md]]

**Files Modified:** Y
- [[file3.md]]
- [[file4.md]]

**Files Moved:** M
- [[file7.md]] (from old-path/file7.md)

**Files Deleted:** Z
- file5.md
- file6.md

## Changes

### [[File Name 1]]
```diff
+ Added line
- Removed line
  Context line
```

### [[File Name 2]]
...
```



## Data Models

### Plugin Settings
```typescript
interface PluginSettings {
  workingVaultPath: string;        // Path to working vault directory
  productionVaultPath: string;     // Path to production vault directory
  githubToken: string;             // GitHub personal access token
  githubRepoOwner: string;         // GitHub repository owner
  githubRepoName: string;          // GitHub repository name
}
```

### Git Diff Result
```typescript
interface GitDiffResult {
  files: DiffFile[];
  stats: DiffStats;
}

interface DiffFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'moved';
  changes: string;  // Raw diff output for this file
  oldPath?: string; // For moved files, the original path
}

interface DiffStats {
  filesAdded: number;
  filesModified: number;
  filesDeleted: number;
  filesMoved: number;
  totalFiles: number;
}
```

### Pull Request Info
```typescript
interface PullRequestInfo {
  url: string;
  number: number;
  title: string;
  branch: string;
  createdAt: string;
}
```



## Workflows

### Compare Vaults Workflow

1. User invokes "Compare Vaults" command from command palette
2. Plugin validates that both vault paths are configured
3. Git Service executes `git diff` comparing working vault directory with production vault repository
4. Git Service parses diff output to extract file statistics
5. Plugin displays notification with summary (e.g., "3 files modified, 2 files added, 1 file deleted")

### Promote Changes Workflow

1. User invokes "Promote Changes" command from command palette
2. Plugin validates configuration (vault paths, GitHub token, Git installation)
3. Git Service verifies production vault is a Git repository
4. Git Service executes `git diff` to preview changes
5. Plugin displays modal dialog showing summary of changes (files added/modified/deleted) and prompts user to confirm promotion
6. User confirms or cancels the promotion
7. If confirmed, Git Service creates a new feature branch with timestamp (e.g., `promotion-2024-11-21-143022`)
8. Git Service copies all files from working vault to production vault directory
9. Git Service stages all changes using `git add`
10. Git Service creates commit with message "Promote changes from working vault"
11. Git Service pushes feature branch to GitHub
12. GitHub Service creates pull request from feature branch to main
13. Report Generator retrieves diff using `git diff main...<feature-branch>`
14. Report Generator parses diff and creates formatted markdown report with file lists in summary
15. Report Generator saves single report file to production vault with filename `change-report-[timestamp].md`
16. Plugin displays success notification with PR URL

### Generate Report Workflow

1. User invokes "Generate Change Report" command from command palette
2. Plugin prompts user for branch name or PR number
3. Git Service executes `git diff` for specified branch
4. Report Generator parses diff output
5. Report Generator creates formatted markdown report
6. Report Generator saves report to production vault
7. Plugin displays success notification



## Error Handling

### Git Errors
- **Git not installed**: Display error message with instructions to install Git
- **Not a Git repository**: Display error message instructing user to initialize production vault as Git repo
- **Git command failure**: Parse stderr output and display meaningful error message
- **Merge conflicts**: Detect conflict markers in Git output and notify user with conflict details
- **Network errors during push**: Display error and preserve local changes

### GitHub API Errors
- **Invalid token**: Display authentication error and prompt user to check token in settings
- **API rate limit**: Display error indicating rate limit exceeded with retry time
- **Repository not found**: Display error indicating repository owner/name may be incorrect
- **Permission denied**: Display error indicating token lacks necessary permissions

### File System Errors
- **Invalid vault path**: Display error indicating path does not exist or is not accessible
- **Permission denied**: Display error indicating insufficient permissions to read/write files
- **Disk space**: Display error if insufficient space to copy files

### User Input Errors
- **Missing configuration**: Display error indicating which settings are missing
- **Invalid configuration**: Display error with specific validation failure (e.g., "Working vault path does not exist")



## Testing Strategy

### Unit Testing
- **Settings Manager**: Test settings persistence, validation logic
- **Git Service**: Test Git command construction, output parsing (using mocked Git responses)
- **GitHub Service**: Test API request formatting, response parsing (using mocked API responses)
- **Report Generator**: Test diff parsing, markdown formatting, file link generation

### Integration Testing
- **Git Integration**: Test actual Git command execution with a test repository
- **GitHub Integration**: Test PR creation with a test repository (requires test token)
- **End-to-End Workflow**: Test complete promote workflow with test vaults

### Manual Testing
- **Command Palette**: Verify all commands appear and execute correctly
- **Settings UI**: Verify settings panel displays and saves correctly
- **Notifications**: Verify all user notifications display appropriate messages
- **Report Output**: Verify generated reports are properly formatted and readable

### Edge Cases
- Empty working vault (no changes to promote)
- Large diffs (many files or large files)
- Binary files in vault (should be handled by Git)
- Nested directory structures
- Special characters in filenames
- Concurrent Git operations



## Technology Stack

### Core Technologies
- **TypeScript**: Primary development language for type safety
- **Obsidian Plugin API**: Framework for plugin development
- **Node.js child_process**: For executing Git commands
- **GitHub REST API**: For creating pull requests

### Key Dependencies
- **obsidian**: Obsidian plugin API (provided by Obsidian)
- **@octokit/rest**: GitHub API client library for PR creation
- **child_process**: Node.js module for executing Git commands (available in Obsidian's Node environment)

### Development Tools
- **esbuild**: Build tool for bundling TypeScript (recommended by Obsidian)
- **TypeScript**: Type checking and compilation
- **obsidian-api**: Type definitions for Obsidian API

### Obsidian Plugin Structure
Following Obsidian best practices:
- **manifest.json**: Plugin metadata (id, name, version, minAppVersion)
- **main.ts**: Plugin entry point extending `Plugin` class
- **styles.css**: Optional custom styles for settings panel
- **versions.json**: Version compatibility tracking

## Security Considerations

### Token Storage
- GitHub personal access token stored in Obsidian's data.json (encrypted by Obsidian)
- Token never logged or displayed in plain text
- Token transmitted only over HTTPS to GitHub API

### File System Access
- Plugin only accesses configured vault directories
- No access to files outside specified paths
- Validate all file paths to prevent directory traversal

### Git Command Injection
- Sanitize all user inputs before passing to Git commands
- Use parameterized command execution where possible
- Validate branch names and commit messages

### Network Security
- All GitHub API calls over HTTPS
- Validate SSL certificates
- Handle network errors gracefully without exposing sensitive information



## Obsidian Plugin Best Practices

### Plugin Lifecycle
- Properly implement `onload()` and `onunload()` methods
- Clean up event listeners and intervals in `onunload()`
- Use `this.registerEvent()` for event listeners to ensure automatic cleanup
- Use `this.registerInterval()` for intervals to ensure automatic cleanup

### Settings Management
- Use `this.loadData()` and `this.saveData()` for persistence
- Provide default settings object
- Extend `PluginSettingTab` for settings UI
- Use Obsidian's `Setting` component for consistent UI

### Commands
- Use descriptive command IDs (e.g., `github-tracker:compare-vaults`)
- Provide clear command names for command palette
- Add keyboard shortcuts where appropriate using `hotkeys` property
- Use `checkCallback` for commands that should only be available in certain contexts

### User Confirmation
- Use `Modal` class for confirmation dialogs
- Extend `Modal` to create custom confirmation UI
- Display summary information before destructive operations
- Provide clear "Confirm" and "Cancel" options

### Notifications
- Use `new Notice()` for user feedback
- Keep notification messages concise and actionable
- Use appropriate notification duration (default 5 seconds)

### File Operations
- Use Obsidian's Vault API (`this.app.vault`) instead of Node.js fs module when possible
- Use `TFile` and `TFolder` abstractions
- Handle file operations asynchronously
- Respect user's vault structure and don't modify files without user action

### Error Handling
- Catch and handle all async operations
- Provide meaningful error messages to users via Notice
- Log errors to console for debugging
- Never crash the plugin or Obsidian

### Performance
- Avoid blocking the main thread with long-running operations
- Use async/await for I/O operations
- Debounce frequent operations if needed
- Minimize file system operations

