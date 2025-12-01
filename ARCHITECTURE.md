# Obsidian GitHub Vault Tracker - Architecture

## Overview

The Obsidian GitHub Vault Tracker is a plugin that manages the promotion of content from a working vault to a production vault using Git version control and GitHub as the central source of truth.

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Repository                       │
│                                                              │
│  ┌──────────────────┐              ┌──────────────────┐    │
│  │  working branch  │              │   main branch    │    │
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

## Component Architecture

### Plugin Structure

```
GitHubTrackerPlugin (main.ts)
├── GitService
│   ├── Git command execution
│   ├── File synchronization
│   └── Branch management
├── GitHubService
│   ├── Pull request creation
│   ├── API authentication
│   └── Repository operations
├── ReportGenerator
│   ├── Diff parsing
│   ├── Markdown formatting
│   └── Report saving
└── UI Components
    ├── Settings tab
    ├── Confirmation modal
    └── Command registration
```

### Core Components

#### 1. GitService

**Purpose**: Handles all Git operations

**Key Methods**:
- `executeGitCommand()`: Execute Git commands via child_process
- `diff()`: Compare working and production branches
- `copyAndStage()`: Copy files and stage for commit
- `commit()`: Create commits with timestamps
- `push()`: Push branches to GitHub
- `syncDirectories()`: Sync files between vaults

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

#### 2. GitHubService

**Purpose**: Interfaces with GitHub API

**Key Methods**:
- `validateToken()`: Test GitHub authentication
- `createPullRequest()`: Create PR for audit trail
- `mergePullRequest()`: Merge PR (currently bypassed)
- `listOpenPullRequests()`: List existing PRs
- `closePullRequest()`: Close old PRs

**API Integration**:
- Uses @octokit/rest for GitHub API
- Authenticates with personal access token
- Creates PRs from working → main
- PRs remain open for audit (not merged via API)

#### 3. ReportGenerator

**Purpose**: Creates detailed change reports

**Key Methods**:
- `parseDiff()`: Parse Git diff output into structured data
- `buildFolderTree()`: Create hierarchical folder structure
- `formatFolderTree()`: Format tree with ASCII art
- `formatDiffSection()`: Format individual file diffs
- `generateReport()`: Create complete markdown report
- `saveReport()`: Save to Update Logs folder

**Report Structure**:
```markdown
# Change Report
├── Header (timestamp, GitHub links)
├── Summary (file counts, color indicators)
├── Folder Tree (visual hierarchy)
└── Changes (collapsible diffs per file)
```

#### 4. UI Components

**Settings Tab**:
- Vault path configuration
- GitHub credentials
- Validation buttons
- Git Setup button

**Confirmation Modal**:
- Shows file counts (added/modified/deleted)
- Lists affected files
- Confirm/Cancel buttons

**Commands**:
- Promote Changes
- Generate Change Report
- Check Git Status (Diagnostic)

## Data Flow

### Promotion Workflow

```
1. User edits files in Working Vault
   ↓
2. User runs "Promote Changes"
   ↓
3. Plugin auto-commits working vault changes
   ↓
4. Plugin pushes to GitHub working branch
   ↓
5. Plugin fetches both branches and compares
   ↓
6. Plugin shows confirmation modal
   ↓
7. User confirms
   ↓
8. Plugin creates PR on GitHub (audit trail)
   ↓
9. Plugin copies files: Working → Production
   ↓
10. Plugin commits in production vault
   ↓
11. Plugin force-pushes to GitHub main branch
   ↓
12. Plugin generates change report
   ↓
13. Production vault files updated ✓
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
  1. Copy all files from source to target
  2. Remove files from target not in source
  3. Exclude: .git, .obsidian, Update Logs
  4. Handle nested folders recursively
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

**Permission (403)**:
- Token lacks repo permissions
- Rate limit exceeded

**Not Found (404)**:
- Repository doesn't exist
- Check owner/name in settings

**Validation (422)**:
- Duplicate PR
- Invalid branch
- Show specific error message

### File System Errors

**Path Not Found**:
- Validate paths before operations
- Show clear error message

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

### File Operations

- Stream large files
- Recursive directory traversal
- Efficient diff parsing

### Optimization

- Fetch only when needed
- Cache commit hashes
- Minimal API calls

## Security

### Token Storage

- Stored in Obsidian's data.json
- Never logged or displayed
- Transmitted only over HTTPS

### Git Operations

- No command injection (parameterized)
- Validate all user inputs
- Sanitize file paths

### GitHub API

- All calls over HTTPS
- Token in Authorization header
- Validate SSL certificates

## Extensibility

### Future Enhancements

**Planned Features**:
- Multiple working vaults
- Optional manual PR merge
- Conflict resolution UI
- Rollback functionality
- Custom exclusion patterns

**Plugin Architecture Supports**:
- Additional Git services
- Custom report formats
- Alternative VCS backends
- Webhook integrations

## Dependencies

### External Libraries

- **@octokit/rest**: GitHub API client
- **Obsidian API**: Plugin framework
- **Node.js child_process**: Git command execution

### System Requirements

- **Git**: Must be installed and in PATH
- **Node.js**: Provided by Obsidian
- **GitHub**: Repository and token required

## Testing Strategy

### Manual Testing

- Test promotion workflow end-to-end
- Verify file sync accuracy
- Check report generation
- Validate Git operations

### Error Scenarios

- Invalid credentials
- Network failures
- Merge conflicts
- Missing files

### Edge Cases

- Empty vaults
- Large files
- Special characters in filenames
- Nested folder structures

## Deployment

### Installation

1. Copy plugin files to `.obsidian/plugins/`
2. Enable in Obsidian settings
3. Configure vault paths and GitHub credentials
4. Run Git Setup

### Updates

1. Replace main.js with new version
2. Reload Obsidian
3. Verify settings preserved
4. Test with non-critical files

## Monitoring

### Diagnostic Tools

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

## Conclusion

The plugin architecture is designed for:
- **Simplicity**: One-click promotions
- **Safety**: Confirmation before changes
- **Transparency**: Detailed reports and history
- **Reliability**: Robust error handling
- **Maintainability**: Clear component separation

The dual-vault, dual-branch architecture with force-push strategy ensures working vault content is always the source of truth while maintaining complete version history on GitHub.
