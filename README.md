# AutoCrop Plugin for PuryFi

[![PuryFi Compatible](https://img.shields.io/badge/PuryFi-Plugin_SDK-green.svg)](https://pury.fi)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

AutoCrop is an automated body part crop-harvesting and contextual replacement plugin for the PuryFi browser extension. The plugin intercepts media prior to final censoring, maintains a persistent storage pool of detected and categorized crops, and synthesizes contextual replacement patches directly over sensitive image regions.

---

## Features

- **Contextual Replacement:** Automatically harvests clean crops categorized by detected labels and blits appropriate replacements over censored regions.
- **Dedicated Censor Mode:** Registers as a native `autocrop` censor mode in the PuryFi extension popup.
- **Configurable Port Binding:** Configurable WebSocket server port via `config.json`, allowing concurrent execution alongside other PuryFi plugins without port collisions.
- **Persistent Storage Pool:** Supports in-memory or on-disk caching (`DISK` / `MEMORY`) of harvested crops with configurable pool sizes and resolution thresholds.
- **Customizable Interface Icon:** Supports custom 556x556 PNG button assets (`autocrop.png`) loaded automatically into the PuryFi user interface.

---

## System Requirements

- **Runtime:** Node.js 18.0.0 or higher
- **Package Manager:** npm
- **Host Application:** Firefox or Chromium with the PuryFi extension installed

---

## Installation and Build

### 1. Repository Clone
```bash
git clone https://github.com/Number0131/AutoCrop.git
cd AutoCrop
```

### 2. Dependency Installation
```bash
npm install
```

### 3. TypeScript Compilation
```bash
npm run build
```

---

## Service Execution

### Windows
Launch via batch script:
```bat
start.bat
```

### Command Line
```bash
npm start
```

By default, the server listens on `ws://localhost:8080`.

---

## Configuration Reference (`config.json`)

Runtime settings are persisted in `config.json` and `data/settings.json`:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | `8080` | Local WebSocket server port |
| `hookTimeout` | `number` | `10000` | Media hook processing timeout in milliseconds |
| `storageMode` | `string` | `"DISK"` | Storage backend for harvested crops (`DISK` or `MEMORY`) |
| `maxPoolSize` | `number` | `10000` | Maximum number of crops retained in the storage pool |
| `maxCropDimension` | `number` | `512` | Maximum crop dimension in pixels |
| `selectedBodyParts` | `array` | `[...]` | List of target detection classes eligible for harvesting |
| `videoConsistency` | `string` | `"TRACKING"` | Video stabilization mode (`TRACKING`, `PER_BODY_PART`, `OFF`) |

---

## Extension Integration

1. Access the PuryFi configuration interface (`about:addons` -> PuryFi -> Preferences / Options).
2. Open the **Plugins** section.
3. Select **Register New Plugin**:
   - **Connection Type:** `WebSocket` / `External`
   - **Endpoint URL:** `ws://localhost:8080`
4. Confirm registration and grant requested access intents.
5. Select the **AutoCrop** mode in the extension toolbar popup.

---

## Project Structure

```
AutoCrop/
|-- src/
|   `-- index.ts             # Main plugin implementation
|-- data/
|   |-- settings.json        # Persistent runtime settings
|   `-- crops/               # Harvested crop storage pool (git-ignored)
|-- config.json              # Port and primary configuration
|-- package.json             # Node dependencies and scripts
|-- tsconfig.json            # TypeScript compiler configuration
|-- start.bat                # Windows environment launcher
`-- .gitignore               # Repository exclusion definitions
```

---

## License

This project is licensed under the MIT License.
