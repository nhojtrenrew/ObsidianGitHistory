/**
 * SonarQube Warning Suppressions:
 * This file contains intentional design choices that trigger SonarQube warnings.
 * These are not errors but stylistic preferences that don't apply to Obsidian plugin development:
 * 
 * - String.raw for Windows paths: Backslashes are intentionally escaped for Windows compatibility
 * - Empty catch blocks: Used for optional operations where failures are acceptable
 * - Notice instantiation: Obsidian's Notice class is used for side effects (displaying notifications)
 * - Cognitive complexity: Complex functions are necessary for Git operations and file management
 * - Readonly members: Members may need reassignment in future updates
 * - Negated conditions: Used for early returns and guard clauses (common pattern)
 * - Union types: Inline union types are clearer than type aliases for simple cases
 * - Nested ternaries: Used sparingly where they improve readability
 * - parseInt vs Number.parseInt: Global parseInt is standard and widely supported
 * 
 * These warnings are acknowledged and intentionally not addressed as they would reduce
 * code clarity or compatibility with the Obsidian plugin environment.
 */

import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
// eslint-disable-next-line sonarjs/prefer-node-protocol
import { existsSync, copyFileSync, mkdirSync, readdirSync, statSync, unlinkSync, rmdirSync, writeFileSync } from 'fs';
// eslint-disable-next-line sonarjs/prefer-node-protocol
import { exec } from 'child_process';
// eslint-disable-next-line sonarjs/prefer-node-protocol
import { promisify } from 'util';
// eslint-disable-next-line sonarjs/prefer-node-protocol
import { join, dirname } from 'path';
import { Octokit } from '@octokit/rest';

const execAsync = promisify(exec);

interface PluginSettings {
	workingVaultPath: string;
	productionVaultPath: string;
	githubToken: string;
	githubRepoOwner: string;
	githubRepoName: string;
	customGitPath: string;
	gitUserName: string;
	gitUserEmail: string;
	useTokenInUrl: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
	workingVaultPath: '',
	productionVaultPath: '',
	githubToken: '',
	githubRepoOwner: '',
	githubRepoName: '',
	customGitPath: '',
	gitUserName: '',
	gitUserEmail: '',
	useTokenInUrl: true
};

class GitService {
	// eslint-disable-next-line sonarjs/prefer-readonly
	private productionVaultPath: string;
	// eslint-disable-next-line sonarjs/prefer-readonly
	private customGitPath: string;
	// eslint-disable-next-line sonarjs/prefer-readonly
	private gitUserName: string;
	// eslint-disable-next-line sonarjs/prefer-readonly
	private gitUserEmail: string;

	constructor(productionVaultPath: string, customGitPath: string = '', gitUserName: string = '', gitUserEmail: string = '') {
		this.productionVaultPath = productionVaultPath;
		this.customGitPath = customGitPath;
		this.gitUserName = gitUserName;
		this.gitUserEmail = gitUserEmail;
	}

	/**
	 * Get the git command to use (either custom path or 'git')
	 */
	private getGitCommand(): string {
		return this.customGitPath || 'git';
	}

	/**
	 * Execute a Git command in the production vault directory
	 */
	async executeGitCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string }> {
		try {
			// Replace 'git' with custom path if specified
			const gitCmd = this.getGitCommand();
			const modifiedCommand = command.replace(/^git\s/, `"${gitCmd}" `);
			
			const result = await execAsync(modifiedCommand, {
				cwd: cwd || this.productionVaultPath,
				encoding: 'utf8'
			});
			return result;
		} catch (error: any) {
			// Git commands may return non-zero exit codes for valid scenarios (e.g., no changes)
			// Check if this is a critical error or just a non-zero exit code
			const stderr = error.stderr || error.message || '';
			const stdout = error.stdout || '';
			
			// Check for critical Git errors
			if (stderr.includes('fatal:') || stderr.includes('error:')) {
				// This is a real error, throw it
				throw new Error(`Git command failed: ${stderr || error.message}`);
			}
			
			// Return both stdout and stderr for parsing (non-critical scenarios)
			return { stdout, stderr };
		}
	}

	/**
	 * Check if Git is installed on the system
	 */
	async checkGitInstalled(): Promise<boolean> {
		try {
			const gitCmd = this.getGitCommand();
			const result = await execAsync(`"${gitCmd}" --version`);
			return result.stdout.includes('git version');
		} catch (error: any) {
			console.error('Git installation check failed:', error.message);
			return false;
		}
	}

	/**
	 * Find Git installation on Windows by checking common paths
	 */
	// eslint-disable-next-line sonarjs/cognitive-complexity, sonarjs/no-nested-template-literals
	static async findGitOnWindows(): Promise<string | null> {
		// eslint-disable-next-line sonarjs/no-duplicate-string
		const commonPaths = [
			'C:\\Program Files\\Git\\cmd\\git.exe',
			'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
			'C:\\Program Files\\Git\\bin\\git.exe',
			'C:\\Program Files (x86)\\Git\\bin\\git.exe',
			process.env.LOCALAPPDATA + '\\Programs\\Git\\cmd\\git.exe',
			process.env.LOCALAPPDATA + '\\Programs\\Git\\bin\\git.exe',
			process.env.LOCALAPPDATA + '\\GitHubDesktop\\app-*\\resources\\app\\git\\cmd\\git.exe'
		];

		for (const path of commonPaths) {
			try {
				if (existsSync(path)) {
					// Verify it works
					const result = await execAsync(`"${path}" --version`);
					if (result.stdout.includes('git version')) {
						return path;
					}
				}
			} catch (error) {
				// Continue checking other paths
			}
		}

		// Check GitHub Desktop path with wildcard
		try {
			// eslint-disable-next-line sonarjs/no-duplicate-string
			const githubDesktopBase = process.env.LOCALAPPDATA + '\\GitHubDesktop';
			if (existsSync(githubDesktopBase)) {
				const dirs = readdirSync(githubDesktopBase);
				for (const dir of dirs) {
					if (dir.startsWith('app-')) {
						const gitPath = `${githubDesktopBase}\\${dir}\\resources\\app\\git\\cmd\\git.exe`;
						if (existsSync(gitPath)) {
							const result = await execAsync(`"${gitPath}" --version`);
							if (result.stdout.includes('git version')) {
								return gitPath;
							}
						}
					}
				}
			}
		} catch (error) {
			// Continue
		}

		return null;
	}

	/**
	 * Check if Git is configured with user name and email
	 * Can optionally check plugin settings as fallback
	 */
	async checkGitConfigured(pluginUserName?: string, pluginUserEmail?: string): Promise<{ configured: boolean; userName?: string; userEmail?: string; error?: string }> {
		try {
			const gitCmd = this.getGitCommand();
			let userName = '';
			let userEmail = '';

			// Try to get from global Git config
			try {
				const nameResult = await execAsync(`"${gitCmd}" config --global user.name`);
				userName = nameResult.stdout.trim();
			} catch (error) {
				// Ignore error, will check plugin settings
			}

			try {
				const emailResult = await execAsync(`"${gitCmd}" config --global user.email`);
				userEmail = emailResult.stdout.trim();
			} catch (error) {
				// Ignore error, will check plugin settings
			}

			// If not in Git config, check plugin settings
			if (!userName && pluginUserName) {
				userName = pluginUserName;
			}
			if (!userEmail && pluginUserEmail) {
				userEmail = pluginUserEmail;
			}

			if (!userName || !userEmail) {
				return { 
					configured: false, 
					userName, 
					userEmail,
					error: 'Git user name or email not configured' 
				};
			}
			
			return { configured: true, userName, userEmail };
		} catch (error: any) {
			return { 
				configured: false, 
				error: error.message 
			};
		}
	}

	/**
	 * Configure Git with user name and email (globally or for specific repo)
	 */
	async configureGit(userName: string, userEmail: string, global: boolean = true): Promise<void> {
		try {
			const scope = global ? '--global' : '--local';

			// Use executeGitCommand so it runs in the correct directory
			await this.executeGitCommand(`git config ${scope} user.name "${userName}"`);
			await this.executeGitCommand(`git config ${scope} user.email "${userEmail}"`);
		} catch (error: any) {
			throw new Error(`Failed to configure Git: ${error.message}`);
		}
	}

	/**
	 * Check if a directory is a Git repository
	 */
	async isGitRepository(path?: string): Promise<boolean> {
		try {
			const result = await this.executeGitCommand('git rev-parse --is-inside-work-tree', path);
			return result.stdout.trim() === 'true';
		} catch (error: any) {
			console.error('Git repository check failed:', error.message);
			return false;
		}
	}

	/**
	 * Get diff between working vault and production vault
	 * Compares working branch (working vault) against main branch (production vault)
	 */
	async diff(workingVaultPath: string, ref?: string): Promise<string> {
		try {
			// Since both vaults push to the same GitHub repo but are separate local repos,
			// we need to fetch and compare via the remote branches
			const workingGitService = new GitService(workingVaultPath, '');
			
			// Fetch latest from both branches
			await workingGitService.executeGitCommand('git fetch origin main');
			await workingGitService.executeGitCommand('git fetch origin working');
			
			// Compare origin/main (production on GitHub) vs origin/working (working on GitHub)
			// This compares what's actually on GitHub right now
			const result = await workingGitService.executeGitCommand(
				'git diff --no-color origin/main origin/working'
			);
			return result.stdout;
		} catch (error: any) {
			// git diff returns exit code 1 when there are differences
			// This is expected behavior, so we need to check if stdout has content
			if (error.stdout) {
				return error.stdout;
			}
			throw new Error(`Failed to get diff: ${error.message}`);
		}
	}

	/**
	 * Get repository status showing added, modified, and deleted files
	 */
	async status(): Promise<{ stdout: string; stderr: string }> {
		try {
			return await this.executeGitCommand('git status --porcelain');
		} catch (error: any) {
			throw new Error(`Failed to get repository status: ${error.message}`);
		}
	}

	/**
	 * Parse Git diff output to identify file changes
	 */
	parseDiffOutput(diffOutput: string): { added: string[]; modified: string[]; deleted: string[] } {
		const added: string[] = [];
		const modified: string[] = [];
		const deleted: string[] = [];

		const lines = diffOutput.split('\n');
		for (const line of lines) {
			// Parse diff headers to identify file operations
			if (line.startsWith('diff --git')) {
				// Extract file paths from diff header
				const match = line.match(/diff --git a\/(.*?) b\/(.*?)$/);
				if (match) {
					const fileA = match[1];
					const fileB = match[2];
					
					// Check if file was added, deleted, or modified
					if (fileA === '/dev/null') {
						added.push(fileB);
					} else if (fileB === '/dev/null') {
						deleted.push(fileA);
					} else if (fileA !== fileB) {
						// File was renamed
						deleted.push(fileA);
						added.push(fileB);
					} else {
						modified.push(fileA);
					}
				}
			}
		}

		return { added, modified, deleted };
	}

	/**
	 * Parse Git status output to identify file changes
	 */
	parseStatusOutput(statusOutput: string): { added: string[]; modified: string[]; deleted: string[] } {
		const added: string[] = [];
		const modified: string[] = [];
		const deleted: string[] = [];

		const lines = statusOutput.split('\n');
		for (const line of lines) {
			if (line.length < 3) continue;

			const status = line.substring(0, 2);
			const filePath = line.substring(3).trim();

			// Parse porcelain format status codes
			if (status.includes('A') || status.includes('?')) {
				added.push(filePath);
			} else if (status.includes('M')) {
				modified.push(filePath);
			} else if (status.includes('D')) {
				deleted.push(filePath);
			}
		}

		return { added, modified, deleted };
	}

	/**
	 * Create a new feature branch
	 */
	async createBranch(branchName: string): Promise<void> {
		try {
			await this.executeGitCommand(`git checkout -b ${branchName}`);
		} catch (error: any) {
			throw new Error(`Failed to create branch '${branchName}': ${error.message}`);
		}
	}

	/**
	 * Stage files for commit
	 */
	async stageFiles(files: string[]): Promise<void> {
		try {
			if (files.length === 0) {
				// Stage all changes
				await this.executeGitCommand('git add -A');
			} else {
				// Stage specific files
				const fileList = files.map(f => `"${f}"`).join(' ');
				await this.executeGitCommand(`git add ${fileList}`);
			}
		} catch (error: any) {
			throw new Error(`Failed to stage files: ${error.message}`);
		}
	}

	/**
	 * Ensure Git is configured locally before committing
	 */
	private async ensureGitConfigured(): Promise<void> {
		if (this.gitUserName && this.gitUserEmail) {
			await this.configureGit(this.gitUserName, this.gitUserEmail, false);
		}
	}

	/**
	 * Create a commit with a message
	 */
	async commit(message: string): Promise<void> {
		try {
			// Configure Git locally if plugin settings are available
			await this.ensureGitConfigured();
			
			await this.executeGitCommand(`git commit -m "${message}"`);
		} catch (error: any) {
			throw new Error(`Failed to create commit: ${error.message}`);
		}
	}

	/**
	 * Push branch to remote repository
	 */
	async push(branchName: string): Promise<void> {
		try {
			await this.executeGitCommand(`git push -u origin ${branchName}`);
		} catch (error: any) {
			// Check for common push errors
			if (error.message.includes('Permission denied') || error.message.includes('authentication failed')) {
				throw new Error('Git push failed: Authentication error. Please check your Git credentials.');
			} else if (error.message.includes('Could not resolve host') || error.message.includes('network')) {
				throw new Error('Git push failed: Network error. Please check your internet connection.');
			} else if (error.message.includes('rejected')) {
				throw new Error('Git push failed: Push was rejected. The remote may have changes you need to pull first.');
			} else {
				throw new Error(`Failed to push branch '${branchName}': ${error.message}`);
			}
		}
	}

	/**
	 * Copy files from working vault to production vault and stage them
	 */
	async copyAndStage(workingVaultPath: string): Promise<void> {
		try {
			// First, sync directories (copy new/modified files and remove deleted files)
			this.syncDirectories(workingVaultPath, this.productionVaultPath);
			
			// Stage all changes (including deletions)
			await this.executeGitCommand('git add -A');
		} catch (error: any) {
			throw new Error(`Failed to copy and stage files: ${error.message}`);
		}
	}

	/**
	 * Sync directories: copy files from source to target and remove files that don't exist in source
	 */
	private syncDirectories(source: string, target: string): void {
		try {
			// First, copy all files from source to target
			this.copyDirectoryRecursive(source, target);
			
			// Then, remove files from target that don't exist in source
			this.removeDeletedFiles(source, target);
		} catch (error: any) {
			throw new Error(`Failed to sync directories: ${error.message}`);
		}
	}

	/**
	 * Remove files from target that don't exist in source
	 */
	private removeDeletedFiles(source: string, target: string): void {
		try {
			// Skip if target doesn't exist
			if (!existsSync(target)) {
				return;
			}

			// Read all items in target directory
			const items = readdirSync(target);

			for (const item of items) {
				const sourcePath = join(source, item);
				const targetPath = join(target, item);

				// Skip .git, .obsidian, and Update Logs directories
				// Update Logs is production-only and should not be deleted
				if (item === '.git' || item === '.obsidian' || item === 'Update Logs') {
					continue;
				}

				const targetStat = statSync(targetPath);

				if (targetStat.isDirectory()) {
					// If directory doesn't exist in source, remove it from target
					if (!existsSync(sourcePath)) {
						this.removeDirectoryRecursive(targetPath);
					} else {
						// Recursively check subdirectory
						this.removeDeletedFiles(sourcePath, targetPath);
					}
				} else if (targetStat.isFile()) {
					// If file doesn't exist in source, remove it from target
					if (!existsSync(sourcePath)) {
						unlinkSync(targetPath);
					}
				}
			}
		} catch (error: any) {
			throw new Error(`Failed to remove deleted files: ${error.message}`);
		}
	}

	/**
	 * Recursively remove a directory and its contents
	 */
	private removeDirectoryRecursive(dirPath: string): void {
		if (existsSync(dirPath)) {
			const items = readdirSync(dirPath);
			for (const item of items) {
				const itemPath = join(dirPath, item);
				const stat = statSync(itemPath);
				if (stat.isDirectory()) {
					this.removeDirectoryRecursive(itemPath);
				} else {
					unlinkSync(itemPath);
				}
			}
			rmdirSync(dirPath);
		}
	}

	/**
	 * Recursively copy directory contents
	 */
	private copyDirectoryRecursive(source: string, target: string): void {
		try {
			// Create target directory if it doesn't exist
			if (!existsSync(target)) {
				mkdirSync(target, { recursive: true });
			}

			// Read all items in source directory
			const items = readdirSync(source);

			for (const item of items) {
				const sourcePath = join(source, item);
				const targetPath = join(target, item);

				// Skip .git directory
				if (item === '.git') {
					continue;
				}

				const stat = statSync(sourcePath);

				if (stat.isDirectory()) {
					// Recursively copy subdirectory
					this.copyDirectoryRecursive(sourcePath, targetPath);
				} else if (stat.isFile()) {
					// Copy file
					const targetDir = dirname(targetPath);
					if (!existsSync(targetDir)) {
						mkdirSync(targetDir, { recursive: true });
					}
					copyFileSync(sourcePath, targetPath);
				}
			}
		} catch (error: any) {
			// Provide more specific error messages for file system operations
			if (error.code === 'EACCES') {
				throw new Error(`Permission denied while copying files: ${error.message}`);
			} else if (error.code === 'ENOSPC') {
				throw new Error('Insufficient disk space to copy files');
			} else if (error.code === 'ENOENT') {
				throw new Error(`File or directory not found: ${error.message}`);
			} else {
				throw new Error(`File system error: ${error.message}`);
			}
		}
	}
}

