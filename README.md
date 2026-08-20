# wali-dsh-plugin

A DSH UI plugin that adds a free-roaming desktop pet overlay to the whole web interface.

## What this package provides

- A publishable npm package for DSH plugin installation
- A client-side overlay injected through `dsh.client`
- Automatic bundle patch registration via `cordis.patch.yml`
- Zero source-tree changes required in the host app

## Install

After this package is published to npm, end users can install it with one command:

```bash
dsh plugin --profile <profile-name> add wali-dsh-plugin
```

If the target environment already exposes a plugin market UI, the same npm package can be wired into that catalog for one-click installation.

## Uninstall

```bash
dsh plugin --profile <profile-name> remove wali-dsh-plugin
```

## Requirements

- A DSH runtime that supports `dsh plugin --profile ... add`
- A web profile with the client runtime packages available
- Compatible peer dependencies listed in `package.json`

## Local development

```bash
pnpm install
pnpm run bundle
```

## Publish to npm

### 1. Prepare the package

```bash
pnpm run bundle
npm login
```

### 2. Publish the package

```bash
npm publish --access public
```

### 3. Release an update later

```bash
npm version patch
npm publish --access public
```

Use `minor` or `major` instead of `patch` when the change level is higher.

## Make it available in a plugin market

There are two common distribution layers:

### Option A: npm only

This is the base path and the one this repository is already structured for.
Users install the package directly with the DSH plugin command.

### Option B: plugin market catalog

If your team or community maintains a plugin market/catalog, add this package entry there:

- package name: `wali-dsh-plugin`
- latest version: the published npm version
- repository: `https://github.com/fuzhengwei/wali-dsh-plugin`
- install command: `dsh plugin --profile <profile-name> add wali-dsh-plugin`
- uninstall command: `dsh plugin --profile <profile-name> remove wali-dsh-plugin`

That market layer is usually just a discoverability and one-click wrapper around the npm package.

## Package structure

- `package.json`: npm metadata, exports, DSH declarations
- `cordis.patch.yml`: bundle patch injected during plugin add
- `src/index.ts`: host-side plugin entry
- `src/client/*`: browser-side overlay implementation

## Notes for maintainers

- `prepublishOnly` rebuilds the package before publishing
- Only files listed in `files` are shipped to npm
- If you change the package name, update `cordis.patch.yml` so the inserted `name` stays identical to the published package name
