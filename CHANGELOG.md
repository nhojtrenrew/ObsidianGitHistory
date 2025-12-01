# Changelog

All notable changes to the Obsidian GitHub Vault Tracker plugin.

## [1.0.0] - 2024-11-22

### Added
- **Promote Changes Command**: One-click promotion from working to production vault
- **Generate Change Report Command**: Create detailed markdown reports with diffs
- **Check Git Status Command**: Diagnostic tool to view vault status
- **Git Setup**: Automatic initialization of both vaults with correct Git configuration
- **Confirmation Modal**: Review changes before promoting with file counts
- **Folder Tree View**: Visual hierarchy of changes in reports
- **Color-Coded Reports**: Green (added), Blue (modified), Yellow (moved), Red (deleted) indicators
- **Moved File Detection**: Automatically detects and displays renamed/moved files with old path reference
- **Smart File Sync**: Automatically copies files and preserves production-only folders
- **Version History**: Complete commit history maintained on GitHub main branch
- **Auto-Commit**: Automatically commits working vault changes before comparison
- **Force Push**: Ensures working vault always wins, avoiding merge conflicts

### Features

#### Promotion Workflow
- Commits changes in working vault to `working` branch
- Pushes to GitHub for version tracking
- Creates Pull Request for audit trail
- Copies files from working to production vault
- Force-pushes to GitHub `main` branch
- Generates detailed change report
- Updates production vault files immediately

#### Change Reports
- Timestamp and GitHub repository links
- Folder tree showing all changes with icons (🟢 added, 🔵 modified, 🟡 moved, 🔴 deleted)
- Collapsible diff sections for each file
- Folder path context for every file
- Old path display for moved/renamed files
- No file extensions (prevents unwanted wikilinks)
- Saved to `Update Logs/` folder in production vault

#### File Management
- Syncs all files from working to production
- Removes files from production not in working
- Preserves `Update Logs/` folder (production-only)
- Excludes `.git/` and `.obsidian/` folders
- Handles nested folder structures

#### Git Integration
- Dual-branch architecture (working + main)
- Both vaults point to same GitHub repository
- Automatic commit and push operations
- Force-push to avoid merge conflicts
- Fetch before compare for accurate diffs

### Technical Details

#### Architecture
- Working Vault ↔ `working` branch (GitHub)
- Production Vault ↔ `main` branch (GitHub)
- GitHub as central source of truth
- Local file sync with Git version control

#### Commands
1. **Promote Changes**: Full promotion workflow with confirmation
2. **Generate Change Report**: Create report without promoting
3. **Check Git Status**: View diagnostic information

#### Settings
- Working vault path configuration
- Production vault path configuration
- GitHub token (with `repo` permissions)
- GitHub repository owner and name
- Path validation
- Token validation
- Git Setup button

### Known Limitations
- Desktop only (requires Node.js child_process)
- Single working vault and single production vault
- Requires Git installed on system
- Requires GitHub repository

### Dependencies
- Obsidian API (v0.15.0+)
- @octokit/rest (GitHub API client)
- Node.js child_process (for Git commands)
- Git (system requirement)

### File Structure
```
.obsidian/plugins/obsidian-github-tracker/
├── main.js          # Plugin code
├── manifest.json    # Plugin metadata
├── styles.css       # Optional styles
└── versions.json    # Version compatibility
```

### Configuration Files
- `.gitignore`: Auto-created in both vaults
  - Excludes `.obsidian/workspace.json`
  - Excludes `.obsidian/workspace-mobile.json`
  - Excludes `.trash/`
  - Excludes `.DS_Store`
  - Excludes `Update Logs/`

### Git Workflow
```
Working Vault:
1. Edit files
2. Auto-commit: "Auto-commit before promotion - [timestamp]"
3. Push to origin/working

Production Vault:
1. Copy files from working
2. Commit: "Force sync from working vault - [timestamp]"
3. Force-push to origin/main
```

### Report Format
```markdown
# Change Report - [Timestamp]

**GitHub Repository:** [URL]
**Branch:** main
**View History:** [Commits URL]

## Summary
- Total changes with counts
- Color-coded indicators

### Folder Tree
- Visual hierarchy
- Status icons per file

## Changes
- Collapsible sections per file
- Folder path context
- Full diff content
```

### Security
- GitHub token stored in Obsidian's secure storage
- Token never logged or displayed
- All GitHub API calls over HTTPS
- Force-push limited to main branch

### Performance
- Async operations for all Git commands
- Progress notifications for long operations
- Error handling with user-friendly messages
- Automatic retry with force-with-lease on push failures

## Future Enhancements

Potential features for future versions:
- Multiple working vaults support
- Optional manual PR merge (disable auto-merge)
- Conflict resolution UI
- Rollback functionality
- Merge strategy selection (merge/squash/rebase)
- Scheduled automatic promotions
- Email notifications on promotion
- Custom file exclusion patterns
- Branch protection rules
- Multi-user collaboration features

## Migration Notes

### From Manual Git Workflow
If you were previously managing Git manually:
1. Backup both vaults
2. Run Git Setup to initialize
3. Verify branches are correct
4. Test with a small promotion

### First Time Setup
1. Install plugin in both vaults
2. Configure all settings
3. Run Git Setup
4. Verify files in both vaults
5. Test promotion with non-critical files

## Support

For issues, questions, or feature requests:
- Check USER_GUIDE.md for detailed instructions
- Review TROUBLESHOOTING.md for common issues
- Check GitHub repository for updates
- Use diagnostic command to check status

## Credits

Developed for teams managing design standards and work instructions in Obsidian vaults with version control and approval workflows.

## License

[Your License Here]