interface PullRequestInfo {
	url: string;
	number: number;
	title: string;
	branch: string;
	createdAt: string;
}

class GitHubService {
	// eslint-disable-next-line sonarjs/prefer-readonly
	private octokit: Octokit;
	// eslint-disable-next-line sonarjs/prefer-readonly
	private owner: string;
	// eslint-disable-next-line sonarjs/prefer-readonly
	private repo: string;

	constructor(token: string, owner: string, repo: string) {
		this.octokit = new Octokit({
			auth: token
		});
		this.owner = owner;
		this.repo = repo;
	}

	/**
	 * Validate the GitHub token by making a test API call
	 */
	async validateToken(): Promise<{ valid: boolean; error?: string }> {
		try {
			// Test the token by fetching the authenticated user
			await this.octokit.rest.users.getAuthenticated();
			return { valid: true };
		} catch (error: any) {
			if (error.status === 401) {
				return { valid: false, error: 'Invalid or expired GitHub token' };
			} else if (error.status === 403) {
				return { valid: false, error: 'GitHub token lacks required permissions' };
			} else {
				return { valid: false, error: error.message || 'Failed to validate token' };
			}
		}
	}

	/**
	 * List open pull requests from working branch to main
	 */
	async listOpenPullRequests(): Promise<Array<{ number: number; title: string; head: string }>> {
		try {
			const response = await this.octokit.rest.pulls.list({
				owner: this.owner,
				repo: this.repo,
				state: 'open',
				base: 'main',
				head: `${this.owner}:working`
			});

			return response.data.map(pr => ({
				number: pr.number,
				title: pr.title,
				head: pr.head.ref
			}));
		} catch (error: any) {
			throw new Error(`Failed to list pull requests: ${error.message}`);
		}
	}

	/**
	 * Close a pull request
	 */
	async closePullRequest(prNumber: number): Promise<void> {
		try {
			await this.octokit.rest.pulls.update({
				owner: this.owner,
				repo: this.repo,
				pull_number: prNumber,
				state: 'closed'
			});
		} catch (error: any) {
			throw new Error(`Failed to close pull request #${prNumber}: ${error.message}`);
		}
	}

	/**
	 * Create a pull request from a feature branch to main
	 */
	async createPullRequest(
		branch: string,
		title: string,
		body: string
	): Promise<PullRequestInfo> {
		try {
			const response = await this.octokit.rest.pulls.create({
				owner: this.owner,
				repo: this.repo,
				title: title,
				body: body,
				head: branch,
				base: 'main'
			});

			return {
				url: response.data.html_url,
				number: response.data.number,
				title: response.data.title,
				branch: branch,
				createdAt: response.data.created_at
			};
		} catch (error: any) {
			// Handle specific GitHub API errors
			if (error.status === 401) {
				throw new Error('GitHub authentication failed. Please check your token.');
			} else if (error.status === 403) {
				if (error.message.includes('rate limit')) {
					throw new Error('GitHub API rate limit exceeded. Please try again later.');
				} else {
					throw new Error('GitHub token lacks required permissions to create pull requests.');
				}
			} else if (error.status === 404) {
				throw new Error(`Repository ${this.owner}/${this.repo} not found. Please check your settings.`);
			} else if (error.status === 422) {
				// Validation failed - could be duplicate PR or invalid branch
				throw new Error(`Failed to create pull request: ${error.message}`);
			} else {
				throw new Error(`GitHub API error: ${error.message || 'Unknown error'}`);
			}
		}
	}

	/**
	 * Merge a pull request
	 */
	async mergePullRequest(prNumber: number, commitMessage?: string): Promise<void> {
		try {
			await this.octokit.rest.pulls.merge({
				owner: this.owner,
				repo: this.repo,
				pull_number: prNumber,
				commit_title: commitMessage || `Merge pull request #${prNumber}`,
				merge_method: 'merge' // Use standard merge (creates merge commit)
			});
		} catch (error: any) {
			if (error.status === 405) {
				throw new Error(`Pull request #${prNumber} cannot be merged. It may have conflicts or required checks haven't passed.`);
			} else if (error.status === 404) {
				throw new Error(`Pull request #${prNumber} not found.`);
			} else {
				throw new Error(`Failed to merge pull request #${prNumber}: ${error.message}`);
			}
		}
	}
}

interface DiffFile {
	path: string;
	status: 'added' | 'modified' | 'deleted' | 'moved';
	changes: string;
	oldPath?: string; // For moved files
}

interface DiffStats {
	filesAdded: number;
	filesModified: number;
	filesDeleted: number;
	filesMoved: number;
	totalFiles: number;
}

