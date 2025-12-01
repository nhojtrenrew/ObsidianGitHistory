# Obsidian GitHub Vault Tracker - Architecture

## Overview

The Obsidian GitHub Vault Tracker is a plugin that manages the promotion of content from a working vault to a production vault using Git version control and GitHub as the central source of truth. It provides automated file synchronization, detailed change reports, and complete version history tracking.

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Repository                       │
│                                                              │
│  ┌──────────────────┐              ┌──────────────────┐    │
│  │  working branch  │──────PR─────>│   main branch    │    │
│  │  (source)        │              │  (deployment)    │    │
│  └──────────────────┘              └──────────────────┘    │
│         ▲                                    ▲               │
└─────────┼────────────────────────────────────┼──────────────┘
          │                                    │
          │ push                               │ force-push
          │                                    │
┌─────────┴──────────┐              ┌─────────┴──────────┐
│  Working Vault     │              │  Production Vault  │
│  (local files)     │─────sync────>│  (local files)     │
│  working branch    │              │  main branch       │
└────────────────────┘              └────────────────────┘
```

### Core Principles

1. **Working Vault is Source of Truth**: All edits happen here
2. **Production Vault is Deployment Target**: Receives promoted content
3. **GitHub Maintains History**: Complete version control
4. **Force-Push Strategy**: Working vault always wins (no merge conflicts)
5. **Dual-Branch Architecture**: Separate branches for working and production
6. **Automated Setup**: Plugin handles Git detection and configuration

## Component Architecture

### Plugin Structure

```
GitHubTrackerPlugin (main.ts)
├── Core Services
│   ├── GitService - Git operations and file sync
│   ├── GitHubService - GitHub API integration
│   └── ReportGenerator - Change report creation
├── UI Components
│   ├── SettingsTab - Configuration interface
│   ├── ConfirmationModal - Change review
│   ├── GitConfigModal - Git identity setup
│   ├── GitRequirementsModal - Prerequisites check
│   └── ChangelogSummaryModal - Promotion summary
└── Commands
    ├── Promote Changes
    ├── Generate Change Report
    ├── Compare Vaults
    └── Check Git Status (Diagnostic)
```

### Core Components

#### 1. GitService

**Purpose**: Handles all Git operations and file synchronization

**Key Methods**:
- `executeGitCommand()` - Execute Git commands via child_process
- `diff()` - Compare working and production branches
- `parseDiffOutput()` - Parse Git diff into structured data
- `copyAndStage()` - Copy files and stage for commit
- `commit()` - Create commits with timestamps
- `push()` - Push branches to GitHub
- `syncDirectories()` - Sync files between vaults
- `checkGitInstalled()` - Verify Git availability
- `checkGitConfigured()` - Check Git identity
- `findGitOnWindows()` - Auto-detect Git installation
- `configureGit()` - Set Git user name and email

**Git Operations**:
```typescript
// Comparison
git fetch origin main
git fetch origin working
git diff origin/main origin/working

// Promotion
git add -A
git commit -m "Auto-commit before promotion - [timestamp]"
git push origin working

// Production Update
git add -A
git commit -m "Force sync from working vault - [timestamp]"
git push origin main --force
```

**File Sync Logic**:
- Copies all files from working → production
- Removes files from production not in working
- Excludes: `.git/`, `.obsidian/`, `Update Logs/`
- Handles nested folders recursively
- Preserves production-only content (Update Logs)

#### 2. GitHubService

**Purpose**: Interfaces with GitHub API

**Key Methods**:
- `validateToken()` - Test GitHub authentication
- `createPullRequest()` - Create PR for audit trail
- `mergePullRequest()` - Merge PR automatically
- `listOpenPullRequests()` - List existing PRs
- `closePullRequest()` - Close old PRs
- `getLatestRelease()` - Fetch latest release info

**API Integration**:
- Uses @octokit/rest for GitHub API
- Authenticates with personal access token
- Creates PRs from working → main
- PRs created for audit trail (not manually merged)
- Handles rate limiting and errors

#### 3. ReportGenerator

**Purpose**: Creates detailed change reports

**Key Methods**:
- `parseDiff()` - Parse Git diff output into structured data
- `buildFolderTree()` - Create hierarchical folder structure
- `formatFolderTree()` - Format tree with ASCII art and colors
- `formatDiffSection()` - Format individual file diffs
- `generateReport()` - Create complete markdown report
- `saveReport()` - Save to Update Logs folder

**Report Structure**:
```markdown
# Change Report - [Timestamp]

**GitHub Repository:** [repo URL]
**Branch:** main
**View History:** [commits URL]

## Summary
**Total Changes:** X files
- 🟢 X added
- 🔵 X modified
- 🟡 X moved
- 🔴 X deleted

### Folder Tree
[ASCII tree with color-coded files]

