# Contributing to Magic Button State

First off, thank you for considering contributing to Magic Button State! It's people like you that make this project such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [support@magicbutton.cloud](mailto:support@magicbutton.cloud).

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

**Before Submitting A Bug Report:**

* Check the [issues](https://github.com/magicbutton/state/issues) to see if the problem has already been reported.
* If you're unable to find an open issue addressing the problem, open a new one.

**How Do I Submit A Good Bug Report?**

Bugs are tracked as GitHub issues. Create an issue and provide the following information:

* Use a clear and descriptive title
* Describe the exact steps to reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots and animated GIFs if possible
* Include details about your environment (OS, browser, version, etc.)

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

**Before Submitting An Enhancement Suggestion:**

* Check the [issues](https://github.com/magicbutton/state/issues) to see if the enhancement has already been suggested.
* If you're unable to find an open issue suggesting the same enhancement, open a new one.

**How Do I Submit A Good Enhancement Suggestion?**

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide the following information:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Include screenshots and animated GIFs if applicable
* Explain why this enhancement would be useful to most users

### Pull Requests

The process described here has several goals:

- Maintain quality
- Fix problems that are important to users
- Engage the community in working toward the best possible implementation
- Enable a sustainable system for Magic Button State's maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Format your code with Prettier.
7. Issue that pull request!

## Development Setup

To get started with development:

1. Clone the repository:
   ```bash
   git clone https://github.com/magicbutton/state.git
   cd state
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the build in watch mode:
   ```bash
   npm run dev
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Style Guides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Consider starting the commit message with an applicable emoji:
    * 🎨 `:art:` when improving the format/structure of the code
    * 🐎 `:racehorse:` when improving performance
    * 🚱 `:non-potable_water:` when plugging memory leaks
    * 📝 `:memo:` when writing docs
    * 🐛 `:bug:` when fixing a bug
    * 🔥 `:fire:` when removing code or files
    * 💚 `:green_heart:` when fixing the CI build
    * ✅ `:white_check_mark:` when adding tests
    * 🔒 `:lock:` when dealing with security
    * ⬆️ `:arrow_up:` when upgrading dependencies
    * ⬇️ `:arrow_down:` when downgrading dependencies

### TypeScript Style Guide

* Use TypeScript's type system appropriately
* Prefer interfaces over type aliases
* Use explicit return types for functions
* Document your code with JSDoc comments
* Follow the [TypeScript coding guidelines](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)

### Documentation Style Guide

* Use [Markdown](https://guides.github.com/features/mastering-markdown/)
* Document all public APIs with JSDoc comments
* Provide examples for complex concepts
* Keep documentation up-to-date with code changes

## Final Note

Again, thank you for contributing! Your efforts to improve Magic Button State are greatly appreciated by the community.