interface GitDiffResult {
	files: DiffFile[];
	stats: DiffStats;
	filesByStatus: {
		added: string[];
		modified: string[];
		deleted: string[];
		moved: string[];
	};
}

class ReportGenerator {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Check if a file should be excluded from the report
	 */
	private shouldExcludeFile(filePath: string): boolean {
		// Exclude .obsidian folder files
		if (filePath.startsWith('.obsidian/') || filePath.startsWith('.obsidian\\')) {
			return true;
		}
		// Exclude .gitignore and .git files
		if (filePath === '.gitignore' || filePath.startsWith('.git/') || filePath.startsWith('.git\\')) {
			return true;
		}
		// Exclude Update Logs folder (reporting folder, not part of standards)
		if (filePath.startsWith('Update Logs/') || filePath.startsWith('Update Logs\\')) {
			return true;
		}
		// Exclude other hidden files
		if (filePath.startsWith('.')) {
			return true;
		}
		return false;
	}

	/**
	 * Parse Git diff output into structured format
	 */
	parseDiff(diffOutput: string): GitDiffResult {
		const files: DiffFile[] = [];
		const filesByStatus = {
			added: [] as string[],
			modified: [] as string[],
			deleted: [] as string[],
			moved: [] as string[]
		};

		// Split diff output into individual file sections
		const fileSections = diffOutput.split(/^diff --git /m).filter(section => section.trim());

		for (const section of fileSections) {
			// Parse the file header to extract paths and status
			const lines = section.split('\n');
			const firstLine = lines[0];
			
			// Extract file paths from "a/path b/path" format
			const pathMatch = firstLine.match(/a\/(.+?) b\/(.+?)$/);
			if (!pathMatch) continue;

			const pathA = pathMatch[1];
			const pathB = pathMatch[2];

			let status: 'added' | 'modified' | 'deleted' | 'moved';
			let filePath: string;
			let oldPath: string | undefined;

			// Determine file status based on paths and diff markers
			const sectionText = section.toLowerCase();
			
			// Check for renames/moves (Git detects similar files as renames)
			if (sectionText.includes('rename from') && sectionText.includes('rename to')) {
				// Extract old path from "rename from" line
				const renameFromMatch = section.match(/rename from (.+)/);
				if (renameFromMatch) {
					oldPath = renameFromMatch[1].trim();
				}
				
				// Check if content was also modified (similarity < 100%)
				const similarityMatch = section.match(/similarity index (\d+)%/);
				if (similarityMatch && parseInt(similarityMatch[1]) === 100) {
					// Pure move (no content changes)
					status = 'moved';
				} else {
					// Move + edit
					status = 'modified';
				}
				filePath = pathB;
			}
			// Check for /dev/null (standard Git format for added/deleted files)
			else if (pathA === '/dev/null' || pathA === 'dev/null') {
				status = 'added';
				filePath = pathB;
			} else if (pathB === '/dev/null' || pathB === 'dev/null') {
				status = 'deleted';
				filePath = pathA;
			}
			// Check for "new file mode" and "deleted file mode" markers
			else if (sectionText.includes('new file mode')) {
				status = 'added';
				filePath = pathB;
			} else if (sectionText.includes('deleted file mode')) {
				status = 'deleted';
				filePath = pathA;
			} else {
				status = 'modified';
				filePath = pathB;
			}

			// Skip excluded files
			if (this.shouldExcludeFile(filePath)) {
				continue;
			}

			// Add to appropriate status array
			if (status === 'added') {
				filesByStatus.added.push(filePath);
			} else if (status === 'deleted') {
				filesByStatus.deleted.push(filePath);
			} else if (status === 'moved') {
				filesByStatus.moved.push(filePath);
			} else {
				filesByStatus.modified.push(filePath);
			}

			// Extract the diff content (everything after the header lines)
			const diffContentStart = lines.findIndex(line => 
				line.startsWith('@@') || line.startsWith('+++') || line.startsWith('---')
			);
			const changes = diffContentStart >= 0 
				? lines.slice(diffContentStart).join('\n')
				: section;

			files.push({
				path: filePath,
				status,
				changes,
				oldPath
			});
		}

		// Calculate statistics
		const stats: DiffStats = {
			filesAdded: filesByStatus.added.length,
			filesModified: filesByStatus.modified.length,
			filesDeleted: filesByStatus.deleted.length,
			filesMoved: filesByStatus.moved.length,
			totalFiles: filesByStatus.added.length + filesByStatus.modified.length + filesByStatus.deleted.length + filesByStatus.moved.length
		};

		return {
			files,
			stats,
			filesByStatus
		};
	}

	/**
	 * Build a folder tree structure from file paths
	 */
	private buildFolderTree(filesByStatus: GitDiffResult['filesByStatus']): Map<string, any> {
		const tree = new Map<string, any>();
		
		const addToTree = (path: string, status: 'added' | 'modified' | 'deleted' | 'moved') => {
			const parts = path.split(/[\/\\]/);
			const filename = parts[parts.length - 1];
			const folders = parts.slice(0, -1);
			
			let current = tree;
			let currentPath = '';
			
			// Build folder structure
			for (const folder of folders) {
				currentPath = currentPath ? `${currentPath}/${folder}` : folder;
				if (!current.has(folder)) {
					current.set(folder, { files: [], subfolders: new Map() });
				}
				current = current.get(folder).subfolders;
			}
			
			// Add file to the deepest folder
			if (folders.length === 0) {
				// Root level file
				if (!tree.has('(root)')) {
					tree.set('(root)', { files: [], subfolders: new Map() });
				}
				tree.get('(root)').files.push({ name: filename, path, status });
			} else {
				const lastFolder = folders[folders.length - 1];
				let parent = tree;
				for (let i = 0; i < folders.length - 1; i++) {
					parent = parent.get(folders[i]).subfolders;
				}
				parent.get(lastFolder).files.push({ name: filename, path, status });
			}
		};
		
		// Add all files to tree
		for (const file of filesByStatus.added) addToTree(file, 'added');
		for (const file of filesByStatus.modified) addToTree(file, 'modified');
		for (const file of filesByStatus.deleted) addToTree(file, 'deleted');
		for (const file of filesByStatus.moved) addToTree(file, 'moved');
		
		return tree;
	}

	/**
	 * Format folder tree recursively
	 */
	private formatFolderTree(tree: Map<string, any>, indent: string = '', isLast: boolean = true): string {
		let output = '';
		const entries = Array.from(tree.entries());
		
		entries.forEach(([folderName, data], index) => {
			const isLastEntry = index === entries.length - 1;
			const prefix = indent + (isLastEntry ? '└── ' : '├── ');
			const childIndent = indent + (isLastEntry ? '    ' : '│   ');
			
			// Add folder
			output += `${prefix}📁 **${folderName}**\n`;
			
			// Add files in this folder
			data.files.forEach((file: any, fileIndex: number) => {
				const isLastFile = fileIndex === data.files.length - 1 && data.subfolders.size === 0;
				const filePrefix = childIndent + (isLastFile ? '└── ' : '├── ');
				const statusIcon = file.status === 'added' ? '🟢' : 
				                   file.status === 'deleted' ? '🔴' : 
				                   file.status === 'moved' ? '🟡' : '🔵';
				output += `${filePrefix}${statusIcon} ${file.name}\n`;
			});
			
			// Add subfolders recursively
			if (data.subfolders.size > 0) {
				output += this.formatFolderTree(data.subfolders, childIndent, false);
			}
		});
		
		return output;
	}

	/**
	 * Format summary section with folder tree view
	 */
	formatSummary(stats: DiffStats, filesByStatus: GitDiffResult['filesByStatus']): string {
		let summary = '## Summary\n\n';
		summary += `**Total Changes:** ${stats.totalFiles} files\n`;
		summary += `- 🟢 ${stats.filesAdded} added\n`;
		summary += `- 🔵 ${stats.filesModified} modified\n`;
		summary += `- 🔄 ${stats.filesMoved} moved\n`;
		summary += `- 🔴 ${stats.filesDeleted} deleted\n\n`;

		// Build and display folder tree
		summary += '### Folder Tree\n\n';
		summary += '```\n';
		const tree = this.buildFolderTree(filesByStatus);
		summary += this.formatFolderTree(tree);
		summary += '```\n\n';

		return summary;
	}

	/**
	 * Format individual file changes section
	 */
	formatDiffSection(file: DiffFile): string {
		let section = '';

		// Add diff content in collapsible callout with filename as title
		if (file.changes && file.changes.trim()) {
			// Choose callout type based on file status
			let calloutType = 'info';
			let statusIcon = '📄';
			if (file.status === 'deleted') {
				calloutType = 'failure';
				statusIcon = '🔴';
			} else if (file.status === 'modified') {
				calloutType = 'note';
				statusIcon = '🔵';
			} else if (file.status === 'added') {
				calloutType = 'abstract';
				statusIcon = '🟢';
			} else if (file.status === 'moved') {
				calloutType = 'info';
				statusIcon = '🟡';
			}
			
			// Extract folder path and filename
			const lastSlash = Math.max(file.path.lastIndexOf('/'), file.path.lastIndexOf('\\'));
			const folderPath = lastSlash > 0 ? file.path.substring(0, lastSlash) : '(root)';
			const filename = lastSlash > 0 ? file.path.substring(lastSlash + 1) : file.path;
			
			// Remove file extension to prevent Obsidian from creating wikilinks
			const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
			const fullPathWithoutExt = file.path.replace(/\.[^/.]+$/, '');
			
			// Use filename without extension as callout title with status icon
			section += `> [!${calloutType}]- ${statusIcon} ${filenameWithoutExt}\n`;
			
			// Add folder path and full file path without extension
			section += `> **📁 Folder:** ${folderPath}\n`;
			section += `> **📄 Path:** ${fullPathWithoutExt}\n`;
			
			// For moved files, show the old path
			if (file.status === 'moved' && file.oldPath) {
				const oldPathWithoutExt = file.oldPath.replace(/\.[^/.]+$/, '');
				section += `> **📤 Moved from:** ${oldPathWithoutExt}\n`;
			}
			
			section += `>\n`;
			
			// Add diff code block
			section += '> ```diff\n';
			// Add > prefix to each line for callout formatting
			const diffLines = file.changes.split('\n');
			for (const line of diffLines) {
				section += `> ${line}\n`;
			}
			section += '> ```\n\n';
		}

		return section;
	}