## Changes
[Collapsible callouts with diffs]
```

**Report Features**:
- Color-coded file status (🟢🔵🟡🔴)
- Folder tree visualization
- Collapsible diff sections
- No wikilinks (plain text paths)
- Moved file tracking with old paths
- Folder context for each file

#### 4. UI Components

**SettingsTab**:
- **Section 1: Obsidian Vault File Paths**
  - Working vault path
  - Production vault path
  - Path validation
- **Section 2: GitHub Settings**
  - Repository configuration (owner, name)
  - Authentication (token)
  - Git identity (optional fallback)
- **Section 3: Advanced Settings**
  - Custom Git path
  - Auto-detect Git
  - System diagnostics
- **Section 4: Setup Wizard**
  - Initialize Git repositories

**GitRequirementsModal**:
- Shows prerequisites checklist
- Indicates status (✅ met, ❌ not met)
- Provides action buttons
- Guides user through setup

**GitConfigModal**:
- Prompts for Git user name and email
- Validates email format (ReDoS-safe regex)
- Saves to plugin settings
- Configures Git automatically

**ConfirmationModal**:
- Shows file counts (added/modified/moved/deleted)
- Lists affected files
- Color-coded status indicators
- Confirm/Cancel buttons

**ChangelogSummaryModal**:
- Displays promotion summary
- Shows PR number and URL
- Confirms successful completion

**Commands**:
- Promote Changes - Full promotion workflow
- Generate Change Report - Create diff report
- Compare Vaults - Quick comparison
- Check Git Status - Diagnostic information

## Data Flow

### Promotion Workflow

```
1. User edits files in Working Vault
   ↓
2. User runs "Promote Changes"
   ↓
3. Plugin checks system requirements
   ↓
4. Plugin auto-commits working vault changes
   ↓
5. Plugin pushes to GitHub working branch
   ↓
6. Plugin fetches both branches and compares
   ↓
7. Plugin shows confirmation modal with file counts
   ↓
8. User confirms
   ↓
9. Plugin creates PR on GitHub (audit trail)
   ↓
10. Plugin merges PR automatically
   ↓
11. Plugin copies files: Working → Production
   ↓
12. Plugin commits in production vault
   ↓
13. Plugin force-pushes to GitHub main branch
   ↓
14. Plugin generates change report
   ↓
15. Plugin saves report to Update Logs/
   ↓
16. Production vault files updated ✓
```

### Setup Workflow (New!)

```
1. User configures settings
   ↓
2. User clicks "Check Requirements"
   ↓
3. Plugin validates:
   - Vault paths exist
   - GitHub credentials set
   - Git installed
   - Git configured
   ↓
4. If Git not found:
   - Auto-detect in common locations
   - Prompt for manual path
   - Guide to installation
   ↓
5. If Git not configured:
   - Show Git identity modal
   - Save name/email to settings
   - Configure Git automatically
   ↓
6. User clicks "Git Setup"
   ↓
7. Plugin initializes:
   - Working vault (working branch)
   - Production vault (main branch)
   - Connects to GitHub
   - Creates initial commits
   ↓
8. Setup complete ✓
```

### Comparison Workflow

```
1. User runs "Generate Change Report"
   ↓
2. Plugin auto-commits working vault changes
   ↓
3. Plugin pushes to GitHub working branch
   ↓
4. Plugin fetches both branches
   ↓
5. Plugin runs: git diff origin/main origin/working
   ↓
6. Plugin parses diff output
   ↓
7. Plugin builds folder tree
   ↓
8. Plugin formats markdown report
   ↓
9. Plugin saves to Update Logs/
   ↓
10. Report ready for review ✓
```

## File Synchronization

### Sync Logic

```typescript
syncDirectories(source, target):
  1. Get all files from source (recursive)
  2. Get all files from target (recursive)
  3. Copy all source files to target
  4. Delete target files not in source
  5. Exclude: .git, .obsidian, Update Logs
  6. Preserve folder structure
