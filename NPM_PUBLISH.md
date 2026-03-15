# NPM Publish Guide for jwt-smith

This guide explains how to publish new versions of the `jwt-smith` package to npm using the automated GitHub Actions workflow.

## Prerequisites

Before publishing, ensure the following:

### 1. Repository Secrets

The following secrets must be configured in your GitHub repository settings:

- **`GH_PAT`**: A GitHub Personal Access Token with `repo` and `workflow` permissions
  - Used for creating branches, PRs, and merging
  - Must be from a user with admin access to the repository

- **`NPM_TOKEN`**: An npm access token with publish permissions
  - Generate from [npmjs.com](https://www.npmjs.com/settings/tokens)
  - Must have "Automation" or "Publish" scope

### 2. Local Development Setup

- Node.js versions 20, 22, 24, and 25 (tested in CI)
- All dependencies installed: `npm ci`
- Tests passing: `npm test`
- Build successful: `npm run build`
- Linting clean: `npm run lint:all`

### 3. Package Configuration

The `package.json` must include:

- `name`: "jwt-smith" (unscoped)
- `version`: Current version (managed by Changesets)
- `main`, `module`, `types`: Pointing to dist files
- `files`: ["dist"]
- `scripts`: build, test, lint scripts
- `keywords`: Relevant keywords for discoverability
- `author`: Author information
- `license`: Valid license
- `repository`: GitHub repository URL
- `bugs`: Issues URL
- `homepage`: Project homepage

### 4. Changesets Configuration

- `.changeset/config.json` configured with:
  - `access`: "public" (for unscoped packages)
  - `baseBranch`: "main"
  - `changelog`: "@changesets/cli/changelog"

## Publishing Process

### Step 1: Create a Changeset

Changesets track changes and determine version bumps. For each change:

```bash
npx changeset add
```

Select the type of change:

- **patch**: Bug fixes, small improvements
- **minor**: New features (backward compatible)
- **major**: Breaking changes

Describe the changes when prompted. This creates a `.md` file in `.changeset/`.

**Important**: Only unreleased changesets trigger version bumps. If no changesets exist, the workflow will skip versioning.

### Step 2: Commit and Push Changesets

```bash
git add .changeset/
git commit -m "Add changeset for [description]"
git push origin main
```

### Step 3: Run the Publish Workflow

1. Go to GitHub repository → Actions tab
2. Select "Publish to npm" workflow
3. Click "Run workflow"
4. The workflow will:
   - Test on multiple Node.js versions
   - Create a version bump PR
   - Auto-merge the PR
   - Publish to npm

## Workflow Details

### Jobs Overview

1. **check-requirements**: Validates the package works on Node.js 20, 22, 24, 25
2. **version-bump**: Creates version bump PR using Changesets
3. **publish**: Builds and publishes to npm

### Version Bumping

- Uses Changesets for semantic versioning
- Updates `package.json` version
- Updates `CHANGELOG.md`
- Commits changes to a temporary branch
- Creates and auto-merges a PR

### Publishing

- Builds the package (`npm run build`)
- Copies `CHANGELOG.md` to `dist/`
- Publishes to npm registry
- Uses `--access=restricted` for scoped packages (detected by `@` prefix)

## Good Practices

### Before Publishing

- ✅ Run full test suite locally
- ✅ Ensure build passes
- ✅ Verify linting is clean
- ✅ Update documentation if needed
- ✅ Check that all dependencies are production-ready

### Changeset Best Practices

- Use descriptive commit messages
- Group related changes in one changeset
- Use appropriate change types (patch/minor/major)
- Keep changesets small and focused

### Version Management

- Follow semantic versioning
- Use patch for bug fixes
- Use minor for new features
- Use major for breaking changes

### Security

- Never commit secrets to code
- Use GitHub secrets for tokens
- Regularly rotate access tokens
- Limit token permissions to minimum required

## Troubleshooting

### "No unreleased changesets found"

**Cause**: No changeset files in `.changeset/` directory

**Solution**:

```bash
npx changeset add
# Follow prompts to create changeset
```

### Workflow Fails on Tests/Build

**Cause**: Code issues or environment problems

**Solution**:

- Fix failing tests: `npm test`
- Fix build issues: `npm run build`
- Fix linting: `npm run lint:all`
- Test locally on multiple Node versions

### Publishing Fails

**Cause**: npm token issues or package configuration

**Solution**:

- Verify `NPM_TOKEN` secret is set and valid
- Check package.json for required fields
- Ensure version is not already published
- Verify `files` array includes built assets

### Permission Issues

**Cause**: GitHub token lacks permissions

**Solution**:

- Ensure `GH_PAT` has `repo` and `workflow` permissions
- Token must be from repository admin
- Check token hasn't expired

### Node.js Version Issues

**Cause**: Incompatibility with tested versions

**Solution**:

- Update `engines` in package.json
- Fix compatibility issues
- Test locally on affected versions

## Manual Publishing (Fallback)

If automated workflow fails, publish manually:

```bash
# Version bump (if needed)
npx changeset version

# Build
npm run build

# Publish
npm publish
```

## Monitoring

- Watch GitHub Actions for workflow status
- Check npmjs.com for published package
- Monitor for any publish notifications

## Support

For issues with publishing:

1. Check GitHub Actions logs
2. Verify all prerequisites
3. Test locally first
4. Check npm status: `npm ping`
5. Review package configuration

---

**Last updated**: March 2026