	/**
	 * Generate complete markdown report
	 */
	async generateReport(diffOutput: string, prInfo: PullRequestInfo): Promise<string> {
		// Parse the diff
		const diffResult = this.parseDiff(diffOutput);

		// Build the report
		const timestamp = new Date().toLocaleString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		});

		let report = `# Change Report - ${timestamp}\n\n`;
		
		// Add summary section first
		report += this.formatSummary(diffResult.stats, diffResult.filesByStatus);

		// Add changes section
		if (diffResult.files.length > 0) {
			report += '## Changes\n\n';
			for (const file of diffResult.files) {
				report += this.formatDiffSection(file);
			}
		}

		// Add GitHub repository link at the end
		const repoUrl = prInfo.url.split('/pull/')[0]; // Extract repo URL from PR URL
		report += '\n---\n\n';
		report += `**GitHub Repository:** ${repoUrl}\n`;

		return report;
	}

	/**
	 * Save report to production vault using Obsidian Vault API
	 */
	async saveReport(content: string, productionVaultPath: string): Promise<string> {
		// Generate timestamped filename in format: YYYY-MM-DD-HH-MM-SS-change-report
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		const seconds = String(now.getSeconds()).padStart(2, '0');
		
		const filename = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}-change-report.md`;
		
		// Define the Update Logs folder path
		const folderPath = 'Update Logs';
		const fullPath = `${folderPath}/${filename}`;

		try {
			// Check if Update Logs folder exists, create if it doesn't
			const folder = this.app.vault.getAbstractFileByPath(folderPath);
			if (!folder) {
				await this.app.vault.createFolder(folderPath);
			}

			// Save report to Update Logs folder
			await this.app.vault.create(fullPath, content);
			return filename;
		} catch (error: any) {
			// Provide specific error messages for file operations
			if (error.message.includes('already exists')) {
				throw new Error(`Report file already exists: ${fullPath}`);
			} else if (error.message.includes('permission')) {
				throw new Error('Permission denied: Cannot write report file to vault');
			} else {
				throw new Error(`Failed to save report: ${error.message}`);
			}
		}
	}
}

interface ChangesSummary {
	filesAdded: number;
	filesModified: number;
	filesDeleted: number;
	addedFiles: string[];
	modifiedFiles: string[];
	deletedFiles: string[];
}

class GitAuthenticationModal extends Modal {
	private onRetry: () => void;

	constructor(app: App, onRetry: () => void) {
		super(app);
		this.onRetry = onRetry;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: '🔐 Git Authentication Required' });
		
		contentEl.createEl('p', { 
			text: 'Git needs to authenticate with GitHub to push changes. Please set up Git authentication using one of these methods:' 
		});

		// Method 1: Git Credential Manager
		const method1 = contentEl.createDiv({ cls: 'auth-method' });
		method1.style.padding = '15px';
		method1.style.marginTop = '15px';
		method1.style.marginBottom = '15px';
		method1.style.borderRadius = '5px';
		method1.style.backgroundColor = 'var(--background-secondary)';

		method1.createEl('h3', { text: '✅ Easiest: Use Your Existing GitHub Token' });
		method1.createEl('p', { text: 'The plugin can use your GitHub token (from settings) for authentication automatically!' });
		
		const gcmSteps = method1.createEl('ol');
		gcmSteps.createEl('li', { text: 'Make sure you\'ve entered your GitHub token in plugin settings' });
		gcmSteps.createEl('li', { text: 'The token should have "repo" scope' });
		gcmSteps.createEl('li', { text: 'Click "Retry" below - the plugin will use your token automatically' });
		
		const note = method1.createEl('p');
		note.style.marginTop = '10px';
		note.style.fontStyle = 'italic';
		note.textContent = 'Note: The token is embedded in the Git remote URL for authentication. This is secure and works without additional Git configuration.';

		// Method 2: Manual Token Entry
		const method2 = contentEl.createDiv({ cls: 'auth-method' });
		method2.style.padding = '15px';
		method2.style.marginBottom = '15px';
		method2.style.borderRadius = '5px';
		method2.style.backgroundColor = 'var(--background-secondary)';

		method2.createEl('h3', { text: '🔑 Alternative: Create New Token' });
		method2.createEl('p', { text: 'If you haven\'t created a GitHub token yet:' });
		
		const patSteps = method2.createEl('ol');
		const tokenStep = patSteps.createEl('li');
		tokenStep.createEl('span', { text: 'Go to: ' });
		const newTokenLink = tokenStep.createEl('a', { 
			text: 'https://github.com/settings/tokens',
			href: 'https://github.com/settings/tokens'
		});
		newTokenLink.style.color = 'var(--text-accent)';
		newTokenLink.style.textDecoration = 'underline';
		
		patSteps.createEl('li', { text: 'Click "Generate new token (classic)"' });
		patSteps.createEl('li', { text: 'Name: "Obsidian Vault Tracker", Scope: "repo"' });
		patSteps.createEl('li', { text: 'Copy the token and paste it in plugin settings (GitHub Token field)' });
		patSteps.createEl('li', { text: 'Click "Retry" below' });

		// Method 3: SSH Keys
		const method3 = contentEl.createDiv({ cls: 'auth-method' });
		method3.style.padding = '15px';
		method3.style.marginBottom = '15px';
		method3.style.borderRadius = '5px';
		method3.style.backgroundColor = 'var(--background-secondary)';

		method3.createEl('h3', { text: '🔐 Advanced: SSH Keys' });
		method3.createEl('p', { text: 'Use SSH keys for passwordless authentication.' });
		
		const sshLink = method3.createEl('a', { 
			text: 'GitHub SSH Setup Guide',
			href: 'https://docs.github.com/en/authentication/connecting-to-github-with-ssh'
		});
		sshLink.style.color = 'var(--text-accent)';
		sshLink.style.textDecoration = 'underline';

		method3.createEl('p', { text: 'Note: You\'ll need to update your repository URL to use SSH format.' });

		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';
		buttonContainer.style.marginTop = '20px';

		const closeButton = buttonContainer.createEl('button', { text: 'Close' });
		closeButton.addEventListener('click', () => {
			this.close();
		});

		const retryButton = buttonContainer.createEl('button', { 
			text: 'I\'ve Set Up Authentication - Retry',
			cls: 'mod-cta'
		});
		retryButton.addEventListener('click', () => {
			this.close();
			this.onRetry();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class GitSetupModal extends Modal {
	private message: string;
	private details: string;
	private onRetry: () => void;
	// eslint-disable-next-line sonarjs/prefer-readonly
	private showDownloadLink: boolean;

	constructor(app: App, message: string, details: string, onRetry: () => void, showDownloadLink: boolean = true) {
		super(app);
		this.message = message;
		this.details = details;
		this.onRetry = onRetry;
		this.showDownloadLink = showDownloadLink;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: '⚠️ Git Setup Required' });
		contentEl.createEl('p', { text: this.message });
		
		const detailsEl = contentEl.createDiv({ cls: 'git-setup-details' });
		detailsEl.style.backgroundColor = 'var(--background-secondary)';
		detailsEl.style.padding = '15px';
		detailsEl.style.borderRadius = '5px';
		detailsEl.style.marginTop = '15px';
		detailsEl.style.marginBottom = '15px';
		
		const detailsLines = this.details.split('\n');
		detailsLines.forEach(line => {
			detailsEl.createEl('p', { text: line, cls: 'git-setup-detail-line' });
		});

		if (this.showDownloadLink) {
			contentEl.createEl('h3', { text: 'How to Install Git' });
			
			const instructionsEl = contentEl.createDiv({ cls: 'git-install-instructions' });
			instructionsEl.createEl('p', { text: '1. Download Git for Windows from:' });
			
			const linkEl = instructionsEl.createEl('a', { 
				text: 'https://git-scm.com/download/win',
				href: 'https://git-scm.com/download/win'
			});
			linkEl.style.color = 'var(--text-accent)';
			linkEl.style.textDecoration = 'underline';
			
			instructionsEl.createEl('p', { text: '2. Run the installer with default options' });
			instructionsEl.createEl('p', { text: '3. Restart Obsidian after installation' });
			instructionsEl.createEl('p', { text: '4. Click "Retry" below to continue setup' });
		}

		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';
		buttonContainer.style.marginTop = '20px';

		const closeButton = buttonContainer.createEl('button', { text: 'Close' });
		closeButton.addEventListener('click', () => {
			this.close();
		});

		const retryButton = buttonContainer.createEl('button', { 
			text: 'Retry',
			cls: 'mod-cta'
		});
		retryButton.addEventListener('click', () => {
			this.close();
			this.onRetry();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class GitConfigModal extends Modal {
	private onConfirm: (name: string, email: string) => void;
	private currentName: string;
	private currentEmail: string;

	constructor(app: App, currentName: string, currentEmail: string, onConfirm: (name: string, email: string) => void) {
		super(app);
		this.currentName = currentName;
		this.currentEmail = currentEmail;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Configure Git Identity' });
		contentEl.createEl('p', { 
			text: 'Git needs to know your identity for commits. This information will be used in your commit history.' 
		});

		let nameInput: HTMLInputElement;
		let emailInput: HTMLInputElement;

		new Setting(contentEl)
			.setName('Your Name')
			.setDesc('Full name for Git commits')
			.addText(text => {
				nameInput = text.inputEl;
				text
					.setPlaceholder('John Doe')
					.setValue(this.currentName)
					.inputEl.style.width = '100%';
			});

		new Setting(contentEl)
			.setName('Your Email')
			.setDesc('Email address for Git commits')
			.addText(text => {
				emailInput = text.inputEl;
				text
					.setPlaceholder('john@example.com')
					.setValue(this.currentEmail)
					.inputEl.style.width = '100%';
			});

		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';
		buttonContainer.style.marginTop = '20px';

		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		const saveButton = buttonContainer.createEl('button', { 
			text: 'Save & Continue',
			cls: 'mod-cta'
		});
		saveButton.addEventListener('click', () => {
			const name = nameInput.value.trim();
			const email = emailInput.value.trim();
			
			if (!name || !email) {
				new Notice('❌ Please enter both name and email', 4000);
				return;
			}
			
			this.close();
			this.onConfirm(name, email);
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SystemRequirementsModal extends Modal {
	private requirements: Array<{ name: string; status: 'pass' | 'fail' | 'warning'; message: string }>;
	private onCloseCallback: () => void;

	constructor(app: App, requirements: Array<{ name: string; status: 'pass' | 'fail' | 'warning'; message: string }>, onCloseCallback: () => void) {
		super(app);
		this.requirements = requirements;
		this.onCloseCallback = onCloseCallback;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'System Requirements Check' });

		const requirementsEl = contentEl.createDiv({ cls: 'requirements-list' });
		requirementsEl.style.marginTop = '15px';
		requirementsEl.style.marginBottom = '15px';

		this.requirements.forEach(req => {
			const reqItem = requirementsEl.createDiv({ cls: 'requirement-item' });
			reqItem.style.padding = '10px';
			reqItem.style.marginBottom = '10px';
			reqItem.style.borderRadius = '5px';
			reqItem.style.backgroundColor = 'var(--background-secondary)';

			const statusIcon = req.status === 'pass' ? '✅' : req.status === 'fail' ? '❌' : '⚠️';
			const titleEl = reqItem.createEl('div');
			titleEl.style.fontWeight = 'bold';
			titleEl.style.marginBottom = '5px';
			titleEl.textContent = `${statusIcon} ${req.name}`;

			reqItem.createEl('div', { text: req.message, cls: 'requirement-message' });
		});

		const allPassed = this.requirements.every(r => r.status === 'pass');
		const anyFailed = this.requirements.some(r => r.status === 'fail');

		if (allPassed) {
			const successEl = contentEl.createDiv();
			successEl.style.padding = '15px';
			successEl.style.marginTop = '15px';
			successEl.style.borderRadius = '5px';
			successEl.style.backgroundColor = 'var(--background-modifier-success)';
			successEl.createEl('p', { text: '✅ All requirements met! You can proceed with Git setup.' });
		} else if (anyFailed) {
			const errorEl = contentEl.createDiv();
			errorEl.style.padding = '15px';
			errorEl.style.marginTop = '15px';
			errorEl.style.borderRadius = '5px';
			errorEl.style.backgroundColor = 'var(--background-modifier-error)';
			errorEl.createEl('p', { text: '❌ Some requirements are not met. Please address the issues above before proceeding.' });
		}

		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.marginTop = '20px';

		const closeButton = buttonContainer.createEl('button', { 
			text: 'Close',
			cls: 'mod-cta'
		});
		closeButton.addEventListener('click', () => {
			this.close();
			this.onCloseCallback();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class ConfirmPromotionModal extends Modal {
	private summary: ChangesSummary;
	private onConfirm: () => void;
	private onCancel: () => void;

	constructor(app: App, summary: ChangesSummary, onConfirm: () => void, onCancel: () => void) {
		super(app);
		this.summary = summary;
		this.onConfirm = onConfirm;
		this.onCancel = onCancel;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Add title
		contentEl.createEl('h2', { text: 'Confirm Promotion' });

		// Add description
		contentEl.createEl('p', { 
			text: 'The following changes will be promoted from the working vault to the production vault:' 
		});

		// Create summary section
		const summaryEl = contentEl.createDiv({ cls: 'promotion-summary' });

		// Display file counts
		const countsEl = summaryEl.createDiv({ cls: 'file-counts' });
		countsEl.createEl('p', { 
			text: `Files to add: ${this.summary.filesAdded}`,
			cls: 'file-count-item'
		});
		countsEl.createEl('p', { 
			text: `Files to modify: ${this.summary.filesModified}`,
			cls: 'file-count-item'
		});
		countsEl.createEl('p', { 
			text: `Files to delete: ${this.summary.filesDeleted}`,
			cls: 'file-count-item'
		});

		// Display file lists
		if (this.summary.addedFiles.length > 0) {
			summaryEl.createEl('h3', { text: 'Files to Add:' });
			const addedList = summaryEl.createEl('ul', { cls: 'file-list' });
			for (const file of this.summary.addedFiles) {
				addedList.createEl('li', { text: file });
			}
		}

		if (this.summary.modifiedFiles.length > 0) {
			summaryEl.createEl('h3', { text: 'Files to Modify:' });
			const modifiedList = summaryEl.createEl('ul', { cls: 'file-list' });
			for (const file of this.summary.modifiedFiles) {
				modifiedList.createEl('li', { text: file });
			}
		}

		if (this.summary.deletedFiles.length > 0) {
			summaryEl.createEl('h3', { text: 'Files to Delete:' });
			const deletedList = summaryEl.createEl('ul', { cls: 'file-list' });
			for (const file of this.summary.deletedFiles) {
				deletedList.createEl('li', { text: file });
			}
		}

		// Add button container
		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';
		buttonContainer.style.marginTop = '20px';

		// Add Cancel button
		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.addEventListener('click', () => {
			this.close();
			this.onCancel();
		});

		// Add Confirm button
		const confirmButton = buttonContainer.createEl('button', { 
			text: 'Confirm',
			cls: 'mod-cta'
		});
		confirmButton.addEventListener('click', () => {
			this.close();
			this.onConfirm();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export default class GitHubTrackerPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		console.log('Loading GitHub Tracker plugin');
		await this.loadSettings();
		this.addSettingTab(new GitHubTrackerSettingTab(this.app, this));
		this.registerCommands();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		console.log('Unloading GitHub Tracker plugin');
	}

	/**
	 * Register all command palette commands
	 */
	private registerCommands(): void {
		// Promote Changes command
		this.addCommand({
			id: 'promote-changes',
			name: 'Promote Changes',
			callback: async () => {
				await this.promoteChanges();
			}
		});

		// Generate Report command
		this.addCommand({
			id: 'generate-report',
			name: 'Generate Change Report',
			callback: async () => {
				await this.generateReport();
			}
		});

		// Diagnostic command to check Git status
		this.addCommand({
			id: 'check-git-status',
			name: 'Check Git Status (Diagnostic)',
			callback: async () => {
				await this.checkGitStatus();
			}
		});

		// System Requirements Check command
		this.addCommand({
			id: 'check-system-requirements',
			name: 'Check System Requirements',
			callback: async () => {
				await this.checkSystemRequirements();
			}
		});
	}

	/**
	 * Check system requirements for the plugin
	 */
	async checkSystemRequirements(): Promise<boolean> {
		const requirements: Array<{ name: string; status: 'pass' | 'fail' | 'warning'; message: string }> = [];

		// Check Git installation
		let gitInstalled = false;
		let gitPath = this.settings.customGitPath || 'git';
		const gitService = new GitService(this.settings.productionVaultPath || '.', this.settings.customGitPath, this.settings.gitUserName, this.settings.gitUserEmail);
		
		gitInstalled = await gitService.checkGitInstalled();
		
		if (!gitInstalled && process.platform === 'win32') {
			// Try to find Git on Windows
			const foundPath = await GitService.findGitOnWindows();
			if (foundPath) {
				gitInstalled = true;
				gitPath = foundPath;
				requirements.push({
					name: 'Git Installation',
					status: 'warning',
					message: `Git found at: ${foundPath}\nConsider adding this path to settings for better performance.`
				});
			}
		}
		
		if (!gitInstalled) {
			requirements.push({
				name: 'Git Installation',
				status: 'fail',
				message: 'Git is not installed or not in PATH. Download from: https://git-scm.com/download/win'
			});
		} else if (!this.settings.customGitPath) {
			requirements.push({
				name: 'Git Installation',
				status: 'pass',
				message: `Git is installed and accessible (${gitPath})`
			});
		} else {
			requirements.push({
				name: 'Git Installation',
				status: 'pass',
				message: `Using custom Git path: ${this.settings.customGitPath}`
			});
		}

		// Check Git configuration
		if (gitInstalled) {
			const gitConfig = await gitService.checkGitConfigured(this.settings.gitUserName, this.settings.gitUserEmail);
			if (gitConfig.configured) {
				const source = (this.settings.gitUserName && this.settings.gitUserEmail) ? 'from plugin settings' : 'from Git global config';
				requirements.push({
					name: 'Git Configuration',
					status: 'pass',
					message: `User: ${gitConfig.userName} <${gitConfig.userEmail}> (${source})`
				});
			} else {
				requirements.push({
					name: 'Git Configuration',
					status: 'fail',
					message: 'Git user name and email not configured. Configure in plugin settings or Git global config.'
				});
			}
		}

		// Check vault paths
		if (this.settings.workingVaultPath && existsSync(this.settings.workingVaultPath)) {
			requirements.push({
				name: 'Working Vault Path',
				status: 'pass',
				message: this.settings.workingVaultPath
			});
		} else if (this.settings.workingVaultPath) {
			requirements.push({
				name: 'Working Vault Path',
				status: 'fail',
				message: `Path does not exist: ${this.settings.workingVaultPath}`
			});
		} else {
			requirements.push({
				name: 'Working Vault Path',
				status: 'fail',
				message: 'Not configured'
			});
		}

		if (this.settings.productionVaultPath && existsSync(this.settings.productionVaultPath)) {
			requirements.push({
				name: 'Production Vault Path',
				status: 'pass',
				message: this.settings.productionVaultPath
			});
		} else if (this.settings.productionVaultPath) {
			requirements.push({
				name: 'Production Vault Path',
				status: 'fail',
				message: `Path does not exist: ${this.settings.productionVaultPath}`
			});
		} else {
			requirements.push({
				name: 'Production Vault Path',
				status: 'fail',
				message: 'Not configured'
			});
		}

		// Check GitHub token
		if (this.settings.githubToken) {
			requirements.push({
				name: 'GitHub Token',
				status: 'pass',
				message: 'Configured (validation recommended)'
			});
		} else {
			requirements.push({
				name: 'GitHub Token',
				status: 'fail',
				message: 'Not configured'
			});
		}

		// Check GitHub repo settings
		if (this.settings.githubRepoOwner && this.settings.githubRepoName) {
			requirements.push({
				name: 'GitHub Repository',
				status: 'pass',
				message: `${this.settings.githubRepoOwner}/${this.settings.githubRepoName}`
			});
		} else {
			requirements.push({
				name: 'GitHub Repository',
				status: 'fail',
				message: 'Owner or name not configured'
			});
		}

		// Show modal with results
		return new Promise<boolean>((resolve) => {
			new SystemRequirementsModal(this.app, requirements, () => {
				const allPassed = requirements.every(r => r.status === 'pass');
				resolve(allPassed);
			}).open();
		});
	}

	/**
	 * Diagnostic command to check Git status of both vaults
	 */
	private async checkGitStatus(): Promise<void> {
		const configValidation = this.validateConfiguration();
		if (!configValidation.valid) {
			new Notice(`❌ ${configValidation.error}`, 6000);
			return;
		}

		try {
			const workingGitService = new GitService(this.settings.workingVaultPath, this.settings.customGitPath, this.settings.gitUserName, this.settings.gitUserEmail);
			const prodGitService = new GitService(this.settings.productionVaultPath, this.settings.customGitPath, this.settings.gitUserName, this.settings.gitUserEmail);

			// Check working vault
			new Notice('🔍 Checking working vault...', 2000);
			const workingBranch = await workingGitService.executeGitCommand('git branch --show-current');
			const workingStatus = await workingGitService.executeGitCommand('git status --short');
			const workingLog = await workingGitService.executeGitCommand('git log -1 --oneline');
			
			// Count files in working vault
			const workingFiles = readdirSync(this.settings.workingVaultPath)
				.filter((f: string) => !f.startsWith('.'));

			// Check production vault
			new Notice('🔍 Checking production vault...', 2000);
			const prodBranch = await prodGitService.executeGitCommand('git branch --show-current');
			const prodStatus = await prodGitService.executeGitCommand('git status --short');
			const prodLog = await prodGitService.executeGitCommand('git log -1 --oneline');
			
			// Count files in production vault
			const prodFiles = readdirSync(this.settings.productionVaultPath)
				.filter((f: string) => !f.startsWith('.'));

			// Display results
			const message = `
