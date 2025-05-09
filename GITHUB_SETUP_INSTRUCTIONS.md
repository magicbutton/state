# GitHub Repository Setup Instructions

After creating the repository and pushing the code, complete the following steps to configure your GitHub repository:

## Repository Settings

1. Go to your repository Settings (https://github.com/magicbutton/state/settings)

2. Set up branch protection rules:
   - Navigate to "Branches" → "Add rule"
   - Branch name pattern: `main`
   - Check "Require pull request reviews before merging"
   - Check "Require status checks to pass before merging"
   - Check "Require branches to be up to date before merging"
   - Save changes

3. Enable discussions:
   - Navigate to "General" → "Features"
   - Check "Discussions"
   - Save changes

4. Set up repository topics:
   - Navigate to "About" section on your repository homepage
   - Click the gear icon
   - Add topics: `typescript`, `react`, `state-management`, `distributed-systems`
   - Save changes

## GitHub Pages (Optional)

To set up documentation site:

1. Navigate to "Pages" in repository settings
2. Source: Deploy from a branch
3. Branch: `gh-pages` (you'll need to create this branch for documentation)
4. Folder: `/ (root)`
5. Save changes

## GitHub Actions

The CI workflow is already set up in `.github/workflows/ci.yml`. To enable it:

1. Navigate to "Actions" in your repository
2. Click "I understand my workflows, go ahead and enable them"

## Issue Templates and PR Templates

These are already set up in the repository:
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

## Adding Contributors

1. Navigate to "Settings" → "Collaborators and teams"
2. Click "Add people" or "Add teams"
3. Enter GitHub usernames or team names
4. Select appropriate permission level
5. Send invite