# Plugin Market Submission

Prepared on 2026-08-20 for the npm package `wali-dsh-plugin`.

## Basic metadata

- Package name: `wali-dsh-plugin`
- Latest version: `0.1.0`
- npm package: `https://www.npmjs.com/package/wali-dsh-plugin`
- Repository: `https://github.com/fuzhengwei/wali-dsh-plugin`
- License: `MIT`
- Author / maintainer: `fuzhengwei`
- Runtime type: `DSH web UI plugin`

## Short description

A desktop pet overlay for DSH that roams across the web UI and reacts to conversation context.

## Full description

`wali-dsh-plugin` adds a free-roaming desktop pet to the DSH web interface. The plugin injects a browser-side overlay through the DSH client plugin mechanism, floats above the full application UI, and reacts to conversation state with persona-based behavior.

It is packaged as a public npm module and can be installed without modifying the host source tree.

## Features

- Free-roaming desktop pet overlay across the full DSH web UI
- Conversation-aware status and persona reactions
- Zero host source modifications required
- Installable through the DSH plugin command
- Distributed as a public npm package

## Category suggestions

- UI Enhancement
- Productivity
- Personalization
- Companion / Fun

## Keywords

- `dsh`
- `dsh-plugin`
- `desktop-pet`
- `web-ui`
- `overlay`
- `persona`

## Installation

```bash
dsh plugin --profile <profile-name> add wali-dsh-plugin
```

## Uninstall

```bash
dsh plugin --profile <profile-name> remove wali-dsh-plugin
```

## Compatibility notes

- Requires a DSH runtime that supports `dsh plugin --profile ... add`
- Intended for DSH web profiles
- Depends on host compatibility with the peer dependencies declared in `package.json`

## Assets to prepare for market listing

If the market supports rich content, prepare these assets before submission:

- 1 plugin icon, ideally 512x512 PNG
- 1 cover image or banner
- 2 to 4 screenshots showing the pet in the DSH UI
- Optional short demo GIF

## Suggested screenshot captions

- Pet overlay floating across the DSH workspace
- Persona card reacting to conversation state
- Desktop companion visible without modifying host source code

## Copy-ready listing fields

### Name

WaLi Desktop Pet

### Slug / package id

`wali-dsh-plugin`

### One-line summary

A conversation-aware desktop pet overlay for the DSH web UI.

### Store description

WaLi Desktop Pet brings a free-roaming companion into the DSH web interface. It floats above the full UI, reacts to conversation context, and adds a lightweight, personality-driven layer to the workspace without requiring host source changes.

### Install command

```bash
dsh plugin --profile <profile-name> add wali-dsh-plugin
```

### Repository URL

`https://github.com/fuzhengwei/wali-dsh-plugin`

### npm URL

`https://www.npmjs.com/package/wali-dsh-plugin`

### Support URL

`https://github.com/fuzhengwei/wali-dsh-plugin/issues`

### License

`MIT`

## Example catalog entry

Use this as a starting point if the plugin market accepts JSON or YAML style catalog records.

```json
{
  "name": "WaLi Desktop Pet",
  "package": "wali-dsh-plugin",
  "version": "0.1.0",
  "summary": "A conversation-aware desktop pet overlay for the DSH web UI.",
  "description": "WaLi Desktop Pet brings a free-roaming companion into the DSH web interface. It floats above the full UI, reacts to conversation context, and adds a lightweight, personality-driven layer to the workspace without requiring host source changes.",
  "repository": "https://github.com/fuzhengwei/wali-dsh-plugin",
  "homepage": "https://github.com/fuzhengwei/wali-dsh-plugin#readme",
  "npm": "https://www.npmjs.com/package/wali-dsh-plugin",
  "issues": "https://github.com/fuzhengwei/wali-dsh-plugin/issues",
  "license": "MIT",
  "install": "dsh plugin --profile <profile-name> add wali-dsh-plugin",
  "uninstall": "dsh plugin --profile <profile-name> remove wali-dsh-plugin",
  "categories": ["UI Enhancement", "Productivity", "Personalization"],
  "keywords": ["dsh", "dsh-plugin", "desktop-pet", "web-ui", "overlay", "persona"]
}
```

## Submission checklist

- npm package is publicly available
- README is published and accurate
- Repository is public and accessible
- Support / issues URL is valid
- Screenshots are prepared
- Plugin icon is prepared
- Market-specific review form is completed
- Any required approval or moderation request is submitted

## Notes

- If the market has its own schema, reuse the values above and map them field by field.
- If the market requires a stable icon URL or screenshot URLs, upload assets to the GitHub repository or release attachments first.