**Working Vault:**
Branch: ${workingBranch.stdout.trim() || 'unknown'}
Files: ${workingFiles.length} items
Status: ${workingStatus.stdout.trim() || 'clean'}
Last commit: ${workingLog.stdout.trim() || 'none'}

**Production Vault:**
Branch: ${prodBranch.stdout.trim() || 'unknown'}
Files: ${prodFiles.length} items
Status: ${prodStatus.stdout.trim() || 'clean'}
Last commit: ${prodLog.stdout.trim() || 'none'}

**File Lists:**
Working: ${workingFiles.slice(0, 5).join(', ')}${workingFiles.length > 5 ? '...' : ''}
Production: ${prodFiles.slice(0, 5).join(', ')}${prodFiles.length > 5 ? '...' : ''}
			`.trim();

			new Notice(message, 20000);
			console.log('Git Status Check:', message);
			console.log('Working vault files:', workingFiles);
			console.log('Production vault files:', prodFiles);
		} catch (error: any) {
			new Notice(`❌ Failed to check Git status: ${error.message}`, 8000);
			console.error('Git status check error:', error);
		}
	}

	/**
	 * Validate plugin configuration
	 */
	private validateConfiguration(): { valid: boolean; error?: string } {
		const { workingVaultPath, productionVaultPath, githubToken, githubRepoOwner, githubRepoName } = this.settings;

		if (!workingVaultPath) {
			return { valid: false, error: 'Working vault path is not configured. Please check settings.' };
		}

		if (!productionVaultPath) {
			return { valid: false, error: 'Production vault path is not configured. Please check settings.' };
		}

		if (!existsSync(workingVaultPath)) {
			return { valid: false, error: `Working vault path does not exist: ${workingVaultPath}` };
		}

		if (!existsSync(productionVaultPath)) {
			return { valid: false, error: `Production vault path does not exist: ${productionVaultPath}` };
		}

		if (!githubToken) {
			return { valid: false, error: 'GitHub token is not configured. Please check settings.' };
		}

		if (!githubRepoOwner) {
			return { valid: false, error: 'GitHub repository owner is not configured. Please check settings.' };
		}

		if (!githubRepoName) {
			return { valid: false, error: 'GitHub repository name is not configured. Please check settings.' };
		}

		return { valid: true };
	}

	/**
	 * Compare Vaults command implementation
	 */
	private async compareVaults(): Promise<void> {
		// Validate configuration
		const configValidation = this.validateConfiguration();
		if (!configValidation.valid) {
			new Notice(`❌ ${configValidation.error}`, 6000);
			return;
		}

		try {
			new Notice('🔍 Comparing vaults...');

			// Initialize Git services
			const gitService = new GitService(this.settings.productionVaultPath, this.settings.customGitPath, this.settings.gitUserName, this.settings.gitUserEmail);
			const workingGitService = new GitService(this.settings.workingVaultPath, this.settings.customGitPath, this.settings.gitUserName, this.settings.gitUserEmail);

			// Check if working vault is a Git repository
			const isWorkingRepo = await workingGitService.isGitRepository();
			if (!isWorkingRepo) {
				new Notice('❌ Working vault is not a Git repository. Please run Git Setup first.', 8000);
				return;
			}

			// Check if production vault is a Git repository
			const isRepo = await gitService.isGitRepository();
			if (!isRepo) {
				new Notice('❌ Production vault is not a Git repository. Please run Git Setup first.', 8000);
				return;
			}

			// Commit any uncommitted changes in working vault to get accurate comparison
			new Notice('📁 Syncing working vault changes...');
			await workingGitService.executeGitCommand('git add -A');
			try {
				const timestamp = new Date().toLocaleString();
				await workingGitService.commit(`Auto-commit for comparison - ${timestamp}`);
			} catch (error: any) {
				// If nothing to commit, that's okay
				if (!error.message.includes('nothing to commit')) {
					throw error;
				}
			}

			// Push to remote to ensure comparison is accurate
			try {
				await workingGitService.executeGitCommand('git push origin working');
			} catch (error: any) {
				console.log('Push failed, using force-with-lease:', error.message);
				await workingGitService.executeGitCommand('git push origin working --force-with-lease');
			}

			// Get diff between working and production vaults
			const diffOutput = await gitService.diff(this.settings.workingVaultPath);

			// Parse diff to get file changes
			const changes = gitService.parseDiffOutput(diffOutput);

			// Display summary notification
			const totalFiles = changes.added.length + changes.modified.length + changes.deleted.length;
			if (totalFiles === 0) {
				new Notice('✓ No differences found between vaults', 5000);
			} else {
				new Notice(
					`✓ Found ${totalFiles} change${totalFiles === 1 ? '' : 's'}: ${changes.added.length} added, ${changes.modified.length} modified, ${changes.deleted.length} deleted`,
					8000
				);
			}
		} catch (error: any) {
			const errorMessage = error.message || 'Unknown error occurred';
			new Notice(`❌ Failed to compare vaults: ${errorMessage}`, 8000);
			console.error('Compare vaults error:', error);
		}
	}

	/**
	 * Promote Changes command implementation
	 */
	private async promoteChanges(): Promise<void> {
		// Validate configuration
		const configValidation = this.validateConfiguration();
		if (!configValidation.valid) {
			new Notice(`❌ ${configValidation.error}`, 6000);
			return;
		}

		try {
			new Notice('🔄 Preparing to promote changes...');

			// Initialize services
			const gitService = new GitService(this.settings.productionVaultPath, this.settings.customGitPath, this.settings.gitUserName, this.settings.gitUserEmail);
			const workingGitService = new GitService(this.settings.workingVaultPath, this.settings.customGitPath, this.settings.gitUserName, this.settings.gitUserEmail);
			const githubService = new GitHubService(
				this.settings.githubToken,
				this.settings.githubRepoOwner,
				this.settings.githubRepoName
			);
			const reportGenerator = new ReportGenerator(this.app);

			// Check Git installation
			const gitInstalled = await gitService.checkGitInstalled();
			if (!gitInstalled) {
				// Try to find Git on Windows
				if (process.platform === 'win32') {
					const foundPath = await GitService.findGitOnWindows();
					if (foundPath) {
						this.settings.customGitPath = foundPath;
						await this.saveSettings();
						new Notice(`✅ Found Git at: ${foundPath}. Retrying...`, 4000);
						// Retry with found path
						await this.promoteChanges();
						return;
					}
				}
				
				new GitSetupModal(
					this.app,
					'Git is not installed on your system.',
					'Git is required for this feature.\nPlease install Git and restart Obsidian, then try again.',
					() => this.promoteChanges(),
					true
				).open();
				return;
			}

			// Check if working vault is a Git repository
			const isWorkingRepo = await workingGitService.isGitRepository();
			if (!isWorkingRepo) {
				new Notice('❌ Working vault is not a Git repository. Please run Git Setup first.', 8000);
				return;
			}

			// Check if production vault is a Git repository
			const isRepo = await gitService.isGitRepository();
			if (!isRepo) {
				new Notice('❌ Production vault is not a Git repository. Please run Git Setup first.', 8000);
				return;
			}

			// IMPORTANT: Commit any uncommitted changes in working vault first
			// This ensures we're comparing the actual current state of files
			new Notice('📁 Checking for uncommitted changes in working vault...');
			await workingGitService.executeGitCommand('git add -A');
			try {
				const timestamp = new Date().toLocaleString();
				await workingGitService.commit(`Auto-commit before promotion - ${timestamp}`);
				new Notice('💾 Committed local changes in working vault');
			} catch (error: any) {
				// If nothing to commit, that's okay
				if (!error.message.includes('nothing to commit')) {
					throw error;
				}
			}

			// Push working branch to get latest state on remote
			new Notice('⬆️ Syncing working branch...');
			try {
				await workingGitService.executeGitCommand('git push origin working');
			} catch (error: any) {
				// If normal push fails, use force-with-lease
				console.log('Normal push failed, using force-with-lease:', error.message);
				await workingGitService.executeGitCommand('git push origin working --force-with-lease');
			}

			// Get diff to preview changes
			new Notice('📊 Analyzing changes...');
			const diffOutput = await gitService.diff(this.settings.workingVaultPath);
			const changes = gitService.parseDiffOutput(diffOutput);

			// Check if there are any changes
			const totalFiles = changes.added.length + changes.modified.length + changes.deleted.length;
			if (totalFiles === 0) {
				new Notice('ℹ️ No changes to promote', 5000);
				return;
			}

			// Prepare summary for confirmation modal
			const summary: ChangesSummary = {
				filesAdded: changes.added.length,
				filesModified: changes.modified.length,
				filesDeleted: changes.deleted.length,
				addedFiles: changes.added,
				modifiedFiles: changes.modified,
				deletedFiles: changes.deleted
			};

			// Show confirmation modal
			const confirmed = await new Promise<boolean>((resolve) => {
				new ConfirmPromotionModal(
					this.app,
					summary,
					() => resolve(true),
					() => resolve(false)
				).open();
			});

			if (!confirmed) {
				new Notice('ℹ️ Promotion cancelled', 4000);
				return;
			}

			new Notice('🚀 Promoting changes...');

			// Push working branch to GitHub to ensure it's up to date
			new Notice('⬆️ Pushing working branch to GitHub...');
			try {
				await workingGitService.executeGitCommand('git push origin working --force');
				new Notice('✓ Working branch updated on GitHub');
			} catch (error: any) {
				new Notice(`❌ Failed to push working branch: ${error.message}`, 8000);
				console.error('Push working error:', error);
				return;
			}

			// Force push working branch to main on GitHub (this maintains history while allowing major changes)
			new Notice('🔀 Promoting working branch to main on GitHub...');
			try {
				// Push working branch to main with force to handle unrelated histories
				await workingGitService.executeGitCommand('git push origin working:main --force');
				new Notice('✓ Changes promoted to main branch on GitHub');
			} catch (error: any) {
				new Notice(`❌ Failed to promote to main: ${error.message}`, 15000);
				console.error('Promote to main error:', error);
				return;
			}

			// Create a dummy PR info for the report (since we're not using PRs anymore)
			const prInfo: PullRequestInfo = {
				url: `https://github.com/${this.settings.githubRepoOwner}/${this.settings.githubRepoName}`,
				number: 0,
				title: `Promote changes - ${new Date().toLocaleDateString()}`,
				branch: 'main',
				createdAt: new Date().toISOString()
			};

			// Now update the local production vault by pulling from GitHub main
			new Notice('⬇️ Updating local production vault from GitHub main...');
			try {
				// Ensure production vault is on main branch
				await gitService.executeGitCommand('git checkout main');
				new Notice('✓ Checked out main branch');
				
				// Fetch latest from GitHub
				await gitService.executeGitCommand('git fetch origin main');
				new Notice('✓ Fetched latest from GitHub');
				
				// Count files before pull
				const beforeFiles = readdirSync(this.settings.productionVaultPath)
					.filter((f: string) => !f.startsWith('.'));
				new Notice(`📊 Production vault before: ${beforeFiles.length} files`);
				
				// Reset local main to match GitHub main exactly (hard reset)
				// This ensures local production vault matches GitHub exactly
				await gitService.executeGitCommand('git reset --hard origin/main');
				new Notice('✓ Updated production vault from GitHub main');
				
				// Count files after pull
				const afterFiles = readdirSync(this.settings.productionVaultPath)
					.filter((f: string) => !f.startsWith('.'));
				new Notice(`📊 Production vault after: ${afterFiles.length} files\nSample: ${afterFiles.slice(0, 5).join(', ')}`, 8000);
				
				new Notice(`✅ Production vault updated successfully!\n\n${afterFiles.length} files now in production vault`, 10000);
			} catch (error: any) {
				new Notice(`❌ Failed to update production vault: ${error.message}`, 15000);
				console.error('Production vault update error:', error);
				return;
			}

			// Generate and save change report
			new Notice('📝 Generating change report...');
			const reportContent = await reportGenerator.generateReport(diffOutput, prInfo);
			const reportFilename = await reportGenerator.saveReport(reportContent, this.settings.productionVaultPath);

			// Display success notification
			new Notice(`✅ Changes promoted successfully!\n\nPR #${prInfo.number} merged: ${prInfo.url}\nProduction vault updated\nReport saved: Update Logs/${reportFilename}`, 12000);
		} catch (error: any) {
			const errorMessage = error.message || 'Unknown error occurred';
			new Notice(`❌ Failed to promote changes: ${errorMessage}`, 10000);
			console.error('Promote changes error:', error);
		}
	}

	/**
	 * Generate Report command implementation
	 */
	private async generateReport(): Promise<void> {
		// Validate configuration
		const configValidation = this.validateConfiguration();
		if (!configValidation.valid) {
			new Notice(`❌ ${configValidation.error}`, 6000);
			return;
		}

		try {
			new Notice('📝 Generating change report...');

			// Initialize services
			const gitService = new GitService(this.settings.productionVaultPath, this.settings.customGitPath, this.settings.gitUserName, this.settings.gitUserEmail);
			const workingGitService = new GitService(this.settings.workingVaultPath, this.settings.customGitPath, this.settings.gitUserName, this.settings.gitUserEmail);
			const reportGenerator = new ReportGenerator(this.app);

			// Check if working vault is a Git repository
			const isWorkingRepo = await workingGitService.isGitRepository();
			if (!isWorkingRepo) {
				new Notice('❌ Working vault is not a Git repository. Please run Git Setup first.', 8000);
				return;
			}

			// Check if production vault is a Git repository
			const isRepo = await gitService.isGitRepository();
			if (!isRepo) {
				new Notice('❌ Production vault is not a Git repository. Please run Git Setup first.', 8000);
				return;
			}

			// Commit any uncommitted changes in working vault
			new Notice('📁 Syncing working vault changes...');
			await workingGitService.executeGitCommand('git add -A');
			try {
				const timestamp = new Date().toLocaleString();
				await workingGitService.commit(`Auto-commit for report - ${timestamp}`);
			} catch (error: any) {
				// If nothing to commit, that's okay
				if (!error.message.includes('nothing to commit')) {
					throw error;
				}
			}

			// Push to remote
			try {
				await workingGitService.executeGitCommand('git push origin working');
			} catch (error: any) {
				console.log('Push failed, using force-with-lease:', error.message);
				await workingGitService.executeGitCommand('git push origin working --force-with-lease');
			}

			// Get diff between working and main branches
			new Notice('📊 Analyzing changes between working and production branches...');
			const diffOutput = await gitService.diff(this.settings.workingVaultPath);

			// Create PR info for report
			const prInfo: PullRequestInfo = {
				url: `https://github.com/${this.settings.githubRepoOwner}/${this.settings.githubRepoName}/compare/main...working`,
				number: 0,
				title: 'Changes from Working to Production',
				branch: 'working',
				createdAt: new Date().toISOString()
			};

			// Generate and save report
			const reportContent = await reportGenerator.generateReport(diffOutput, prInfo);
			const reportFilename = await reportGenerator.saveReport(reportContent, this.settings.productionVaultPath);

			// Display success notification
			new Notice(`✅ Change report generated successfully!\n\nSaved to: Update Logs/${reportFilename}`, 8000);
		} catch (error: any) {
			const errorMessage = error.message || 'Unknown error occurred';
			new Notice(`❌ Failed to generate report: ${errorMessage}`, 8000);
			console.error('Generate report error:', error);
		}
	}


}

