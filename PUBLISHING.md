# Publishing Guide

This guide explains how to publish the MySQL MCP Server package to npm.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com)
2. **Login**: Run `npm login` in your terminal
3. **Git Repository**: Ensure your code is pushed to GitHub

## Publishing Steps

### 1. Update Package Information

Before publishing, make sure to update:
- Package name in `package.json` (currently `@ashenud/mcp-mysql-server`)
- Author information
- Repository URLs
- Version number (if needed)

### 2. Build the Package

```bash
npm run build
```

### 3. Test the Package

```bash
# Test locally
npm test

# Test the built package
node dist/index.js
```

### 4. Publish to npm

#### Option A: Use the provided script
```bash
./scripts/publish.sh
```

#### Option B: Manual publishing
```bash
# Check what will be published
npm pack --dry-run

# Publish to npm
npm publish --access public
```

### 5. Verify Publication

1. Check your package on npm: `https://www.npmjs.com/package/@ashenud/mcp-mysql-server`
2. Test installation: `npm install -g @ashenud/mcp-mysql-server`

## Post-Publication

1. **Create a GitHub Release**: Tag the version and create a release
2. **Update Documentation**: Ensure README and examples are up to date
3. **Monitor**: Watch for issues and user feedback

## Version Management

- **Patch** (1.0.1): Bug fixes
- **Minor** (1.1.0): New features, backward compatible
- **Major** (2.0.0): Breaking changes

Use `npm version` to update versions:
```bash
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0
```

## Troubleshooting

### Common Issues

1. **Package name already exists**: Change the name in `package.json`
2. **Authentication failed**: Run `npm login` again
3. **Build errors**: Fix TypeScript errors before publishing
4. **Permission denied**: Ensure you own the package or have publish rights

### Rollback

If you need to unpublish (only possible within 24 hours):
```bash
npm unpublish @ashenud/mcp-mysql-server@1.0.0
```

## Security

- Never commit sensitive information (passwords, API keys)
- Use environment variables for configuration
- Keep dependencies updated
- Review code before publishing