```

### Exclusion Rules

**Always Excluded**:
- `.git/` - Git repository data
- `.obsidian/` - Obsidian configuration
- `Update Logs/` - Change reports (production-only)

**In .gitignore**:
- `.obsidian/workspace.json`
- `.obsidian/workspace-mobile.json`
- `.trash/`
- `.DS_Store`
- `Update Logs/`

## Git Strategy

### Branch Architecture

**working branch**:
- Tracks working vault content
- Receives auto-commits before each comparison
- Never force-pushed (preserves history)
- Source for promotions

**main branch**:
- Tracks production vault content
- Receives force-pushes after promotions
- Force-push ensures working vault always wins
- Maintains version history

### Commit Strategy

**Auto-Commits**:
- Created before comparisons
- Message: `Auto-commit before promotion - [timestamp]`
- Ensures current file state is tracked

**Promotion Commits**:
- Created after file sync
- Message: `Force sync from working vault - [timestamp]`
- Represents a promotion event

### Force-Push Rationale

**Why Force-Push?**:
- Avoids merge conflicts
- Working vault is always source of truth
- Simplifies workflow (no manual merging)
- User confirms changes before push

**Safety**:
- Only used on main branch
- User reviews changes in confirmation modal
- Complete history preserved on GitHub
- Can revert via GitHub if needed

## Error Handling

### Git Errors

**Not Installed**:
- Auto-detect in common locations
- Prompt for manual path
- Guide to installation
- Retry mechanism

**Not Configured**:
- Show Git identity modal
- Save to plugin settings
- Configure automatically
- Validate email format

**Not a Git Repository**:
- Check: `git rev-parse --is-inside-work-tree`
- Solution: Run Git Setup

**Push Failures**:
- Try normal push first
- Fallback to `--force-with-lease`
- Notify user of any failures

**Commit Failures**:
- Check for "nothing to commit"
- Ignore if no changes
- Report other errors to user

### GitHub API Errors

**Authentication (401)**:
- Invalid or expired token
- Prompt user to check settings
- Validation button in settings

**Permission (403)**:
- Token lacks repo permissions
- Rate limit exceeded
- Show specific error message

**Not Found (404)**:
- Repository doesn't exist
- Check owner/name in settings
- Validation button available

**Validation (422)**:
- Duplicate PR
- Invalid branch
- Show specific error message

### File System Errors

**Path Not Found**:
- Validate paths before operations
- Show clear error message
- Validation button in settings

**Permission Denied**:
- Check file permissions
- Notify user of access issues

**Disk Space**:
- Catch ENOSPC errors
- Inform user of space issues

## Performance Considerations

### Async Operations

All Git and GitHub operations are async:
- Non-blocking UI
- Progress notifications
- Error handling with try-catch
- Timeout handling

### File Operations

- Stream large files
- Recursive directory traversal
- Efficient diff parsing
- Minimal file system calls

### Optimization

- Fetch only when needed
- Cache commit hashes
- Minimal API calls
- Batch file operations

## Security

### Token Storage

- Stored in Obsidian's data.json
- Never logged or displayed
- Transmitted only over HTTPS
- Password field in settings

### Git Operations

- No command injection (parameterized)
- Validate all user inputs
- Sanitize file paths
- Escape special characters

### GitHub API

- All calls over HTTPS
- Token in Authorization header
- Validate SSL certificates
- Rate limiting respected

### Input Validation

- Email validation (ReDoS-safe regex)
- Path validation
- Token validation
- Repository name validation

## Extensibility

### Future Enhancements

**Planned Features**:
- Multiple working vaults
- Optional manual PR merge
- Conflict resolution UI
- Rollback functionality
- Custom exclusion patterns
- Scheduled promotions
- Webhook integrations

**Plugin Architecture Supports**:
- Additional Git services
- Custom report formats
- Alternative VCS backends
- Plugin API extensions

## Dependencies

### External Libraries

- **@octokit/rest**: GitHub API client (v19.0.0+)
- **Obsidian API**: Plugin framework (v0.15.0+)
- **Node.js child_process**: Git command execution

### System Requirements

- **Git**: Must be installed (auto-detected)
- **Node.js**: Provided by Obsidian
- **GitHub**: Repository and token required
- **Windows/Mac/Linux**: Cross-platform support

## Testing Strategy

### Manual Testing

- Test promotion workflow end-to-end
- Verify file sync accuracy
- Check report generation
- Validate Git operations
- Test auto-detection
- Verify error handling

### Error Scenarios

- Invalid credentials
- Network failures
- Git not installed
- Git not configured
- Missing files
- Permission errors

### Edge Cases

- Empty vaults
- Large files
- Special characters in filenames
- Nested folder structures
- Moved/renamed files
- Deleted folders

## Deployment

### Installation

1. Copy plugin files to `.obsidian/plugins/obsidian-github-tracker/`
2. Enable in Obsidian settings
3. Configure vault paths and GitHub credentials
4. Run "Check Requirements"
5. Run "Git Setup"

### Updates

1. Replace main.js with new version
2. Reload Obsidian
3. Verify settings preserved
4. Test with non-critical files

## Monitoring

### Diagnostic Tools

**Check System Requirements**:
- Git installation status
- Git configuration status
- Vault path validation
- GitHub credentials validation
- Detailed status display

**Check Git Status Command**:
- Shows current branch
- Lists file counts
- Displays last commit
- Checks for uncommitted changes

**Console Logging**:
- Git command output
- API responses
- Error details
- File operations

### User Notifications

- Progress updates during operations
- Success confirmations
- Error messages with context
- File count summaries
- Validation results

## Code Quality

### SonarQube Integration

- Configured suppressions for Obsidian-specific patterns
- ReDoS-safe regex patterns
- No security vulnerabilities
- Clean code standards

### Best Practices

- TypeScript strict mode
- Async/await for all I/O
- Error handling on all operations
- Input validation
- Secure token handling

## Conclusion

The plugin architecture is designed for:
- **Simplicity**: One-click promotions with automated setup
- **Safety**: Confirmation before changes, validation checks
- **Transparency**: Detailed reports and history
- **Reliability**: Robust error handling, auto-detection
- **Maintainability**: Clear component separation, documented code
- **User-Friendly**: Guided setup, helpful error messages

The dual-vault, dual-branch architecture with force-push strategy ensures working vault content is always the source of truth while maintaining complete version history on GitHub. The automated setup and Git detection features make it accessible to users of all technical levels.
