# Requirements Document

## Introduction

This document specifies requirements for an Obsidian plugin that manages the promotion of design standards and work instructions from a working vault to a production vault using Git version control. The plugin compares the two vaults, creates pull requests to promote changes, and generates styled markdown reports summarizing the differences. The plugin serves a designated user who reviews edits made by an edit team and promotes approved changes to a production vault consumed by view-only end users.

## Glossary

- **Plugin**: The Obsidian GitHub Tracker plugin being specified
- **Working Vault**: An Obsidian vault on a shared network drive where the edit team modifies design standards
- **Production Vault**: An Obsidian vault on a shared network drive containing approved design standards for view-only consumption
- **Edit Team**: Users who modify markdown files in the Working Vault without interacting with the Plugin
- **View Only Team**: End users who consume design standards from the Production Vault in read-only mode
- **User**: The designated person with Git installed who operates the Plugin to promote changes from Working Vault to Production Vault
- **Git**: The version control system installed on the User's machine
- **Repository**: A GitHub repository tracking the Production Vault
- **Main Branch**: The primary branch in the Repository representing the current Production Vault state
- **Feature Branch**: A temporary branch created from the Working Vault for proposing changes via Pull Request
- **Pull Request**: A GitHub mechanism for proposing changes from the Working Vault to the Production Vault
- **Diff**: The differences between file versions showing additions, deletions, and modifications
- **Change Report**: A styled markdown document summarizing differences between Working Vault and Production Vault
- **Command Palette**: The Obsidian command interface accessed via keyboard shortcut


## Requirements

### Requirement 1

**User Story:** As the designated user, I want to configure the plugin with paths to both vaults, so that the plugin knows which directories to compare

#### Acceptance Criteria

1. THE Plugin SHALL provide a settings panel accessible from Obsidian settings
2. THE Plugin SHALL allow the User to specify the file path to the Working Vault directory
3. THE Plugin SHALL allow the User to specify the file path to the Production Vault directory
4. THE Plugin SHALL validate that both specified paths exist and are accessible
5. THE Plugin SHALL persist the vault path configurations across Obsidian sessions

### Requirement 2

**User Story:** As the designated user, I want to verify that Git is available and the production vault is a Git repository, so that the plugin can manage version control

#### Acceptance Criteria

1. WHEN the Plugin initializes, THE Plugin SHALL check for Git installation on the User's machine
2. WHEN Git is not detected, THE Plugin SHALL display an error message indicating Git is required
3. WHEN Git is detected, THE Plugin SHALL verify the Production Vault is initialized as a Git repository
4. IF the Production Vault is not a Git repository, THEN THE Plugin SHALL display an error message instructing the User to initialize it
5. THE Plugin SHALL execute all version control operations using native Git commands


### Requirement 3

**User Story:** As the designated user, I want to configure GitHub authentication, so that the plugin can create pull requests on my behalf

#### Acceptance Criteria

1. THE Plugin SHALL allow the User to input and save a GitHub personal access token in the settings panel
2. WHEN the token is saved, THE Plugin SHALL validate the token by making a test API call to GitHub
3. WHEN validation fails, THE Plugin SHALL display an error message indicating the token is invalid
4. THE Plugin SHALL store the authentication token securely in the local system
5. THE Plugin SHALL allow the User to specify the Repository owner and name in the settings panel

### Requirement 4

**User Story:** As the designated user, I want to compare the working vault with the production vault, so that I can identify what changes need to be promoted

#### Acceptance Criteria

1. WHEN the User initiates a compare operation via Command Palette, THE Plugin SHALL execute Git diff commands to compare the Working Vault directory with the Production Vault repository
2. THE Plugin SHALL use Git status commands to identify files that exist in the Working Vault but not in the Production Vault
3. THE Plugin SHALL use Git status commands to identify files that exist in the Production Vault but not in the Working Vault
4. THE Plugin SHALL use Git diff commands to identify files that exist in both vaults but have different content
5. THE Plugin SHALL parse the Git command output and display a summary notification indicating the number of added, deleted, and modified files


### Requirement 5

**User Story:** As the designated user, I want to promote changes from the working vault to production via a pull request, so that changes can be reviewed before merging

#### Acceptance Criteria

1. WHEN the User initiates a promote operation via Command Palette, THE Plugin SHALL create a new Feature Branch in the Production Vault repository using Git commands
2. WHEN the Feature Branch is created, THE Plugin SHALL copy all changed files from the Working Vault to the Production Vault directory
3. WHEN files are copied, THE Plugin SHALL stage all changes using Git add commands
4. WHEN changes are staged, THE Plugin SHALL create a commit with a descriptive message using Git commit commands
5. WHEN the commit is created, THE Plugin SHALL push the Feature Branch to the Repository using Git push commands
6. WHEN the push succeeds, THE Plugin SHALL create a Pull Request on GitHub using the GitHub API

### Requirement 6

**User Story:** As the designated user, I want to generate a styled change report when creating a pull request, so that I can review the differences in a readable format before merging

#### Acceptance Criteria

1. WHEN a Pull Request is created, THE Plugin SHALL execute Git diff commands to retrieve the raw diff output between the Feature Branch and Main Branch
2. THE Plugin SHALL parse the Git diff output and generate a markdown document with a header section containing the Pull Request URL
3. THE Plugin SHALL format each modified file from the Git diff as a markdown header with a clickable link to the file location in the Production Vault
4. WHEN a file has changes in the Git diff output, THE Plugin SHALL include the diff information below the file header with markdown formatting for additions and deletions
5. THE Plugin SHALL save the Change Report as a markdown file in the Production Vault with a timestamp in the filename


### Requirement 7

**User Story:** As the designated user, I want to interact with the plugin through the command palette, so that I can perform operations without leaving my keyboard workflow

#### Acceptance Criteria

1. THE Plugin SHALL register a command in the Command Palette for comparing Working Vault and Production Vault
2. THE Plugin SHALL register a command in the Command Palette for promoting changes and creating a Pull Request
3. THE Plugin SHALL register a command in the Command Palette for generating a Change Report from an existing Pull Request
4. WHEN any command is executed, THE Plugin SHALL display status notifications indicating operation progress
5. WHEN any command completes, THE Plugin SHALL display a notification indicating success or failure with relevant details

### Requirement 8

**User Story:** As the designated user, I want the change report to have a consistent and readable format, so that I can quickly understand what has changed

#### Acceptance Criteria

1. THE Plugin SHALL format the Change Report with a title indicating the date and time of generation
2. THE Plugin SHALL parse Git diff statistics to include a summary section listing the total number of files added, modified, and deleted
3. THE Plugin SHALL organize file changes by type with separate sections for additions, modifications, and deletions based on Git diff output
4. THE Plugin SHALL format diff additions with markdown code block syntax indicating additions and deletions as provided by Git diff
5. THE Plugin SHALL preserve line numbers from the Git diff output in the Change Report for easy reference
