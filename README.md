# wali-dsh-plugin

A DSH web UI plugin that adds a free-roaming desktop pet overlay to the full application interface.

## Overview

`wali-dsh-plugin` injects a browser-side companion into the DSH client runtime. The pet floats above the workspace, reacts to conversation context, and works without modifying the host source tree.

## Features

- Free-roaming pet overlay across the full DSH web UI
- Conversation-aware persona reactions and status display
- Installed as a standard DSH plugin package
- Published to npm for direct install or market catalog integration

## Install

Install from npm through the DSH plugin command:

```bash
dsh plugin --profile <profile-name> add wali-dsh-plugin
```

Example:

```bash
dsh plugin --profile web add wali-dsh-plugin
```

## Uninstall

```bash
dsh plugin --profile <profile-name> remove wali-dsh-plugin
```

## Package Links

- npm: `https://www.npmjs.com/package/wali-dsh-plugin`
- repository: `https://github.com/fuzhengwei/wali-dsh-plugin`
- issues: `https://github.com/fuzhengwei/wali-dsh-plugin/issues`

## Requirements

- A DSH runtime that supports `dsh plugin --profile ... add`
- A web profile with the client runtime packages available
- Peer dependency compatibility as declared in `package.json`

## Local Development

```bash
pnpm install
pnpm run bundle
```

For iterative development:

```bash
pnpm run watch
```

## Publish

The package is published as a public npm module.

Release a new version with:

```bash
npm version patch
npm publish --access public
```

Use `minor` or `major` when appropriate. The `prepublishOnly` script rebuilds the package before publishing.

## Market Integration

If you maintain a DSH plugin market or internal catalog, use the published npm package as the install target.

- package: `wali-dsh-plugin`
- install: `dsh plugin --profile <profile-name> add wali-dsh-plugin`
- uninstall: `dsh plugin --profile <profile-name> remove wali-dsh-plugin`

## Project Structure

- `package.json`: npm metadata, exports, DSH declarations
- `cordis.patch.yml`: bundle patch injected during plugin installation
- `src/index.ts`: host-side plugin entry
- `src/client/*`: browser-side overlay implementation

## Maintainer Notes

- Only files listed in `files` are published to npm
- If you change the package name, keep `cordis.patch.yml` aligned with the published package name
