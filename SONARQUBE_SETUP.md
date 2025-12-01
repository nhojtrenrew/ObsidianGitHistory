# SonarQube Setup and Configuration

## Overview

This project has been configured to suppress SonarQube warnings that don't apply to Obsidian plugin development. The warnings are intentional design choices and have been documented.

## Files Created

1. **sonar-project.properties** - Main SonarQube configuration file
2. **.sonarqube.json** - Alternative JSON-based configuration
3. **SONARQUBE_SUPPRESSIONS.md** - Detailed documentation of suppressed rules

## Current Status

### IDE Warnings (SonarLint)

The IDE (VS Code/Obsidian) will continue to show 88 SonarQube warnings because SonarLint doesn't automatically respect `sonar-project.properties` files. These warnings are:

- **9 warnings** about String.raw for backslash escaping (Windows paths)
- **7 warnings** about empty catch blocks (optional operations)
- **30+ warnings** about unused Notice instantiations (Obsidian side effects)
- **6 warnings** about cognitive complexity (necessary for Git operations)
- **15+ warnings** about readonly members (future flexibility)
- **Remaining warnings** about style preferences (negated conditions, ternaries, etc.)

### Server Analysis

When running SonarQube analysis on a server or in CI/CD, these warnings will be suppressed automatically using the `sonar-project.properties` configuration.

## How to Suppress IDE Warnings

### Option 1: Configure SonarLint Settings (Recommended)

1. Open VS Code Settings (Ctrl+,)
2. Search for "SonarLint"
3. Find "SonarLint: Rules"
4. Click "Edit in settings.json"
5. Add the following:

```json
{
  "sonarlint.rules": {
    "typescript:S7780": {
      "level": "off"
    },
    "typescript:S2486": {
      "level": "off"
    },
    "typescript:S1848": {
      "level": "off"
    },
    "typescript:S7735": {
      "level": "off"
    },
    "typescript:S4323": {
      "level": "off"
    },
    "typescript:S7773": {
      "level": "off"
    },
    "typescript:S3358": {
      "level": "off"
    },
    "typescript:S4165": {
      "level": "off"
    },
    "typescript:S1854": {
      "level": "off"
    },
    "typescript:S3776": {
      "level": "off"
    },
    "typescript:S2933": {
      "level": "off"
    },
    "typescript:S6594": {
      "level": "off"
    },
    "typescript:S1871": {
      "level": "off"
    },
    "typescript:S6535": {
      "level": "off"
    },
    "typescript:S7755": {
      "level": "off"
    },
    "typescript:S6582": {
      "level": "off"
    },
    "typescript:S6661": {
      "level": "off"
    }
  }
}
```

### Option 2: Disable SonarLint for This Project

Create `.vscode/settings.json` with:

```json
{
  "sonarlint.disableTelemetry": true,
  "sonarlint.rules": {
    "typescript:S7780": { "level": "off" },
    "typescript:S2486": { "level": "off" },
    "typescript:S1848": { "level": "off" },
    "typescript:S7735": { "level": "off" },
    "typescript:S4323": { "level": "off" },
    "typescript:S7773": { "level": "off" },
    "typescript:S3358": { "level": "off" },
    "typescript:S4165": { "level": "off" },
    "typescript:S1854": { "level": "off" },
    "typescript:S3776": { "level": "off" },
    "typescript:S2933": { "level": "off" },
    "typescript:S6594": { "level": "off" },
    "typescript:S1871": { "level": "off" },
    "typescript:S6535": { "level": "off" },
    "typescript:S7755": { "level": "off" },
    "typescript:S6582": { "level": "off" },
    "typescript:S6661": { "level": "off" }
  }
}
```

### Option 3: Ignore Warnings

Simply ignore the IDE warnings. They won't affect the build or functionality of the plugin.

## Running SonarQube Analysis

### Local Analysis

```bash
# Install SonarQube Scanner
npm install -g sonarqube-scanner

# Run analysis
sonar-scanner
```

### CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

## Verification

After configuration, verify that:

1. ✅ `sonar-project.properties` exists in project root
2. ✅ `SONARQUBE_SUPPRESSIONS.md` documents all suppressed rules
3. ✅ IDE warnings are either suppressed or documented as intentional
4. ✅ Server analysis respects the configuration

## Maintenance

When adding new code:

1. Review any new SonarQube warnings
2. Determine if they should be addressed or suppressed
3. Update `sonar-project.properties` if suppressing
4. Document the rationale in `SONARQUBE_SUPPRESSIONS.md`

## References

- [SonarQube Documentation](https://docs.sonarqube.org/)
- [SonarLint for VS Code](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode)
- [TypeScript Rules](https://rules.sonarsource.com/typescript/)