class GitHubTrackerSettingTab extends PluginSettingTab {
	plugin: GitHubTrackerPlugin;

	constructor(app: App, plugin: GitHubTrackerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'GitHub Tracker Settings' });

		// Working Vault Path
		new Setting(containerEl)
			.setName('Working Vault Path')
			.setDesc('Path to the working vault directory where the edit team modifies files')
			.addText(text => text
				.setPlaceholder('/path/to/working/vault')
				.setValue(this.plugin.settings.workingVaultPath)
				.onChange(async (value) => {
					this.plugin.settings.workingVaultPath = value;
					await this.plugin.saveSettings();
				}));

		// Production Vault Path
		new Setting(containerEl)
			.setName('Production Vault Path')
			.setDesc('Path to the production vault directory (must be a Git repository)')
			.addText(text => text
				.setPlaceholder('/path/to/production/vault')
				.setValue(this.plugin.settings.productionVaultPath)
				.onChange(async (value) => {
					this.plugin.settings.productionVaultPath = value;
					await this.plugin.saveSettings();
				}));

		// Validate Paths Button
		new Setting(containerEl)
			.setName('Validate Vault Paths')
			.setDesc('Check that both vault paths exist and are accessible')
			.addButton(button => button
				.setButtonText('Validate')
				.onClick(async () => {
					try {
						const result = this.validatePaths();
						if (result.valid) {
							new Notice('✅ Both vault paths are valid and accessible', 5000);
						} else {
							new Notice(`❌ Validation failed: ${result.error}`, 6000);
						}
					} catch (error: any) {
						new Notice(`❌ Validation error: ${error.message}`, 6000);
						console.error('Path validation error:', error);
					}
				}));

		// GitHub Token
		new Setting(containerEl)
			.setName('GitHub Personal Access Token')
			.setDesc('Token for authenticating with GitHub API (requires repo permissions)')
			.addText(text => {
				text.inputEl.type = 'password';
				text
					.setPlaceholder('ghp_xxxxxxxxxxxxxxxxxxxx')
					.setValue(this.plugin.settings.githubToken)
					.onChange(async (value) => {
						this.plugin.settings.githubToken = value;
						await this.plugin.saveSettings();
					});
			});

		// Validate GitHub Token Button
		new Setting(containerEl)
			.setName('Validate GitHub Token')
			.setDesc('Test your GitHub token to ensure it has the correct permissions')
			.addButton(button => button
				.setButtonText('Validate')
				.onClick(async () => {
					if (!this.plugin.settings.githubToken) {
						new Notice('❌ Please enter a GitHub token first', 5000);
						return;
					}
					if (!this.plugin.settings.githubRepoOwner || !this.plugin.settings.githubRepoName) {
						new Notice('❌ Please configure repository owner and name first', 5000);
						return;
					}

					try {
						new Notice('🔍 Validating GitHub token...');
						const githubService = new GitHubService(
							this.plugin.settings.githubToken,
							this.plugin.settings.githubRepoOwner,
							this.plugin.settings.githubRepoName
						);
						const result = await githubService.validateToken();
						
						if (result.valid) {
							new Notice('✅ GitHub token is valid and has correct permissions', 6000);
						} else {
							new Notice(`❌ Token validation failed: ${result.error}`, 8000);
						}
					} catch (error: any) {
						new Notice(`❌ Token validation error: ${error.message}`, 8000);
						console.error('GitHub token validation error:', error);
					}
				}));

		// GitHub Repository Owner
		new Setting(containerEl)
			.setName('GitHub Repository Owner')
			.setDesc('Username or organization that owns the repository')
			.addText(text => text
				.setPlaceholder('username')
				.setValue(this.plugin.settings.githubRepoOwner)
				.onChange(async (value) => {
					this.plugin.settings.githubRepoOwner = value;
					await this.plugin.saveSettings();
				}));

		// GitHub Repository Name
		new Setting(containerEl)
			.setName('GitHub Repository Name')
			.setDesc('Name of the repository tracking the production vault')
			.addText(text => text
				.setPlaceholder('my-vault-repo')
				.setValue(this.plugin.settings.githubRepoName)
				.onChange(async (value) => {
					this.plugin.settings.githubRepoName = value;
					await this.plugin.saveSettings();
				}));

		// Git Identity Settings
		containerEl.createEl('h3', { text: 'Git Identity' });
		containerEl.createEl('p', { 
			text: 'Configure your Git identity for commits. These settings will be used if Git global config is not set.',
			cls: 'setting-item-description'
		});

		// Git User Name
		new Setting(containerEl)
			.setName('Git User Name')
			.setDesc('Your name for Git commits (e.g., "John Doe") - Required for commits')
			.addText(text => {
				text
					.setPlaceholder('Your Name')
					.setValue(this.plugin.settings.gitUserName)
					.onChange(async (value) => {
						this.plugin.settings.gitUserName = value.trim();
						await this.plugin.saveSettings();
						
						// Show feedback
						if (value.trim()) {
							new Notice('✅ Git user name saved', 2000);
						}
					});
				text.inputEl.style.width = '300px';
			});

		// Git User Email
		new Setting(containerEl)
			.setName('Git User Email')
			.setDesc('Your email for Git commits (e.g., "john@example.com") - Required for commits')
			.addText(text => {
				text
					.setPlaceholder('your@email.com')
					.setValue(this.plugin.settings.gitUserEmail)
					.onChange(async (value) => {
						this.plugin.settings.gitUserEmail = value.trim();
						await this.plugin.saveSettings();
						
						// Show feedback
						if (value.trim()) {
							new Notice('✅ Git user email saved', 2000);
						}
					});
				text.inputEl.style.width = '300px';
			});

		// Validate Git Identity button
		new Setting(containerEl)
			.setName('Validate Git Identity')
			.setDesc('Test that your Git identity is configured correctly')
			.addButton(button => button
				.setButtonText('Validate')
				.onClick(async () => {
					const name = this.plugin.settings.gitUserName.trim();
					const email = this.plugin.settings.gitUserEmail.trim();
					
					if (!name || !email) {
						new Notice('❌ Please enter both Git user name and email', 5000);
						return;
					}
					
					// Basic email validation
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (!emailRegex.test(email)) {
						new Notice('⚠️ Email format looks invalid. Please check it.', 5000);
						return;
					}
					
					new Notice(`✅ Git identity looks good!\nName: ${name}\nEmail: ${email}`, 5000);
				}));

		// Advanced Settings
		containerEl.createEl('h3', { text: 'Advanced Settings' });

		// Custom Git Path
		new Setting(containerEl)
			.setName('Custom Git Path')
			.setDesc('Optional: Specify custom path to git.exe if not in system PATH')
			.addText(text => text
				.setPlaceholder('C:\\Program Files\\Git\\cmd\\git.exe')
				.setValue(this.plugin.settings.customGitPath)
				.onChange(async (value) => {
					this.plugin.settings.customGitPath = value;
					await this.plugin.saveSettings();
				}));

		// Auto-detect Git button
		new Setting(containerEl)
			.setName('Auto-detect Git')
			.setDesc('Automatically find Git installation on your system')
			.addButton(button => button
				.setButtonText('Detect')
				.onClick(async () => {
					new Notice('🔍 Searching for Git installation...');
					const gitPath = await GitService.findGitOnWindows();
					if (gitPath) {
						this.plugin.settings.customGitPath = gitPath;
						await this.plugin.saveSettings();
						new Notice(`✅ Found Git at: ${gitPath}`, 6000);
						this.display(); // Refresh settings display
					} else {
						new Notice('❌ Could not find Git installation. Please install Git or specify path manually.', 8000);
					}
				}));

		// System Requirements Check
		containerEl.createEl('h3', { text: 'System Requirements' });
		
		new Setting(containerEl)
			.setName('Check System Requirements')
			.setDesc('Verify that all prerequisites are met before setting up Git')
			.addButton(button => button
				.setButtonText('Check Requirements')
				.onClick(async () => {
					await this.plugin.checkSystemRequirements();
				}));

		// Git Setup Button
		containerEl.createEl('h3', { text: 'Git Repository Setup' });
		containerEl.createEl('p', { 
			text: 'Use this to automatically set up both vaults as Git repositories with the correct branches and remote configuration.',
			cls: 'setting-item-description'
		});

		new Setting(containerEl)
			.setName('Initialize Git Repositories')
			.setDesc('Set up production vault (main branch) and working vault (working branch) as Git repositories')
			.addButton(button => button
				.setButtonText('Git Setup')
				.setClass('mod-cta')
				.onClick(async () => {
					await this.performGitSetup();
				}));
	}

	validatePaths(): { valid: boolean; error?: string } {
		const { workingVaultPath, productionVaultPath } = this.plugin.settings;

		if (!workingVaultPath || !productionVaultPath) {
			return { valid: false, error: 'Both vault paths must be specified' };
		}

		if (!existsSync(workingVaultPath)) {
			return { valid: false, error: `Working vault path does not exist: ${workingVaultPath}` };
		}

		if (!existsSync(productionVaultPath)) {
			return { valid: false, error: `Production vault path does not exist: ${productionVaultPath}` };
		}

		return { valid: true };
	}

	async performGitSetup(): Promise<void> {
		const settings = this.plugin.settings;

		// Run system requirements check first
		new Notice('🔍 Checking system requirements...', 2000);
		const requirementsMet = await this.plugin.checkSystemRequirements();
		
		if (!requirementsMet) {
			new Notice('❌ Please address the system requirements before proceeding with Git setup', 6000);
			return;
		}

		// Check if Git is installed
		const gitService = new GitService(settings.productionVaultPath, settings.customGitPath, this.plugin.settings.gitUserName, this.plugin.settings.gitUserEmail);
		const gitInstalled = await gitService.checkGitInstalled();
		
		if (!gitInstalled) {
			// Try to find Git on Windows
			let foundPath: string | null = null;
			if (process.platform === 'win32') {
				new Notice('🔍 Git not found in PATH. Searching for Git installation...', 3000);
				foundPath = await GitService.findGitOnWindows();
			}
			
			if (foundPath) {
				// Found Git, ask user if they want to use it
				this.plugin.settings.customGitPath = foundPath;
				await this.plugin.saveSettings();
				new Notice(`✅ Found Git at: ${foundPath}`, 4000);
			} else {
				// Git not found, show installation modal
				new GitSetupModal(
					this.app,
					'Git is not installed on your system.',
					'Git is required for this plugin to work.\nPlease install Git and restart Obsidian, then try again.',
					() => this.performGitSetup(),
					true
				).open();
				return;
			}
		}

		// Check Git configuration (check plugin settings first, then global Git config)
		const gitConfig = await gitService.checkGitConfigured(this.plugin.settings.gitUserName, this.plugin.settings.gitUserEmail);
		if (!gitConfig.configured) {
			// Show Git configuration modal
			await new Promise<void>((resolve) => {
				new GitConfigModal(
					this.app,
					gitConfig.userName || this.plugin.settings.gitUserName || '',
					gitConfig.userEmail || this.plugin.settings.gitUserEmail || '',
					async (name: string, email: string) => {
						try {
							new Notice('⚙️ Saving Git identity to plugin settings...');
							// Save to plugin settings
							this.plugin.settings.gitUserName = name;
							this.plugin.settings.gitUserEmail = email;
							await this.plugin.saveSettings();
							
							// Also configure Git globally (optional, but helpful)
							try {
								await gitService.configureGit(name, email, true);
								new Notice('✅ Git identity saved to plugin settings and Git global config', 4000);
							} catch (error) {
								// If global config fails, that's okay - we have it in plugin settings
								new Notice('✅ Git identity saved to plugin settings', 4000);
							}
							resolve();
						} catch (error: any) {
							new Notice(`❌ Failed to save Git configuration: ${error.message}`, 6000);
							resolve();
						}
					}
				).open();
			});
			
			// Re-check configuration
			const recheckConfig = await gitService.checkGitConfigured(this.plugin.settings.gitUserName, this.plugin.settings.gitUserEmail);
			if (!recheckConfig.configured) {
				new Notice('❌ Git configuration is required to proceed', 6000);
				return;
			}
		}

		try {
			new Notice('🚀 Starting Git setup process...', 3000);

			// Construct remote URL with token if enabled
			let remoteUrl: string;
			if (this.plugin.settings.useTokenInUrl && this.plugin.settings.githubToken) {
				// Include token in URL for authentication
				remoteUrl = `https://${this.plugin.settings.githubToken}@github.com/${settings.githubRepoOwner}/${settings.githubRepoName}.git`;
				new Notice('ℹ️ Using GitHub token for authentication', 3000);
			} else {
				remoteUrl = `https://github.com/${settings.githubRepoOwner}/${settings.githubRepoName}.git`;
			}
			
			const prodGitService = new GitService(settings.productionVaultPath, this.plugin.settings.customGitPath, this.plugin.settings.gitUserName, this.plugin.settings.gitUserEmail);
			const workingGitService = new GitService(settings.workingVaultPath, this.plugin.settings.customGitPath, this.plugin.settings.gitUserName, this.plugin.settings.gitUserEmail);

			// STEP 1: Initialize WORKING vault first (this has the source content)
			new Notice('📦 Step 1/6: Initializing working vault with existing content...', 3000);
			const isWorkingRepo = await workingGitService.isGitRepository();
			if (!isWorkingRepo) {
				await workingGitService.executeGitCommand('git init');
				await workingGitService.executeGitCommand(`git remote add origin ${remoteUrl}`);
			} else {
				// If already a repo, make sure remote is correct
				try {
					await workingGitService.executeGitCommand(`git remote set-url origin ${remoteUrl}`);
				} catch (error) {
					await workingGitService.executeGitCommand(`git remote add origin ${remoteUrl}`);
				}
			}

			// Create .gitignore in working vault
			const workingGitignorePath = join(settings.workingVaultPath, '.gitignore');
			if (!existsSync(workingGitignorePath)) {
				const gitignoreContent = `.obsidian/\n.trash/\n.DS_Store\nUpdate Logs/\n`;
				writeFileSync(workingGitignorePath, gitignoreContent);
			}

			// STEP 2: Commit working vault content to working branch
			new Notice('📦 Step 2/6: Committing working vault content to working branch...', 3000);
			await workingGitService.executeGitCommand('git checkout -B working');
			
			// Configure Git identity locally before committing
			if (this.plugin.settings.gitUserName && this.plugin.settings.gitUserEmail) {
				await workingGitService.configureGit(this.plugin.settings.gitUserName, this.plugin.settings.gitUserEmail, false);
			}
			
			await workingGitService.executeGitCommand('git add -A');
			try {
				await workingGitService.executeGitCommand('git commit -m "Initial commit - Working vault content"');
			} catch (error: any) {
				if (!error.message.includes('nothing to commit')) {
					throw error;
				}
			}

			// STEP 3: Push working branch to GitHub (force push for initial setup)
			new Notice('📦 Step 3/6: Pushing working branch to GitHub...', 3000);
			try {
				// Always use force push during initial setup to handle any existing content
				await workingGitService.executeGitCommand('git push -u origin working --force');
			} catch (error: any) {
				const errorMsg = error.message || '';
				
				// Check for authentication errors
				const isAuthError = errorMsg.includes('Authentication failed') || 
				                    errorMsg.includes('could not read Username') ||
				                    errorMsg.includes('could not read Password') ||
				                    errorMsg.includes('bad credentials') ||
				                    errorMsg.includes('Invalid username or password');
				
				if (isAuthError && !this.plugin.settings.useTokenInUrl) {
					new GitAuthenticationModal(this.app, () => this.performGitSetup()).open();
					return;
				}
				
				// For any other error, throw with context
				throw new Error(`Failed to push working branch to GitHub: ${errorMsg}`);
			}

			// STEP 4: Initialize production vault
			new Notice('📦 Step 4/6: Initializing production vault...', 3000);
			const isProdRepo = await prodGitService.isGitRepository();
			if (!isProdRepo) {
				await prodGitService.executeGitCommand('git init');
				await prodGitService.executeGitCommand(`git remote add origin ${remoteUrl}`);
			} else {
				// If already a repo, make sure remote is correct
				try {
					await prodGitService.executeGitCommand(`git remote set-url origin ${remoteUrl}`);
				} catch (error) {
					await prodGitService.executeGitCommand(`git remote add origin ${remoteUrl}`);
				}
			}

			// Create .gitignore in production
			const prodGitignorePath = join(settings.productionVaultPath, '.gitignore');
			if (!existsSync(prodGitignorePath)) {
				const gitignoreContent = `.obsidian/\n.trash/\n.DS_Store\nUpdate Logs/\n`;
				writeFileSync(prodGitignorePath, gitignoreContent);
			}

			// STEP 5: Fetch working branch and create main from it (or create empty main)
			new Notice('📦 Step 5/6: Setting up production main branch...', 3000);
			try {
				// Try to fetch working branch
				await prodGitService.executeGitCommand('git fetch origin working');
				// Create main branch from working (this creates shared history)
				await prodGitService.executeGitCommand('git checkout -B main origin/working');
			} catch (error) {
				// If fetch fails, create main branch with current production content
				await prodGitService.executeGitCommand('git checkout -B main');
				
				// Configure Git identity locally before committing
				if (this.plugin.settings.gitUserName && this.plugin.settings.gitUserEmail) {
					await prodGitService.configureGit(this.plugin.settings.gitUserName, this.plugin.settings.gitUserEmail, false);
				}
				
				await prodGitService.executeGitCommand('git add -A');
				try {
					await prodGitService.executeGitCommand('git commit -m "Initial commit - Production vault"');
				} catch (commitError: any) {
					if (!commitError.message.includes('nothing to commit')) {
						throw commitError;
					}
				}
			}

			// STEP 6: Push main branch to GitHub (force push for initial setup)
			new Notice('📦 Step 6/6: Pushing main branch to GitHub...', 3000);
			try {
				// Always use force push during initial setup to handle any existing content
				await prodGitService.executeGitCommand('git push -u origin main --force');
			} catch (error: any) {
				const errorMsg = error.message || '';
				
				// Check for authentication errors
				const isAuthError = errorMsg.includes('Authentication failed') || 
				                    errorMsg.includes('could not read Username') ||
				                    errorMsg.includes('could not read Password') ||
				                    errorMsg.includes('bad credentials') ||
				                    errorMsg.includes('Invalid username or password');
				
				if (isAuthError && !this.plugin.settings.useTokenInUrl) {
					new GitAuthenticationModal(this.app, () => this.performGitSetup()).open();
					return;
				}
				
				// For any other error, throw with context
				throw new Error(`Failed to push main branch to GitHub: ${errorMsg}`);
			}

			new Notice('✅ Git setup complete! Working vault (working branch) and Production vault (main branch) are now connected to the same repository.', 8000);
		} catch (error: any) {
			new Notice(`❌ Git setup failed: ${error.message}`, 10000);
			console.error('Git setup error:', error);
		}
	}


}
