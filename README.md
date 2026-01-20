# @ephys/configurable-md-directive

This is a monorepo containing forks of two npm packages for working with directives in markdown:

## Packages

- **[@ephys/micromark-extension-directive](./packages/micromark-extension-directive)** - micromark extension to support generic directives (`:cite[smith04]`)
- **[@ephys/remark-directive](./packages/remark-directive)** - remark plugin to support directives

## Installation

```bash
npm install @ephys/micromark-extension-directive
npm install @ephys/remark-directive
```

## Development

This is a monorepo using npm workspaces.

### Install dependencies

```bash
npm install
```

### Build all packages

```bash
npm run build
```

### Test all packages

```bash
npm run test
```

### Format code

```bash
npm run format
```

## Git History

This repository contains the merged git histories of:
- https://github.com/micromark/micromark-extension-directive
- https://github.com/remarkjs/remark-directive

## License

MIT - See individual package licenses for details.
