# NPM Publishing Instructions

Follow these steps to set up NPM publishing for the Magic Button State library:

## 1. Create an NPM Account

If you don't already have an NPM account:
1. Go to https://www.npmjs.com/signup
2. Create a new account

## 2. Generate an Access Token

1. Log in to your NPM account
2. Go to "Access Tokens" in your account settings (https://www.npmjs.com/settings/your-username/tokens)
3. Click "Generate New Token"
4. Select "Automation" token type
5. Copy the generated token (you will only see it once)

## 3. Add NPM Token to GitHub Secrets

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste the NPM token you generated
6. Click "Add secret"

## 4. Set Up Scoped Package (Optional)

If you want to use an organization scope:

1. Create an organization on NPM if you don't have one
   ```
   npm org create magicbutton
   ```

2. Ensure your package.json has the correct scoped name:
   ```json
   {
     "name": "@magicbutton/state",
     ...
   }
   ```

## 5. Publish Manually (First Time)

For the first publication, it's recommended to publish manually:

```bash
# Login to NPM
npm login

# Publish the package
npm publish --access public
```

## 6. Verify GitHub Actions Workflow

The CI workflow in this repository includes automatic publishing. Verify it works:

1. Make a small change to the code
2. Increment the version in package.json
3. Commit and push the changes
4. Check the "Actions" tab in GitHub to ensure the workflow runs
5. Verify the new version appears on NPM

## 7. Publishing New Versions

For future versions:

1. Update the code
2. Run tests: `npm test`
3. Update the version in package.json (following semantic versioning)
4. Update CHANGELOG.md with the changes
5. Commit and push to GitHub
6. The GitHub Actions workflow will automatically publish the new version

## 8. Package Documentation

Consider adding comprehensive documentation to your NPM package page:

1. Log in to npmjs.com
2. Navigate to your package page
3. Click "Edit package information" to update details
4. Add links to your documentation site, examples, and demos