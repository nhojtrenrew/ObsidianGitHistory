# Settings Page Summary

## Quick Reference

### Section 1: 📁 Obsidian Vault File Paths
```
Working Vault Path:     [C:\Users\...\WorkingVault    ] 
Production Vault Path:  [C:\Users\...\ProductionVault ]
                        [Validate Paths]
```
**Required:** Yes  
**Purpose:** Tell the plugin where your vaults are located

---

### Section 2: 🔗 GitHub Settings

#### Repository Configuration
```
Repository Owner:  [username-or-org]
Repository Name:   [my-vault-repo  ]
```

#### Authentication
```
Personal Access Token:  [••••••••••••••••••••]  (password field)
                        [Validate GitHub]
```
**Required:** Yes  
**Purpose:** Connect to GitHub for PR creation

#### Git Identity (Optional)
```
Git User Name:   [Your Name        ]
Git User Email:  [your@email.com   ]
                 [Validate Identity]
```
**Required:** No (fallback if Git not configured globally)  
**Purpose:** Set commit author info

---

### Section 3: ⚙️ Advanced Settings

#### Git Installation
```
Custom Git Path:  [C:\Program Files\Git\cmd\git.exe]
                  [Auto-detect]
```

#### System Diagnostics
```
[Run Diagnostics]
```
**Required:** No  
**Purpose:** Troubleshooting and custom Git locations

---

### Section 4: 🚀 Setup Wizard
```
[Run Setup Wizard]  (CTA button)
```
**Purpose:** Automated first-time setup

---

## Field Requirements

| Field | Required? | Why? |
|-------|-----------|------|
| Working Vault Path | ✅ Yes | Plugin needs to know where edits are made |
| Production Vault Path | ✅ Yes | Plugin needs to know where production files are |
| Repository Owner | ✅ Yes | Required for GitHub API calls |
| Repository Name | ✅ Yes | Required for GitHub API calls |
| GitHub Token | ✅ Yes | Required for GitHub authentication |
| Git User Name | ⚠️ Optional | Only if Git not configured globally |
| Git User Email | ⚠️ Optional | Only if Git not configured globally |
| Custom Git Path | ⚠️ Optional | Only if Git not in system PATH |

## Setup Checklist

- [ ] Enter working vault path
- [ ] Enter production vault path
- [ ] Click "Validate Paths"
- [ ] Enter GitHub repository owner
- [ ] Enter GitHub repository name
- [ ] Create and enter GitHub Personal Access Token
- [ ] Click "Validate GitHub"
- [ ] (Optional) Enter Git identity if not configured globally
- [ ] Click "Run Setup Wizard" to initialize repositories
- [ ] Click "Run Diagnostics" to verify everything works

## Common Issues

### "Git not found"
→ Use "Auto-detect" button or manually enter Git path in Advanced Settings

### "GitHub validation failed"
→ Check token has "repo" permissions at https://github.com/settings/tokens

### "Git identity not configured"
→ Either configure Git globally or enter name/email in Git Identity section

### "Vault path does not exist"
→ Verify paths are correct and folders exist on your system
