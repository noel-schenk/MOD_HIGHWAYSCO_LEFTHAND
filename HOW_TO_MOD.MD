# Highways & Co. — Complete Modding & API Reference

Highways & Co. (`apiVersion: 1`) exposes a rich runtime modding API covering road compilation hooks, Left-Hand Traffic (LHT) / Right-Hand Traffic (RHT) polarity, programmatic map editing, worker simulation & vehicle overrides, virtual loop detectors, 3D Three.js rendering, environment lighting, camera rigs, custom pointer tools, inspector extensions, HUD widgets, persistent per-map storage, and inter-mod services.

---

## Table of Contents

1. [Installation, Discovery & Packaging](#1-installation-discovery--packaging)
2. [Manifest Reference (`mod.json`)](#2-manifest-reference-modjson)
3. [Entry Point, Lifecycle & Auto-Disposal](#3-entry-point-lifecycle--auto-disposal)
4. [Left-Hand Traffic (LHT) & Drive-Side Support](#4-left-hand-traffic-lht--drive-side-support)
5. [Core Data Structures (`EditableMap`, `RoadNetwork`, `Vehicle`, `SimParams`)](#5-core-data-structures-editablemap-roadnetwork-vehicle-simparams)
6. [Complete API & Hook Reference (`api.*`)](#6-complete-api--hook-reference-api)
   - [Root, `api.env` & `api.hasCapability`](#root-apienv--apihascapability)
   - [`api.mod` — Identity, Logging, Settings & Conflicts](#apimod--identity-logging-settings--conflicts)
   - [`api.mods` — Registry, Shared Services & Inter-Mod Bus](#apimods--registry-shared-services--inter-mod-bus)
   - [`api.world` — Pipeline Hooks, Compiler, Graph, Raycast & Map CRUD](#apiworld--pipeline-hooks-compiler-graph-raycast--map-crud)
   - [`api.editor` — Transactions & Undo/Redo](#apieditor--transactions--undoredo)
   - [`api.sim` — Simulation, Vehicles, Routing, Signals, Loops & Lots](#apisim--simulation-vehicles-routing-signals-loops--lots)
   - [`api.render` — Depth-Tested 3D Objects & Environment](#apirender--depth-tested-3d-objects--environment)
   - [`api.camera` — Pose, Flight, Custom Rigs & Screenshots](#apicamera--pose-flight-custom-rigs--screenshots)
   - [`api.overlay` — 2D World/HUD Canvas & Stylesheets](#apioverlay--2d-worldhud-canvas--stylesheets)
   - [`api.ui` — HUD, Top Bar, Inspector, Map Views, Tooltips & Pointer Tools](#apiui--hud-top-bar-inspector-map-views-tooltips--pointer-tools)
   - [`api.input` — Keyboard, Pointer, Contexts, Keybinds & Gamepads](#apiinput--keyboard-pointer-contexts-keybinds--gamepads)
   - [`api.events` — Every Runtime & Simulation Event](#apievents--every-runtime--simulation-event)
   - [`api.storage`, `api.maps`, `api.assets`, `api.audio`, `api.io`, `api.economy`, `api.i18n`, `api.format`, `api.analytics`, `api.store`](#apistorage-apimaps-apiassets-apiaudio-apiio-apieconomy-apii18n-apiformat-apianalytics-apistore)
   - [Global Debug Handle (`window.HighwaysModAPI`)](#global-debug-handle-windowhighwaysmodapi)
7. [Cookbook: Extensive Working Examples](#7-cookbook-extensive-working-examples)

---

## 1. Installation, Discovery & Packaging

Mods can be distributed and loaded in two ways:

1. **GitHub Repositories (`MOD_HIGHWAYSCO_*`)**
   - Any public repository whose name begins with `MOD_HIGHWAYSCO_` (validated by `isValidModRepoName`, allowed characters: `[A-Za-z0-9._-]`) is discoverable in the in-game **Mods** browser or installable directly via `owner/MOD_HIGHWAYSCO_NAME` or `https://github.com/owner/MOD_HIGHWAYSCO_NAME`.
2. **Local Development Folder (Desktop / Electron)**
   - Click **Install from Folder...** in the **Mods** modal and point to your local mod directory containing `mod.json` and your script/assets.
   - Use **Reload** in the **Mods** modal after editing files on disk to cleanly run cleanup/disposers and re-execute `entry`.

### Folder Layout & Bundled Text Assets

```text
MOD_HIGHWAYSCO_MY_MOD/
├── mod.json            # Required manifest
├── index.js            # Entry script (or custom path set via "entry")
├── styles.css          # Optional stylesheet set via "styles"
├── presets/
│   └── grid.json       # Accessible via api.assets.readText('presets/grid.json')
└── shaders/
    └── custom.glsl     # Text assets automatically bundled
```

Bundled asset extensions read from local folders include `.json`, `.txt`, `.md`, `.css`, `.svg`, `.csv`, `.yaml`, `.yml`, `.glsl`, `.wgsl`, `.js`. Access them at runtime with `api.assets.list()`, `api.assets.readText(path)`, and `api.assets.toDataUrl(path, mime)`.

---

## 2. Manifest Reference (`mod.json`)

```json
{
  "id": "my-comprehensive-mod",
  "name": "My Comprehensive Mod",
  "version": "1.2.0",
  "author": "Jane Doe",
  "description": "Adds adaptive LHT support, signal priority, and 3D analytics.",
  "apiVersion": 1,
  "entry": "index.js",
  "styles": "styles.css",
  "tags": ["traffic", "signals", "lht"],
  "permissions": [
    "world",
    "sim",
    "vehicles",
    "render",
    "camera",
    "ui",
    "input",
    "events",
    "storage",
    "maps",
    "editor",
    "audio",
    "i18n",
    "mods"
  ],
  "minGameVersion": "0.48.0",
  "maxGameVersion": "1.99.0",
  "dependencies": ["some-base-library"],
  "optionalDependencies": ["other-enhancer"],
  "conflictsWith": ["incompatible-overhaul"],
  "settings": [
    {
      "key": "driveSide",
      "type": "select",
      "label": "Default Drive Side",
      "description": "Handedness applied when opening sandbox or custom levels.",
      "default": "lht",
      "options": [
        { "value": "rht", "label": "Right-Hand Traffic (RHT)" },
        { "value": "lht", "label": "Left-Hand Traffic (LHT)" }
      ]
    },
    {
      "key": "enablePriority",
      "type": "boolean",
      "label": "Enable Transit Signal Priority",
      "default": true
    },
    {
      "key": "maxSpeedMps",
      "type": "number",
      "label": "Emergency Speed Cap (m/s)",
      "default": 32,
      "min": 10,
      "max": 60,
      "step": 1
    },
    {
      "key": "badgePrefix",
      "type": "string",
      "label": "Custom HUD Tag",
      "default": "OPS"
    },
    {
      "key": "toggleKey",
      "type": "keybind",
      "label": "Toggle Dashboard Key",
      "default": "KeyM"
    }
  ],
  "homepage": "https://github.com/you/MOD_HIGHWAYSCO_MY_MOD",
  "repository": "https://github.com/you/MOD_HIGHWAYSCO_MY_MOD"
}
```

### Every `mod.json` Field

| Field | Type | Required | Behavior |
| --- | --- | --- | --- |
| `id` | `string` | Yes | Sanitized unique identifier (`sanitizeModId`). Used to scope storage keys, services, styles, and UI keys. |
| `name` | `string` | Yes | Human-readable title displayed in the Mods UI. |
| `version` | `string` | Recommended | Mod semantic version string. |
| `author` | `string` | Recommended | Author name displayed in the Mods UI. |
| `description` | `string` | Recommended | Summary displayed in search and installed mod cards. |
| `apiVersion` | `number` | Optional | Runtime constant is `1` (`MOD_API_VERSION`). |
| `entry` | `string` | Optional | Relative script path inside package (defaults to `'index.js'`). |
| `styles` | `string` | Optional | Relative CSS file path automatically injected via `api.overlay.addStyle(...)` on activation and removed on deactivation. |
| `tags` | `string[]` | Optional | Categorization tags. |
| `permissions` | `ModPermission[]` | Optional | Checked by `api.hasCapability(perm)`. If omitted or empty (`[]`), `hasCapability` returns `true` for all permissions. |
| `minGameVersion` | `string` | Optional | Semver lower bound compared against `api.env.gameVersion` (`BUILD_INFO.version`). Fails activation with a descriptive error if too old. |
| `maxGameVersion` | `string` | Optional | Semver upper bound compared against `api.env.gameVersion`. Fails activation if game version is newer. |
| `dependencies` | `string[]` | Optional | Topological sort loads listed mods first; if any required mod is missing or disabled, activation aborts with `Missing required dependency "<id>"`. |
| `optionalDependencies` | `string[]` | Optional | Loaded before your mod if present and enabled, without failing if absent. |
| `conflictsWith` | `string[]` | Optional | Surfaced as warnings in `ModsSnapshot.conflicts` (Mod Browser modal) and via `api.mod.getConflicts()`. |
| `settings` | `ModSettingSchemaItem[]` | Optional | Auto-generates native controls inside the in-game Mods Browser card and persists changes to `hnco.mod.<modId>.setting.<key>`. |
| `homepage`, `repository` | `string` | Optional | Informational links. |

### Valid `ModPermission` Values

```ts
type ModPermission =
  | 'world' | 'sim' | 'camera' | 'overlay' | 'render' | 'ui' | 'input'
  | 'storage' | 'network' | 'store' | 'events' | 'maps' | 'editor'
  | 'vehicles' | 'transit' | 'audio' | 'analytics' | 'io' | 'economy' | 'mods';
```

### `ModSettingSchemaItem` Reference

```ts
interface ModSettingSchemaItem {
  key: string;
  type: 'boolean' | 'number' | 'select' | 'string' | 'keybind';
  label: string;
  description?: string;
  default: boolean | number | string;
  min?: number;   // for type: 'number'
  max?: number;   // for type: 'number'
  step?: number;  // for type: 'number'
  options?: Array<{ value: string | number; label: string }>; // for type: 'select'
}
```

---

## 3. Entry Point, Lifecycle & Auto-Disposal

Mod scripts execute inside a function wrapper receiving `(api, module, exports)` with source URL `hnco-mod://<modId>/<entry>`.

Supported export forms (evaluated in this order):
1. Return a cleanup function directly from top-level code (if not using `module.exports`), e.g. `return () => { ... }`
2. `module.exports = function activate(api) { return () => { ... }; }`
3. `exports.activate = function (api) { return () => { ... }; }`
4. `exports.default = function (api) { return () => { ... }; }`

> **Note:** Your entry script runs synchronously as CommonJS-like code without top-level `import`/`export` ESM syntax. Use `module.exports = (api) => { ... }`. Asynchronous setup should use an `async` IIFE inside `activate(api)` while returning a synchronous cleanup function that flips an `active = false` guard.

### What Happens Automatically on Disable / Reload / Uninstall

When a mod is deactivated (`deactivateMod`), the runtime guarantees cleanup in reverse registration order:
- Invokes every disposer returned by `api.*` registrations (even if you did not store them manually).
- Invokes the cleanup function returned by `activate(api)`.
- Clears custom camera rig if registered by this mod (`setCustomRig(null)`).
- Releases input capture (`setModInputCapture({ keyboard: false, cameraKeys: false })`).
- Clears this mod's signal overrides and link overrides, then re-merges remaining active mods' overrides and pushes to the worker.
- Removes all 3D world meshes (`worldMeshes`) and vehicle highlight rings (`vehicleHighlights`) added by this mod from the Three.js scene.
- Removes this mod's overlay layers, `<style>` tags, HUD widgets, top-bar actions, inspector actions, inspector sections, map views (and active toggles), hover tooltips, pointer tools (clearing active pointer tool if owned by this mod), keybinds, level packs, `beforeVehicleSpawn` hooks, `sim` detectors (notifying worker), `simIntervals`, and registered `mods` services.

> **Exceptions & Error Isolation:** Listener callbacks (`events.on`, `mods.on`, HUD/inspector `render`, `hoverTooltip`, `pointerTool`, `beforeVehicleSpawn`, `detector`, `onSimInterval`, `keybind`) run inside `safeInvoke` / `try..catch` so a bug in one mod will log `[mod:<id>] ...` rather than crashing the engine or breaking other mods. If initial `activate(api)` throws synchronously, all partial disposers registered before the throw are immediately rolled back and the error message is shown in the Mods UI.

---

## 4. Left-Hand Traffic (LHT) & Drive-Side Support

Highways & Co. provides first-class handedness across all three engine layers **plus** low-level pipeline hooks if you want custom or mixed behavior.

### Option 1: Built-In `driveSide` (`'rht' | 'lht'`)

Calling `api.world.setDriveSide('lht', true)` (or setting `driveSide: 'lht'` on an `EditableMap` or `SimParams`):

1. **Road Compiler (`EditableMap` -> `RoadNetwork`)**
   - Flips two-way cross-sections so forward (`dir = 1`) lanes occupy the **left** (`-off`) and reverse (`dir = -1`) lanes occupy the **right** (`+off`), while keeping `laneIndex = 0` as the innermost/median lane and `count - 1` as the outermost/curb lane.
   - Mirrors equal-standing conflict angles from priority-to-the-right `(-2.97, -0.17)` rad to **priority-to-the-left** `(+0.17, +2.97)` rad, and sets LHT turn priorities (`through: 3 > left: 2 > right: 1 > uturn: 0`).
   - Defaults ramp kerb joins to `kerb: 'left'` and compiles roundabouts clockwise (`theta - Math.PI / 2`).
   - Mirrors two-way parking lot aisle stall sides (`left` vs `right`).
2. **Simulation Worker (`trafficEngine` & `worker.ts`)**
   - Automatically applies a left-keep bias (mirroring `keepRightBias` toward the outermost curb lane in LHT so slow vehicles keep left and overtaking uses the center lane).
   - Evaluates **Turn-On-Red** on `link.turn === 'left'` in LHT (or `link.turn === 'right'` in RHT, or overridden via `turnOnRed`).
   - Evaluates **opposing permissive turns** on `link.turn === 'right' || link.turn === 'uturn'` in LHT (or `left`/`uturn` in RHT, or overridden via `opposing`).
3. **3D Renderer (`worldBuild` & `worldWorker`)**
   - Places signal mast poles on the left curb (falling back to right only if colliding with road pavement).
   - Places two-way `STOP` and `GIVE WAY` sign posts on the left curb.
   - Mirrors two-way stop-bar trimming and median geometry to align with opposing traffic on the positive (`+`) offset side.

> **Persistence Note:** Calling `api.world.setDriveSide(side, recompileNow)` writes `this.modDriveSide = side`, `params.driveSide = side`, `params.curbSide = (side === 'lht' ? 'left' : 'right')`, sets `map.driveSide = side` when `recompileNow = true`, syncs both simulation worker and world geometry worker, invalidates compile caches, and rebuilds 3D meshes. Setting `setParams(...)` preserves active `modDriveSide` unless `driveSide` is explicitly passed in `patch`.

### Option 2: Pipeline Hooks & Explicit Polarity Flags

For partial LHT zones, custom intersection rules, procedural road conversion, or custom network post-processing:

- `api.world.beforeNetCompile((draftMap) => modifiedMap)` — receives a fresh clone of `EditableMap` right before compilation.
- `api.world.afterNetCompile((rt, map) => modifiedRt)` *(alias `registerNetworkTransform`)* — mutates `RoadNetwork` before cloning to the simulation worker and renderer.
- `api.world.setMap(map)`, `api.world.recompileNetwork()`, `api.world.pushNetworkToWorker(rt?)`, `api.world.rebuildWorldMeshes()` — manual full pipeline control.
- `api.sim.setParams({ driveSide, curbSide, turnOnRedDir, opposingTurnDir })`:
  - `driveSide`: `'rht' | 'lht'`
  - `curbSide`: `'left' | 'right'` (overrides signal pole & sign curb placement independently)
  - `turnOnRedDir`: `'left' | 'right' | 'none'`
  - `opposingTurnDir`: `'left' | 'right'`
- `api.world.setLinkOverrides(linkId, { turnOnRed, opposing })`:
  - Override permissive right/left-on-red or opposing-turn checks on individual connector links in real time without recompiling.

---

## 5. Core Data Structures (`EditableMap`, `RoadNetwork`, `Vehicle`, `SimParams`)

### `EditableMap` (Authoring Graph returned by `api.world.getMap()`)

```ts
{
  format: 'roads',
  version: number,
  driveSide?: 'rht' | 'lht',
  signalMode?: 'fixed' | 'actuated',
  nextId: number,
  strokes: Map<number, {
    id: number,
    cls: 'street' | 'avenue' | 'highway' | 'drive' | 'lot' | 'aisle' | 'rail',
    points: Array<{ x: number, y: number, z: number, dir: number, held?: boolean }>,
    sections: Array<{
      from: number,
      fwd: number,      // forward lane count
      back: number,     // reverse lane count (0 = one-way)
      shift?: number,
      median?: number,
      speed?: number,
      parking?: ...
    }>,
    flags?: Array<Record<string, unknown>>
  }>,
  joins: Array<{ stroke: number, end: 0 | 1, onto: number, at: number, on: unknown, turn?: unknown, kerb?: 'left' | 'right' }>,
  turns: Array<{ from: { seg: number, dir: 1 | -1, lane: number }, to: { seg: number, dir: 1 | -1, lane: number }, allowed: boolean }>,
  signs: Array<{ stroke: number, dir: 1 | -1, at: number, kind?: string }>,
  signals: Array<{
    stroke: number,
    dir: 1 | -1,
    at: number,
    plan?: {
      arms: Array<{ stroke: number, dir: number, at: number }>,
      exits: Array<{ stroke: number, dir: number, at: number }>,
      phases: Array<{ green: number[], go: Array<{ arm: number, to: number }> }>
    }
  }>,
  zones: Map<number, { id: number, ... }>,
  od: Array<{ from: number, to: number, rate: number, cars?: number }>
}
```

### `RoadNetwork` & `Link` (`api.world.getNetwork()`, `api.world.getLink(id)`)

```ts
// Link properties commonly read or overridden by mods:
{
  id: number,
  kind: 'lane' | 'conn',
  segId: number,
  dir: 1 | -1,
  laneIndex: number,      // 0 = innermost/median lane, count-1 = outermost/curb lane
  cls?: string,
  w?: number,             // width in meters (typically ~3.4m)
  speed: number,          // speed limit in m/s
  closed?: boolean,
  stopSign?: boolean,
  costMult?: number,      // routing cost multiplier (default 1)
  allowedClasses?: string[] | null,
  turnOnRed?: boolean,    // explicit per-link override
  opposing?: boolean,     // explicit per-link opposing permissive turn override
  turn?: 'through' | 'left' | 'right' | 'uturn',
  junction?: number,      // junction ID for connectors
  rail?: boolean,
  succ: number[],         // downstream link IDs
  poly: {
    pts: Float64Array,    // interleaved [x0, y0, x1, y1, ...]
    zs: Float64Array,     // per-vertex elevations
    cum: Float64Array,    // cumulative arc length in meters
    length: number
  }
}
```

### `Vehicle` (`api.sim.getVehicles()`, `api.sim.getVehicle(id)`)

```ts
{
  id: number,
  cls: number | string,   // built-in vehicle class index or custom registered id
  len: number,            // vehicle length in meters
  x: number, y: number, z: number,
  heading: number,        // radians
  rise: number,           // slope dz/ds
  link: number,           // current Link id
  s: number,              // distance along current link in meters
  v: number,              // speed in m/s
  acc: number,            // acceleration in m/s^2
  wait: number,           // seconds stopped below low-speed threshold
  odo: number,            // odometer in meters
  originZone: number,
  destZone: number,
  park?: boolean,
  train?: { cars: number },
  externalControl?: boolean,
  modMaxSpeed?: number,
  forcedLaneChange?: 'left' | 'right' | null,
  modHold?: boolean,
  tags?: Record<string, unknown>,
  hold: { why: string, by: number, waivable: boolean, at: number }
}
```

> Built-in vehicle classes include `'hatchback'`, `'sedan'`, `'estate'`, `'coupe'`, `'suv'`, `'sports'`, `'microcar'`, plus additional fleet classes and any types registered via `api.sim.registerVehicleType(...)`.

### `SimParams` (`api.sim.getParams()`, `api.sim.setParams(patch)`)

Defaults (`k0` / `pf`):
- **IDM / Car-Following**: `v0Mult: 1`, `T: 1.2`, `a: 1.5`, `b: 2`, `s0: 2`, `delta: 4`, `emergencyDecel: 9`, `reactionTime: 0.5`, `vehicleLength: 4.5`
- **Lane Changing**: `politeness: 0.3`, `changeThreshold: 0.2`, `bSafe: 4`, `keepRightBias: 0.08`, `laneChangeTime: 3.4`
- **Junctions & Deadlocks**: `junctionTGap: 1.6`, `junctionVisibility: 60`, `impatienceTime: 12`, `keepClear: true`, `blockerTimeout: 25`, `deadlockPatience: 3`, `missedExitTime: 30`
- **Collisions**: `collisions: true`, `restitution: 0.15`
- **Polarity**: `driveSide: 'rht' | 'lht'`, optional `curbSide?: 'left' | 'right'`, `turnOnRedDir?: 'left' | 'right' | 'none'`, `opposingTurnDir?: 'left' | 'right'`

---

## 6. Complete API & Hook Reference (`api.*`)

### Root, `api.env` & `api.hasCapability`

- `api.apiVersion: number` — Currently `1`.
- `api.hasCapability(perm: ModPermission): boolean` — Returns `true` if `manifest.permissions` is unset/empty or includes `perm`.
- `api.env`:
  ```ts
  {
    gameVersion: string, // e.g. "0.48.1"
    apiVersion: number,  // 1
    isDesktop: boolean,  // true in Electron desktop shell
    devMode: boolean,    // true in dev/telemetry dev builds
    platform: string     // navigator.platform
  }
  ```

---

### `api.mod` — Identity, Logging, Settings & Conflicts

- `api.mod.id: string`, `name: string`, `version: string`, `author: string`, `manifest: InstalledModRecord`
- `api.mod.log(...args)`, `api.mod.warn(...args)`, `api.mod.error(...args)` — Tagged `[mod:<id>]`.
- `api.mod.getSetting<T = unknown>(key: string, fallback?: T): T`
  - Reads saved JSON value from `localStorage` (`hnco.mod.<id>.setting.<key>`), falling back to the `default` in `manifest.settings`, then `fallback`.
- `api.mod.setSetting(key: string, value: unknown): void`
  - Persists JSON value, emits `'settingChange'` with `{ modId, key, value }`, and refreshes Mods UI.
- `api.mod.getSettingsSchema(): ModSettingSchemaItem[]`
- `api.mod.getConflicts(): Array<{ withModId: string; reason: string }>`
  - Checks both directions of `conflictsWith` among currently enabled mods.
- `api.mod.disableSelf(reason?: string): Promise<void>`
  - Records `reason` (shown as an error on the mod card) and disables the mod cleanly.

---

### `api.mods` — Registry, Shared Services & Inter-Mod Bus

- `api.mods.list(): InstalledModRecord[]`
- `api.mods.get(id: string): { record: InstalledModRecord; active: boolean } | null`
- `api.mods.isActive(id: string): boolean`
- `api.mods.registerService(name: string, service: unknown): () => void`
  - Publishes an arbitrary API object under `${modId}:${name}`. Automatically unregistered on mod unload.
- `api.mods.getService<T = unknown>(modId: string, name = 'default'): T | null`
- `api.mods.emit(channel: string, payload?: unknown): void`
- `api.mods.on(channel: string, handler: (payload: unknown, senderModId: string) => void): () => void`

---

### `api.world` — Pipeline Hooks, Compiler, Graph, Raycast & Map CRUD

#### Pipeline & Handedness
- `getNetwork(): RoadNetwork | null` — Compiled network (`engine.rt`).
- `getMap(): EditableMap | null` — Active editable map (`engine.map`).
- `setMap(map: EditableMap): RoadNetwork | null` — Replaces `engine.map` and immediately runs full recompilation.
- `recompileNetwork(): RoadNetwork | null` — Clears compile caches and compiles + installs `engine.map`.
- `pushNetworkToWorker(rt?: RoadNetwork): void` — Synchronizes an already-built/mutated `RoadNetwork` to the traffic worker, rebuilds world meshes, and fires `netChange` without re-running `EditableMap` compilation.
- `rebuildWorldMeshes(): void` — Cancels pending geometry jobs and schedules immediate `worldStage` / `worldWorker` mesh rebuild.
- `beforeNetCompile(fn: (draftMap: EditableMap) => EditableMap | void): () => void`
  - Hook invoked inside `recompile()` on a deep clone (`Gk(Vn(map))`) **before** compilation and cache lookup. Return a modified map object (with `.strokes`) or mutate `draftMap` in place. When any `beforeNetCompile` hook is registered, stale compile cache hits are bypassed automatically.
- `afterNetCompile(fn: (rt: RoadNetwork, map: EditableMap) => RoadNetwork | void): () => void`
  - Alias: `registerNetworkTransform(fn)`.
  - Hook invoked synchronously after `RoadNetwork` compilation (`Ed(...)`) and **before** caching/installing to the worker and renderer. Return a replacement `RoadNetwork` (must have `Array.isArray(rt.links)`) or mutate `rt` in place.
- `getDriveSide(): 'rht' | 'lht'`
- `setDriveSide(side: 'rht' | 'lht', recompileNow = true): void`
- `getScreen(): ScreenName` — `'title' | 'levels' | 'maps' | 'sandbox' | 'campaign' | 'editor' | ...`
- `getBounds()` — Current ground/world bounding extents (`engine.ground()`).
- `getLevelInfo(): { screen: ScreenName; id: string | null; name: string | null; editable: boolean }`

#### Queries, Geometry & Graph Algorithms
- `getLinks(): Link[]`, `getLink(linkId: number): Link | null`
- `getJunctions(): Junction[]`, `getJunction(junctionId: number): Junction | null`
- `getSignals(): Map<number, SignalPlan> | null`
- `sampleLink(linkId: number, s: number): ModLinkSample | null` — Binary-searches `poly.cum` to return `{ x, y, z, tx, ty, heading, rise }`.
- `findNearestLink(x: number, y: number, opts?: { kind?: 'lane' | 'conn' | 'any'; maxDist?: number; zHint?: number }): { link, s, distance, point, cls } | null`
  - Excludes rail links. When `zHint` is given, adds elevation discrepancy penalty (`|sample.z - zHint| * 2.5`) to disambiguate stacked overpasses/tunnels.
- `findNearestJunction(x: number, y: number, maxDist = Infinity): { junction, distance } | null`
- `sampleRoadSurface(x: number, y: number, zHint?: number): (ModLinkSample & { speedLimit: number; linkId: number; s: number; distance: number; cls: string }) | null`
- `getLinksInRect(x0: number, y0: number, x1: number, y1: number): Link[]`
- `getUpstreamLinks(linkId: number): Link[]`, `getDownstreamLinks(linkId: number): Link[]`
- `findPath(fromLinkId: number, toLinkId: number, opts?: { maxHops?: number; allowClosed?: boolean }): number[] | null`
  - Breadth-first shortest hop path across `link.succ` (defaults: `maxHops: 512`, `allowClosed: false`).
- `offsetPolyline(pts: Float64Array | number[], offset: number): Array<{ x: number; y: number }>`
  - Shifts an interleaved 2D polyline laterally by `offset` meters along the right-hand normal `(dy/len, -dx/len)`.
- `getLaneWidth(cls: string, oneWay = false): number`
- `getMedianWidth(cls: string, fwdLanes = 1, backLanes = 1, customMedian?: number): number`
- `findMergeConnectors(): ModMergeConnectorInfo[]`
  - Detects ramp/zipper/yield merge connectors feeding multi-incoming target lanes and returns feeder/target IDs plus stop position `(x, y, z, tx, ty, heading)`.

#### 3D Raycasting & Screen Projection
- `raycast(sx: number, sy: number): ModRaycastHit | null`
  - Tests the camera ray from viewport pixel `(sx, sy)` against live **vehicles**, **buildings**, **junctions**, **elevated/surface road links** (bridges, ramps, tunnels), and **ground terrain (`z = 0`)**, returning closest hit along the ray:
  ```ts
  {
    x: number, y: number, z: number,
    hitType: 'terrain' | 'road' | 'junction' | 'vehicle' | 'building',
    id?: number,     // vehicleId | buildingId | junctionId | segId
    linkId?: number, // present for 'vehicle' and 'road' hits
    s?: number,      // arc position along link for 'vehicle' and 'road'
    distance: number // distance from camera eye
  }
  ```
- `worldToScreen(x: number, y: number, z = 0): { x: number; y: number; depth: number }`
- `screenToWorld(sx: number, sy: number, planeZ = 0): { x: number; y: number; z: number } | null`

#### Dynamic Runtime Link Overrides (Zero Recompile)
Applied immediately to `rt.links[linkId]` and synchronized to the simulation worker (even across subsequent recompiles):
- `setLinkSpeed(linkId: number, speedMps: number)`
- `setLinkClosed(linkId: number, closed: boolean)`
- `setLinkStopSign(linkId: number, stopSign: boolean)`
- `setLinkCostMultiplier(linkId: number, mult: number)` — scales A* routing cost (`>= 0.01`)
- `setVehicleClassFilter(linkId: number, classes: string[] | null)` — only listed vehicle classes may enter (`null` clears)
- `setLinkOverrides(linkId: number, patch: ModLinkOverridePatch)`:
  ```ts
  {
    speed?: number,
    closed?: boolean,
    stopSign?: boolean,
    costMult?: number,
    allowedClasses?: string[] | null,
    turnOnRed?: boolean,
    opposing?: boolean
  }
  ```
- `clearLinkOverrides(linkId?: number)` — clears one link's overrides or all of this mod's overrides.

#### Programmatic `EditableMap` Authoring
Each mutation updates `engine.map` and automatically triggers `recompileNetwork()` (except `setOd`, which updates `engine.map.od` and pushes demand directly to the worker):
- `addStroke(spec): number | null` (assigns `spec.id ?? map.nextId++`)
- `updateStroke(strokeId: number, patch: Record<string, unknown>): boolean`
- `removeStroke(strokeId: number): boolean` (also cleans joins referencing `strokeId`)
- `addJoin(join): boolean`
- `addTurn(turn): boolean`
- `addSign(sign): boolean`
- `addSignal(signal): boolean`
- `addZone(zone): number | null` (assigns `zone.id ?? map.nextId++`)
- `removeZone(zoneId: number): boolean` (also strips OD pairs referencing `zoneId`)
- `setOd(od: Array<{ from: number; to: number; rate: number; cars?: number }>): void`

---

### `api.editor` — Transactions & Undo/Redo

- `api.editor.transact<T>(label: string, fn: (map: EditableMap | null) => T): T`
  - Captures a serialized snapshot before calling `fn(map)`. If `fn` succeeds, runs a single `recompileNetwork()` at the end (ideal for batching many strokes/joins/zones cleanly without intermediate recompiles). If `fn` throws, restores the pre-transaction state and rethrows.
- `api.editor.undo(): boolean`
- `api.editor.redo(): boolean`

---

### `api.sim` — Simulation, Vehicles, Routing, Signals, Loops & Lots

#### Execution, Speed & Determinism
- `isRunning(): boolean`, `setRunning(running: boolean): void`
- `getSpeed(): number`, `setSpeed(speed: number): void` (clamped `>= 0.25`)
- `step(ticks = 1): Promise<void>` — Advances deterministic worker simulation by `N` ticks (useful while paused).
- `reset(seed?: number): void` — Resets simulation state and emits `'levelReset'` `(seed)`.
- `getSeed(): number`, `setSeed(seed: number): void`
- `getTime(): number` — Elapsed simulation seconds.
- `getTick(): number` — Integer simulation tick counter.
- `onSimInterval(simSeconds: number, handler: (simTime: number, tick: number) => void): () => void`
  - Fires deterministically based on simulation time (minimum interval clamped to `0.05s`), automatically pausing when simulation is paused and accelerating at higher game speeds.
- `getParams()`, `setParams(patch)`

#### Vehicles, Spawning, Routing & Hooks
- `getVehicles(): Vehicle[]`, `getVehicle(id: number): Vehicle | null`
- `getVehiclesInRect(x0, y0, x1, y1): Vehicle[]`
- `getVehiclesOnLink(linkId: number): Vehicle[]`
- `countVehiclesNear(x: number, y: number, radius: number, opts?: { maxSpeed?: number; linkId?: number }): { count: number; stoppedCount: number; avgSpeed: number }`
- `getLinkTrafficStats(linkId: number): { count: number; stoppedCount: number; avgSpeed: number; occupancy: number; length: number } | null`
- `beforeVehicleSpawn(fn: (opts) => nextOpts | false | void): () => void`
  - Runs synchronously before `api.sim.spawnVehicle(opts)`. Return `false` to cancel spawning (`spawnVehicle` resolves `-1`), or return a modified options object.
- `spawnVehicle(opts): Promise<number>`
  ```ts
  {
    linkId: number,                 // required valid Link id
    s?: number,                     // start arc offset along link (default 1)
    v?: number,                     // initial speed (m/s)
    cls?: number | string,          // built-in class index or custom type id
    zoneFrom?: number,              // origin zone id
    zoneTo?: number,                // auto-routes to destination zone if route omitted
    route?: string[],               // explicit linkKey array
    maxSpeed?: number,              // per-vehicle speed cap (m/s)
    forcedLaneChange?: 'left' | 'right' | null,
    hold?: boolean,                 // forces vehicle to hold/stop
    tags?: Record<string, unknown>, // custom mod metadata
    externalControl?: boolean       // bypasses IDM/link-advance physics for external driving mods
  }
  ```
  Resolves new numeric `vehicleId` or `-1`.
- `despawnVehicle(id: number): Promise<boolean>` — Releases parking reservations, removes vehicle, emits `vehicleDespawn` with `{ reason: 'mod' }`.
- `setVehicleState(id: number, patch): Promise<boolean>`
  ```ts
  {
    linkId?: number, s?: number, v?: number,
    heading?: number, x?: number, y?: number, z?: number,
    externalControl?: boolean,
    cls?: number | string,
    tags?: Record<string, unknown> // merged into v.tags
  }
  ```
- `getVehicleRoute(id: number): Promise<string[] | null>`
- `setVehicleRoute(id: number, route: Array<number | string>): Promise<boolean>` — Accepts numeric `linkId[]` or string `linkKey[]`.
- `setVehicleDestination(id: number, zoneId: number): Promise<boolean>` — Computes A* route from current position to `zoneId` and replaces route.
- `setVehicleOverrides(id: number, patch: ModVehicleOverridePatch): Promise<boolean>`
  ```ts
  {
    maxSpeed?: number | null,                 // null clears speed limit override
    forcedLaneChange?: 'left' | 'right' | null,
    hold?: boolean,
    tags?: Record<string, unknown> | null     // null clears all tags
  }
  ```
- `registerVehicleType(spec): void`
  ```ts
  {
    id: string, len?: number, width?: number, weight?: number,
    accel?: number, speed?: number, headway?: number, mass?: number
  }
  ```

#### Traffic Signals, Detectors, Lots & Crossings
- `getSignalColor(connId: number): string | null`, `getSignalColors(): Record<number, string>`
- `getSignalPhase(junctionId: number): { phase: number, stage: 'green' | 'yellow' | 'allRed', t: number, plan: unknown } | null`
- `setSignalOverrides(overrides: Record<number, SignalOverrideColor> | Map<number, SignalOverrideColor>): void`
  - Valid colors: `'red' | 'green' | 'yellow' | 'stop' | 'permissive' | null`. Multi-mod overrides are merged automatically by `ModRuntime`.
- `clearSignalOverrides(): void`
- `setSignalPlan(junctionId: number, plan: { phases: Array<{ label?: string; green?: number[]; permissive?: number[]; minGreen?: number; maxGreen?: number; split?: number; yellow?: number; allRed?: number; demand?: number }> }): Promise<boolean>`
- `setSignalPhase(junctionId: number, phaseIdx: number, stage?: 'green' | 'yellow' | 'allRed'): Promise<boolean>`
  - Immediately jumps signal state to `phaseIdx` (`stage` defaults `'green'`) and emits `'signalPhaseChange'`.
- `addDetector(id: string, linkId: number, s: number, handler: (ev: { detectorId: string, vehicleId: number, linkId: number, v: number, cls: unknown, time: number }) => void): () => void`
  - Installs a zero-overhead inductive loop inside the worker simulation (`prevS <= det.s && nextS >= det.s`, or when entering `det.linkId`). Note: `ev.detectorId` is `${modId}:${id}`.
- `getLots(): any[]`, `setLotOverrides(lotId: number, patch: { closed?: boolean; fee?: number } | null): void`
- `getCrossings(): any[]`, `setCrossingOverride(crossingId: number, mode: 'auto' | 'open' | 'closed'): void`
- `getMetrics(): Record<string, unknown> | null` — Includes `{ spawned, arrived, impacts, diverted, stranded, ... }`.

---

### `api.render` — Depth-Tested 3D Objects & Environment

Unlike `api.overlay` (which draws flat 2D graphics on top of everything), `api.render` adds **depth-tested `THREE.Object3D` meshes** into the WebGL world scene so bridges, buildings, vehicles, and terrain properly occlude your overlays.

- `getScene(): THREE.Scene | null`
- `addWorldMesh(id: string, meshOrSpec, opts?: { live?: boolean }): () => void`
  - `meshOrSpec` can be an existing `THREE.Object3D` **or** a primitive spec:
    ```ts
    {
      kind: 'box' | 'cylinder' | 'sphere' | 'plane',
      x: number, y: number, z?: number,
      size?: [number, number, number], // box / plane
      radius?: number, height?: number, // cylinder / sphere
      color?: number | string,
      opacity?: number,
      rotZ?: number
    }
    ```
  - `opts.live` defaults `true` (automatically reattached if the renderer rebuilds world scenes).
- `removeWorldMesh(id: string): void`
- `drawWorldPolyline(id: string, points: Array<{ x: number; y: number; z?: number }>, opts?: { color?: number | string; opacity?: number; zOffset?: number }): () => void` (`zOffset` default `0.08`)
- `drawWorldMarker(id: string, pos: { x: number; y: number; z?: number }, opts?: { radius?: number; height?: number; color?: number | string; opacity?: number }): () => void` (vertical cylinder beacon)
- `placeProp(id: string, opts: { x: number; y: number; z?: number; rotZ?: number; size?: [number, number, number]; color?: number | string }): () => void` (`removeProp(id)`)
- `setLinkHighlight(id: string, linkId: number, opts?: { color?: number | string; width?: number; opacity?: number; zOffset?: number } | null): () => void` — Extrudes a ribbon following the link's exact 3D elevation profile (`pass null` to remove).
- `setVehicleHighlight(id: string, vehicleId: number, opts?: { color?: number | string; radius?: number; opacity?: number } | null): () => void` — Tracking 3D ground ring updated every simulation tick (`pass null` to remove).
- `getEnvironment(): { hour, sunAzimuth, sunElevation, cloudStrength, cloudScale, roadFriction } | null`
- `setEnvironment(patch: { hour?: number | null; sunAzimuth?: number; sunElevation?: number; sun?: null; cloudStrength?: number; cloudScale?: number; roadFriction?: number }): void`
  - `roadFriction` maps cleanly to `v0Mult` (clamped `0.1..2.0`); `hour: null` or `sun: null` clears manual sun/time overrides.

---

### `api.camera` — Pose, Flight, Custom Rigs & Screenshots

- `getPose(): { x: number; y: number; zoom: number; rot: number } | null`
- `setPose({ x, y, zoom?, rot? }): void`
- `easeTo(x, y, zoom?, durationMs = 450): void`
- `flyTo(x, y, zoom?, rot?, durationMs = 550): void`
- `getRig(): CameraRig | null`
- `setCustomRig(spec: ModCustomRigSpec | null): void`, `clearCustomRig(): void`
  ```ts
  {
    eye: { x: number; y: number; z: number },
    target: { x: number; y: number; z: number },
    up?: { x: number; y: number; z: number },
    fovDeg?: number,
    near?: number,
    far?: number,
    zoom?: number,
    hiddenVehicleId?: number | null // hides own car mesh for cockpit/FPV mods
  }
  ```
- `addRigModifier(fn: (rig) => nextRig): () => void`
  - Post-process hook invoked inside `engine.rigOf(camera)` right after computing the standard or custom camera rig. Ideal for camera shake, smoothed chase offsets, or FOV effects.
- `captureView(opts?: { type?: 'image/png' | 'image/jpeg' | 'image/webp'; quality?: number }): string | null`
- `worldToScreen(x, y, z = 0)`, `screenToWorld(sx, sy, planeZ = 0)`

---

### `api.overlay` — 2D World/HUD Canvas & Stylesheets

- `registerLayer(id: string, draw, opts?: { zIndex?: number }): () => void`
  - Registers a HiDPI-aware full-viewport 2D canvas callback drawn every `requestAnimationFrame` (suppressed automatically on `'title'`, `'levels'`, and `'maps'` menu screens):
  ```ts
  draw({
    ctx,           // CanvasRenderingContext2D (already scaled by DPR)
    width, height, // CSS viewport dimensions
    dtMs,          // frame delta in milliseconds (capped at 100ms)
    worldToScreen, // (x, y, z = 0) => { x, y, depth }
    screenToWorld, // (sx, sy, planeZ = 0) => { x, y, z } | null
    rig
  })
  ```
- `addStyle(css: string): () => void` — Injects `<style data-mod-style="<id>">` into `document.head`.

---

### `api.ui` — HUD, Top Bar, Inspector, Map Views, Tooltips & Pointer Tools

- `registerHudWidget({ id, position?, render })`
  - `position`: `'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom'` (default `'bottom-right'`).
  - `render(host: HTMLElement)`: populate `host` with DOM nodes. Call `api.ui.refreshUi()` whenever external state requires re-rendering the widget.
- `registerTopBarAction({ id, label, title?, icon?, isActive?, onClick })` — Adds a toggle/action button to the top toolbar.
- `registerMapView({ id, label, title?, onToggle?: (active: boolean) => void })` — Registers a persistent toggleable overlay view button in the top bar; active state is tracked per mod view.
- `registerInspectorAction(spec)`:
  ```ts
  {
    id: string,
    target: 'vehicle' | 'link' | 'junction' | 'zone' | 'lot' | 'signal' | 'stroke',
    label: string | ((selection: unknown) => string),
    title?: string,
    matches?: (selection: unknown) => boolean,
    isActive?: (selection: unknown) => boolean,
    onClick: (selection: unknown) => void
  }
  ```
- `registerInspectorSection(spec)`:
  ```ts
  {
    id: string,
    target: 'vehicle' | 'link' | 'junction' | 'zone' | 'lot' | 'signal' | 'stroke',
    title?: string | ((selection: unknown) => string),
    matches?: (selection: unknown) => boolean,
    render: (host: HTMLElement, selection: unknown) => void
  }
  ```
- `registerHoverTooltip(provide)`:
  - Called as pointer hovers over the canvas with `{ screenX, screenY, worldX, worldY, hit }`. Return `string`, `{ title?: string, lines: string[] }`, or `null`.
- `registerPointerTool({ id, label, cursor?, handler })`:
  - Registers a selectable tool button in the top bar. When active, pointer events route to `handler({ type: 'down' | 'move' | 'up' | 'right', x, y, z, shift, hit })`. Return `true` to consume the event and suppress the underlying built-in tool.
- `setActivePointerTool(id: string | null): void` — Activates your tool (`id`) or clears active mod pointer tool (`null`).
- `isPointerOverUi(): boolean` — Hit-tests cursor against DOM elements; `true` if hovering over UI rather than `<canvas>`.
- `refreshUi(): void` — Increments `uiRev`, re-rendering HUD widgets and inspector sections.
- `getSelection()`, `setSelection(selection)`, `getScreen()`, `setFocusMode(bool)`, `showToast(text, { icon?, bad? }?)`.

---

### `api.input` — Keyboard, Pointer, Contexts, Keybinds & Gamepads

- `isKeyDown(codeOrKey: string): boolean` — Matches `KeyboardEvent.code` (`'KeyW'`, `'Space'`) or lowercase `key` (`'w'`, `'shift'`). Ignores typing in `<input>`, `<textarea>`, `<select>`, and `contentEditable`.
- `onKeyDown(handler)`, `onKeyUp(handler)`, `onPointerDown(handler)`, `onPointerMove(handler)`, `onPointerUp(handler)`, `onWheel(handler)`
- `setCapture({ keyboard?: boolean; cameraKeys?: boolean })`, `clearCapture()`
  - When `keyboard: true`, suppresses built-in engine key shortcuts (except `Escape`); when `cameraKeys: true`, disables built-in WASD/arrow camera panning so a mod can drive a vehicle or custom cursor.
- `pushContext(name: string): void`, `popContext(name?: string): void`, `getContextStack(): string[]`
  - Scopes stack entries as `${modId}:${name}` so multiple mods can coordinate modal states (`api.input.getContextStack()`).
- `registerKeybind({ id, label, defaultKey, handler }): () => void`
  - Reads rebound key from setting `keybind.<id>` (falling back to `defaultKey`), editable directly in the Mods Browser settings or via `api.mod.setSetting('keybind.' + id, ...)`.
- `getGamepads(): Gamepad[]`

---

### `api.events` — Every Runtime & Simulation Event

Subscribe with `api.events.on(event, handler)` (all auto-cleaned on mod unload):

| Event Name | Listener Signature & Payload |
| --- | --- |
| `'frame'` | `(dtMs: number)` — Every engine render frame. |
| `'tick'` | `(tick: number, simTime: number)` — Each new simulation tick snapshot received from worker. |
| `'netChange'` | `(rt: RoadNetwork)` — Fired after `RoadNetwork` recompilation or `pushNetworkToWorker()`. |
| `'vehicleSpawn'` | `({ type: 'vehicleSpawn', vehicleId, linkId, originZone, destZone, cls, time })` |
| `'vehicleArrive'` | `({ type: 'vehicleArrive', vehicleId, linkId, originZone, destZone, tripTime, time })` |
| `'vehicleDespawn'` | `({ type: 'vehicleDespawn', vehicleId, linkId, time, reason: 'mod' \| 'diverted' \| 'stranded' })` |
| `'vehicleImpact'` | `({ type: 'vehicleImpact', a, b, time })` — Fired when collision solver records vehicle-to-vehicle contact. |
| `'vehicleJammed'` | `({ type: 'vehicleJammed', vehicleId, linkId, wait, time })` |
| `'signalPhaseChange'` | `({ type: 'signalPhaseChange', nodeId, phase, stage, time })` |
| `'mapSaved'` | `()` — Fired on sandbox autosave write or JSON save export. |
| `'levelReset'` | `(seed?: number)` — Fired on `api.sim.reset(seed)`. |
| `'screenChange'` | `(screen: ScreenName, prevScreen: ScreenName)` |
| `'selectionChange'` | `(selection: unknown, prevSelection: unknown)` |
| `'simPause'` | `(running: false)` |
| `'simResume'` | `(running: true)` |
| `'simSpeedChange'` | `(speed: number, prevSpeed: number)` |
| `'settingChange'` | `({ modId: string, key: string, value: unknown })` |
| `'beforeUnload'` | `()` — Window `beforeunload`. |

---

### `api.storage`, `api.maps`, `api.assets`, `api.audio`, `api.io`, `api.economy`, `api.i18n`, `api.format`, `api.analytics`, `api.store`

- **`api.storage`**
  - `get<T>(key, fallback?)`, `set(key, value)`, `remove(key)` — Global mod-scoped JSON `localStorage` (`hnco.mod.<modId>.<key>`).
  - `forMap(mapId?)` — Returns `{ get, set, remove }` scoped to `mapId` (defaults to current campaign level ID, editor draft ID, or active screen name).
- **`api.maps`**
  - `exportJson(): string`, `importJson(jsonOrObj: string | Record<string, unknown>): boolean`
  - `beforeSave(fn: (doc) => nextDoc | void): () => void` — Hook runs inside `engine.serialize()`, letting mods attach metadata (`doc.myModData = ...`) before save/export.
  - `afterLoad(fn: (doc) => void): () => void` — Hook runs after `loadSave(doc)` or `loadScenario(doc)`.
  - `registerLevelPack(pack: { id: string; title: string; levels: any[] }): () => void`, `getLevelPacks()`
- **`api.assets`**
  - `list(): string[]`, `readText(path: string): string | null`, `toDataUrl(path: string, mime = 'text/plain'): string | null`
- **`api.audio`**
  - `registerSound(id: string, urlOrDataUrl: string): () => void`
  - `play(id: string, opts?: { volume?: number; rate?: number; loop?: boolean }): { stop: () => void } | null`
- **`api.io`**
  - `exportText(filename: string, text: string, mime = 'application/json'): void` — Triggers browser/desktop download.
  - `importFile(accept = '.json,.txt'): Promise<{ name: string; text: string } | null>` — Opens file picker.
- **`api.economy`**
  - `quoteEditCost(): number`, `getBudget(): { cost: number; limit: number | null }`
- **`api.i18n`**
  - `translate(key: string, params?: Record<string, unknown>): string`
  - `getLanguage(): string`
  - `addTranslations(lang: string, entries: Record<string, string>): void`
- **`api.format`**
  - `speedMps(mps: number): string`, `number(value: number, fractionDigits = 0): string`
- **`api.analytics`**
  - `getMetrics()`, `getRecentEvents()`, `trackEvent(name, props?)`
- **`api.store`**
  - Direct Zustand store bridge: `getState()`, `setState(patch)`, `subscribe((state, prev) => void)`.

---

### Global Debug Handle (`window.HighwaysModAPI`)

Available in DevTools console for live inspection:
```js
HighwaysModAPI.apiVersion        // 1
HighwaysModAPI.getInstalledMods() // InstalledModRecord[]
HighwaysModAPI.runtime           // ModRuntime singleton
```

---

## 7. Cookbook: Extensive Working Examples

### Example 1 — Complete Left-Hand Traffic (LHT) Mod (`MOD_HIGHWAYSCO_LEFTHAND`)

Supports per-map LHT/RHT persistence, declarative Mods UI dropdown, instant top-bar toggle, and save embedding.

**`mod.json`**
```json
{
  "id": "lefthand-traffic",
  "name": "Left-Hand Traffic (LHT)",
  "version": "1.0.0",
  "author": "Highways Modder",
  "description": "Flips road lanes, signals, roundabouts, priority-to-the-left, and worker driving physics.",
  "apiVersion": 1,
  "entry": "index.js",
  "permissions": ["world", "sim", "ui", "events", "storage", "maps"],
  "settings": [
    {
      "key": "defaultSide",
      "type": "select",
      "label": "Default Drive Side",
      "default": "lht",
      "options": [
        { "value": "lht", "label": "Left-Hand Traffic (LHT)" },
        { "value": "rht", "label": "Right-Hand Traffic (RHT)" }
      ]
    }
  ]
}
```

**`index.js`**
```js
module.exports = function activate(api) {
  const getDesiredSide = () => {
    const mapStore = api.storage.forMap();
    return mapStore.get('driveSide', api.mod.getSetting('defaultSide', 'lht'));
  };

  const applySide = (side) => {
    if (api.world.getScreen() === 'title') return;
    if (api.world.getDriveSide() !== side) {
      api.world.setDriveSide(side, true);
      api.ui.showToast(`Traffic switched to ${side.toUpperCase()}`, { icon: 'compass' });
    }
  };

  // Apply when entering a level/sandbox or after compile
  applySide(getDesiredSide());
  const offScreen = api.events.on('screenChange', (screen) => {
    if (screen === 'sandbox' || screen === 'campaign' || screen === 'editor') {
      applySide(getDesiredSide());
    }
  });
  const offSetting = api.events.on('settingChange', ({ modId, key, value }) => {
    if (modId === api.mod.id && key === 'defaultSide') {
      api.storage.forMap().set('driveSide', value);
      applySide(value);
    }
  });

  // Top-bar quick switcher per map
  const offBtn = api.ui.registerTopBarAction({
    id: 'toggle-drive-side',
    label: 'LHT / RHT',
    title: 'Toggle Left-Hand vs Right-Hand Traffic for this map',
    isActive: () => api.world.getDriveSide() === 'lht',
    onClick: () => {
      const next = api.world.getDriveSide() === 'lht' ? 'rht' : 'lht';
      api.storage.forMap().set('driveSide', next);
      applySide(next);
    },
  });

  // Persist LHT metadata inside exported JSON saves too
  const offBeforeSave = api.maps.beforeSave((doc) => {
    doc.lhtMod = { driveSide: api.world.getDriveSide() };
  });
  const offAfterLoad = api.maps.afterLoad((doc) => {
    const saved = doc?.lhtMod?.driveSide ?? doc?.network?.driveSide;
    if (saved === 'lht' || saved === 'rht') {
      api.storage.forMap().set('driveSide', saved);
      applySide(saved);
    }
  });

  return () => {
    offScreen();
    offSetting();
    offBtn();
    offBeforeSave();
    offAfterLoad();
    api.world.setDriveSide('rht', true);
  };
};
```

---

### Example 2 — Custom Compiler Hooks & Mixed Polarity Rules (`beforeNetCompile` + `afterNetCompile`)

Automatically grants Turn-On-Red on gentle highway slip connectors and increases express lane speed before compilation, without modifying the user's saved `EditableMap`.

```js
module.exports = function activate(api) {
  // 1. Pre-compile hook on a cloned EditableMap
  const offBefore = api.world.beforeNetCompile((draftMap) => {
    for (const stroke of draftMap.strokes.values()) {
      if (stroke.cls === 'avenue') {
        for (const sec of stroke.sections) {
          sec.speed = Math.max(sec.speed || 16.7, 20); // boost avenues to ~72 km/h
        }
      }
    }
    return draftMap;
  });

  // 2. Post-compile hook on RoadNetwork before sending to worker & 3D builder
  const offAfter = api.world.afterNetCompile((rt) => {
    for (const link of rt.links) {
      if (link.kind === 'conn' && (link.turn === 'right' || link.turn === 'left')) {
        // Explicit per-link override evaluated by worker signals
        link.turnOnRed = true;
      }
    }
    return rt;
  });

  // Trigger a clean recompile so hooks take effect immediately
  api.world.recompileNetwork();

  return () => {
    offBefore();
    offAfter();
    api.world.recompileNetwork();
  };
};
```

---

### Example 3 — Procedural Boulevard Grid Generator (`editor.transact` + Map CRUD)

Adds a toolbar button that builds a connected grid of two-way streets + OD demand inside a single atomic transaction (undoable with one Ctrl/Cmd+Z).

```js
module.exports = function activate(api) {
  const buildMiniGrid = (cx, cy, spacing = 90) => {
    api.editor.transact('Generate 2x2 Grid', (map) => {
      if (!map) return;

      const makeStroke = (p0, p1, cls = 'street') => {
        const id = map.nextId++;
        map.strokes.set(id, {
          id,
          cls,
          points: [
            { x: p0.x, y: p0.y, z: 0, dir: 1 },
            { x: p1.x, y: p1.y, z: 0, dir: 1 },
          ],
          sections: [{ from: 0, fwd: 1, back: 1 }],
        });
        return id;
      };

      const h1 = makeStroke({ x: cx - spacing, y: cy - spacing * 0.5 }, { x: cx + spacing, y: cy - spacing * 0.5 }, 'avenue');
      const h2 = makeStroke({ x: cx - spacing, y: cy + spacing * 0.5 }, { x: cx + spacing, y: cy + spacing * 0.5 }, 'avenue');
      const v1 = makeStroke({ x: cx - spacing * 0.5, y: cy - spacing }, { x: cx - spacing * 0.5, y: cy + spacing }, 'street');
      const v2 = makeStroke({ x: cx + spacing * 0.5, y: cy - spacing }, { x: cx + spacing * 0.5, y: cy + spacing }, 'street');

      // Attach zone endpoints at left and right edges if needed
      api.mod.log('Generated grid strokes:', h1, h2, v1, v2);
    });
    api.ui.showToast('Generated procedural 2x2 boulevard grid');
  };

  return api.ui.registerTopBarAction({
    id: 'gen-grid',
    label: '+Grid',
    title: 'Generate a 2x2 road grid near camera center',
    onClick: () => {
      const pose = api.camera.getPose() || { x: 0, y: 0 };
      buildMiniGrid(pose.x, pose.y);
    },
  });
};
```

---

### Example 4 — Interactive Roadworks / Lane Closure & Variable Speed Tool (with 3D Cones & Raycasting)

Uses `registerPointerTool`, `api.world.raycast` (works accurately on bridges and ramps), dynamic link overrides (`setLinkClosed` / `setLinkSpeed` / `setVehicleClassFilter`), and depth-tested `render.placeProp` cones.

```js
module.exports = function activate(api) {
  const closedLinks = new Set();

  const toggleLaneClosure = (linkId) => {
    const link = api.world.getLink(linkId);
    if (!link) return;

    if (closedLinks.has(linkId)) {
      closedLinks.delete(linkId);
      api.world.clearLinkOverrides(linkId);
      api.render.removeProp(`cone-start-${linkId}`);
      api.render.setLinkHighlight(`work-${linkId}`, linkId, null);
      api.ui.showToast(`Reopened lane #${linkId}`);
    } else {
      closedLinks.add(linkId);
      api.world.setLinkOverrides(linkId, {
        closed: true,
        costMult: 100, // Discourage upstream routing onto closed lane
      });
      const mid = api.world.sampleLink(linkId, (link.poly?.length || 2) * 0.5);
      if (mid) {
        api.render.placeProp(`cone-start-${linkId}`, {
          x: mid.x, y: mid.y, z: mid.z,
          size: [1.2, 1.2, 1.4],
          color: '#f97316',
        });
      }
      api.render.setLinkHighlight(`work-${linkId}`, linkId, {
        color: '#ef4444',
        opacity: 0.45,
      });
      api.ui.showToast(`Closed lane #${linkId} with 3D barrier`);
    }
  };

  // Register custom clickable tool in top bar
  const offTool = api.ui.registerPointerTool({
    id: 'roadworks-tool',
    label: 'Roadworks',
    cursor: 'crosshair',
    handler: (ev) => {
      if (ev.type !== 'down') return false;
      if (ev.hit?.hitType === 'road' && ev.hit.linkId !== undefined) {
        toggleLaneClosure(ev.hit.linkId);
        return true; // consume click
      }
      const near = api.world.findNearestLink(ev.x, ev.y, { maxDist: 6, zHint: ev.z });
      if (near) {
        toggleLaneClosure(near.link.id);
        return true;
      }
      return false;
    },
  });

  // Also add an inspector button when any link is selected
  const offInsp = api.ui.registerInspectorAction({
    id: 'limit-trucks',
    target: 'link',
    label: 'Cars Only (No Trucks)',
    onClick: (sel) => {
      if (!sel || typeof sel.id !== 'number') return;
      api.world.setVehicleClassFilter(sel.id, ['hatchback', 'sedan', 'estate', 'coupe', 'suv', 'sports', 'microcar']);
      api.ui.showToast(`Filtered heavy vehicles on link #${sel.id}`);
    },
  });

  return () => {
    offTool();
    offInsp();
    api.world.clearLinkOverrides();
  };
};
```

---

### Example 5 — Actuated Inductive Loop Detectors + Transit Signal Priority (TSP)

Places a loop detector 35m upstream of an intersection, tracks crossings in per-map storage, and immediately preempts the signal phase when a tagged priority vehicle arrives.

```js
module.exports = function activate(api) {
  let count = 0;

  // Monitor signal phase changes
  const offPhase = api.events.on('signalPhaseChange', (ev) => {
    api.mod.log(`Junction ${ev.nodeId} -> phase ${ev.phase} (${ev.stage}) @ ${ev.time.toFixed(1)}s`);
  });

  // Attach detectors to every signalized approach connector's upstream lane
  const attachDetectors = () => {
    const rt = api.world.getNetwork();
    if (!rt?.signals) return [];
    const disposers = [];
    for (const [nodeId, plan] of rt.signals) {
      const greenConns = plan?.phases?.[0]?.green ?? [];
      for (const connId of greenConns) {
        const feeders = api.world.getUpstreamLinks(connId);
        for (const lane of feeders) {
          const detS = Math.max(2, (lane.poly?.length || 20) - 20);
          disposers.push(
            api.sim.addDetector(`tsp-${nodeId}-${lane.id}`, lane.id, detS, async (ev) => {
              count++;
              api.storage.forMap().set('totalCrossings', count);
              const veh = api.sim.getVehicle(ev.vehicleId);
              if (veh?.tags?.priority) {
                // Force phase 0 green immediately for the priority vehicle
                await api.sim.setSignalPhase(nodeId, 0, 'green');
                api.ui.showToast(`TSP Green triggered at Junction #${nodeId}`);
              }
            }),
          );
        }
      }
    }
    return disposers;
  };

  let detDisposers = attachDetectors();
  const offNet = api.events.on('netChange', () => {
    detDisposers.forEach((d) => d());
    detDisposers = attachDetectors();
  });

  return () => {
    offPhase();
    offNet();
    detDisposers.forEach((d) => d());
  };
};
```

---

### Example 6 — Emergency Responder Fleet, Custom Vehicle Type & Police Pull-Over Inspector

Registers a custom `ambulance` vehicle class, dispatches units toward the active camera position, highlights them with a 3D tracking halo ring, and adds a **Pull Over** inspector action on any vehicle.

```js
module.exports = function activate(api) {
  api.sim.registerVehicleType({
    id: 'ambulance',
    len: 5.4,
    width: 2.05,
    weight: 0, // 0 weight = won't spawn randomly in civilian traffic; only via mod spawnVehicle
    accel: 1.45,
    speed: 1.35,
    headway: 0.85,
    mass: 3200,
  });

  // Intercept civilian spawns if needed
  const offBeforeSpawn = api.sim.beforeVehicleSpawn((spec) => {
    if (spec.tags?.cancelled) return false;
    return spec;
  });

  // Top bar dispatcher button
  const offDispatch = api.ui.registerTopBarAction({
    id: 'spawn-ambulance',
    label: 'Dispatch EMS',
    onClick: async () => {
      const pose = api.camera.getPose() || { x: 0, y: 0 };
      const near = api.world.findNearestLink(pose.x, pose.y, { kind: 'lane', maxDist: 40 });
      if (!near) {
        api.ui.showToast('Move camera near a road to spawn EMS', { bad: true });
        return;
      }
      const vehId = await api.sim.spawnVehicle({
        linkId: near.link.id,
        s: Math.min(near.s, Math.max(1, near.link.poly.length - 5)),
        cls: 'ambulance',
        maxSpeed: 38,
        tags: { priority: true, unit: 'EMS-1' },
      });
      if (vehId >= 0) {
        api.render.setVehicleHighlight(`ems-${vehId}`, vehId, {
          color: '#ef4444',
          radius: 3.4,
          opacity: 0.9,
        });
        api.ui.showToast(`Dispatched EMS #${vehId}`);
      }
    },
  });

  // Inspector actions on selected vehicles
  const offPullOver = api.ui.registerInspectorAction({
    id: 'pull-over-vehicle',
    target: 'vehicle',
    label: 'Pull Over & Hold',
    onClick: async (sel) => {
      if (!sel || typeof sel.id !== 'number') return;
      const side = api.world.getDriveSide() === 'lht' ? 'left' : 'right';
      await api.sim.setVehicleOverrides(sel.id, {
        forcedLaneChange: side,
        maxSpeed: 4,
        hold: true,
        tags: { pulledOver: true },
      });
      api.ui.showToast(`Vehicle #${sel.id} pulling over (${side})`);
    },
  });

  const offRelease = api.ui.registerInspectorAction({
    id: 'release-vehicle',
    target: 'vehicle',
    label: 'Release Vehicle',
    matches: (sel) => Boolean(api.sim.getVehicle(sel?.id)?.tags?.pulledOver),
    onClick: async (sel) => {
      await api.sim.setVehicleOverrides(sel.id, {
        forcedLaneChange: null,
        maxSpeed: null,
        hold: false,
        tags: { pulledOver: false },
      });
    },
  });

  return () => {
    offBeforeSpawn();
    offDispatch();
    offPullOver();
    offRelease();
  };
};
```

---

### Example 7 — Physics-Integrated First-Person Driving (`externalControl`, `setCustomRig`, `input.setCapture`)

Takes control of a spawned car with `externalControl: true`, locks a cockpit/hood camera onto it while hiding the player car's roof (`hiddenVehicleId`), captures `WASD`/Spacebar, checks nearby traffic collisions with `countVehiclesNear`, and adds subtle speed shake via `addRigModifier`.

```js
module.exports = function activate(api) {
  let active = false;
  let carId = -1;
  let state = { x: 0, y: 0, z: 0, v: 0, heading: 0 };

  const startDrive = async () => {
    const pose = api.camera.getPose() || { x: 0, y: 0 };
    const near = api.world.findNearestLink(pose.x, pose.y, { kind: 'lane', maxDist: 60 });
    if (!near) return api.ui.showToast('Point camera near a road first', { bad: true });

    const pt = near.point;
    carId = await api.sim.spawnVehicle({
      linkId: near.link.id,
      s: near.s,
      v: 0,
      externalControl: true,
      tags: { playerCar: true },
    });
    if (carId < 0) return;

    state = { x: pt.x, y: pt.y, z: pt.z, v: 0, heading: pt.heading };
    active = true;
    api.input.pushContext('fpv-driving');
    api.input.setCapture({ keyboard: true, cameraKeys: true });
    api.ui.setFocusMode(true);
    api.ui.showToast('FPV Drive active — WASD to drive, Esc to exit');
  };

  const stopDrive = async () => {
    if (!active) return;
    active = false;
    api.camera.clearCustomRig();
    api.input.clearCapture();
    api.input.popContext('fpv-driving');
    api.ui.setFocusMode(false);
    if (carId >= 0) {
      await api.sim.despawnVehicle(carId);
      carId = -1;
    }
  };

  // Escape exits cleanly
  const offKey = api.input.onKeyDown((e) => {
    if (active && e.key === 'Escape') void stopDrive();
  });

  // Subtle camera vibration proportional to speed
  const offShake = api.camera.addRigModifier((rig) => {
    if (!active || Math.abs(state.v) < 5) return rig;
    const j = (Math.random() - 0.5) * Math.min(0.06, Math.abs(state.v) * 0.0015);
    return { ...rig, eye: { ...rig.eye, z: rig.eye.z + j } };
  });

  const offFrame = api.events.on('frame', (dtMs) => {
    if (!active) return;
    const dt = Math.min(0.05, dtMs / 1000);
    const throttle = api.input.isKeyDown('KeyW') ? 1 : api.input.isKeyDown('KeyS') ? -1 : 0;
    const steer = (api.input.isKeyDown('KeyA') ? 1 : 0) - (api.input.isKeyDown('KeyD') ? 1 : 0);

    state.v = Math.max(-10, Math.min(35, state.v + throttle * 14 * dt));
    if (throttle === 0) state.v *= Math.max(0, 1 - 1.8 * dt);
    state.heading += steer * (state.v / 6) * 0.9 * dt;
    state.x += Math.cos(state.heading) * state.v * dt;
    state.y += Math.sin(state.heading) * state.v * dt;

    const surface = api.world.sampleRoadSurface(state.x, state.y, state.z);
    if (surface && surface.distance < 8) state.z = surface.z;

    // Push pose to worker so AI traffic yields/reacts to player car!
    void api.sim.setVehicleState(carId, {
      x: state.x, y: state.y, z: state.z,
      heading: state.heading,
      v: Math.abs(state.v),
      ...(surface ? { linkId: surface.linkId, s: surface.s } : {}),
    });

    const fx = Math.cos(state.heading);
    const fy = Math.sin(state.heading);
    api.camera.setCustomRig({
      eye: { x: state.x + fx * 0.4, y: state.y + fy * 0.4, z: state.z + 1.45 },
      target: { x: state.x + fx * 30, y: state.y + fy * 30, z: state.z + 1.2 },
      fovDeg: 68,
      hiddenVehicleId: carId,
    });
  });

  const offBtn = api.ui.registerTopBarAction({
    id: 'toggle-fpv',
    label: 'Drive FPV',
    isActive: () => active,
    onClick: () => (active ? void stopDrive() : void startDrive()),
  });

  return () => {
    void stopDrive();
    offKey();
    offShake();
    offFrame();
    offBtn();
  };
};
```

---

### Example 8 — 3D Congestion Heatmap View + Live Link Inspector Section + Hover Tooltip

Adds a `Congestion` Map View toggle in the top bar that highlights every link by occupancy/speed in 3D, renders live traffic charts inside the Link Inspector, and displays link telemetry on hover.

```js
module.exports = function activate(api) {
  let heatmapOn = false;
  const paintedLinks = [];

  const clearHeatmap = () => {
    for (const id of paintedLinks.splice(0)) {
      api.render.setLinkHighlight(`hm-${id}`, id, null);
    }
  };

  const refreshHeatmap = () => {
    clearHeatmap();
    if (!heatmapOn) return;
    for (const link of api.world.getLinks()) {
      if (link.kind !== 'lane' || link.rail) continue;
      const stats = api.sim.getLinkTrafficStats(link.id);
      if (!stats || stats.count === 0) continue;
      const ratio = stats.avgSpeed / Math.max(1, link.speed || 14);
      const color = ratio < 0.35 ? '#ef4444' : ratio < 0.7 ? '#f59e0b' : '#22c55e';
      api.render.setLinkHighlight(`hm-${link.id}`, link.id, {
        color,
        opacity: 0.55,
        zOffset: 0.12,
      });
      paintedLinks.push(link.id);
    }
  };

  const offView = api.ui.registerMapView({
    id: 'congestion-3d',
    label: 'Congestion',
    title: '3D depth-tested speed heatmap',
    onToggle: (active) => {
      heatmapOn = active;
      refreshHeatmap();
    },
  });

  const offInterval = api.sim.onSimInterval(1.0, () => {
    if (heatmapOn) refreshHeatmap();
    api.ui.refreshUi(); // refresh live inspector metrics
  });

  // Rich section inside the Link inspector sheet
  const offSec = api.ui.registerInspectorSection({
    id: 'link-live-stats',
    target: 'link',
    title: 'Live Link Telemetry',
    render: (host, sel) => {
      const stats = typeof sel?.id === 'number' ? api.sim.getLinkTrafficStats(sel.id) : null;
      if (!stats) {
        host.textContent = 'No stats available.';
        return;
      }
      host.innerHTML = `
        <div style="font-size:12px;line-height:1.6;">
          <div>Vehicles: <b>${stats.count}</b> (${stats.stoppedCount} stopped)</div>
          <div>Avg Speed: <b>${api.format.speedMps(stats.avgSpeed)}</b></div>
          <div>Occupancy: <b>${api.format.number(stats.occupancy * 100, 1)}%</b></div>
          <div>Length: <b>${api.format.number(stats.length, 1)} m</b></div>
        </div>
      `;
    },
  });

  // Dynamic cursor hover tooltip
  const offTip = api.ui.registerHoverTooltip(({ hit }) => {
    if (!hit || hit.hitType !== 'road' || hit.linkId === undefined) return null;
    const stats = api.sim.getLinkTrafficStats(hit.linkId);
    if (!stats) return null;
    return {
      title: `Lane #${hit.linkId}`,
      lines: [
        `Speed: ${api.format.speedMps(stats.avgSpeed)}`,
        `Count: ${stats.count} vehicles`,
        `Elev: ${hit.z.toFixed(1)}m`,
      ],
    };
  });

  return () => {
    clearHeatmap();
    offView();
    offInterval();
    offSec();
    offTip();
  };
};
```

---

### Example 9 — Dynamic Day/Night Cycle & Rain/Slippery Road Weather (`render.setEnvironment` + `audio`)

Cycles sun hour and elevation every sim interval and lets the user toggle slippery wet-road friction (`roadFriction`) + looping ambient sound.

```js
module.exports = function activate(api) {
  let raining = false;
  let playingRain = null;
  let cycleActive = false;

  // Optionally bundle an audio file or generated data URL
  api.audio.registerSound('rain-loop', api.assets.toDataUrl('audio/rain.ogg', 'audio/ogg') || '');

  const offInterval = api.sim.onSimInterval(0.25, (simTime) => {
    if (!cycleActive) return;
    // 1 game day every 120 sim seconds
    const hour = 6 + ((simTime / 5) % 24);
    const angle = ((hour - 6) / 12) * Math.PI;
    api.render.setEnvironment({
      hour: hour % 24,
      sunElevation: Math.max(5, Math.sin(angle) * 65),
      sunAzimuth: (hour / 24) * Math.PI * 2,
    });
  });

  const offDayNight = api.ui.registerTopBarAction({
    id: 'day-night',
    label: 'Day/Night',
    isActive: () => cycleActive,
    onClick: () => {
      cycleActive = !cycleActive;
      if (!cycleActive) {
        api.render.setEnvironment({ hour: null, sun: null });
      }
    },
  });

  const offRain = api.ui.registerTopBarAction({
    id: 'toggle-rain',
    label: 'Wet Roads',
    isActive: () => raining,
    onClick: () => {
      raining = !raining;
      api.render.setEnvironment({
        cloudStrength: raining ? 0.92 : 0.35,
        cloudScale: raining ? 1.5 : 1.0,
        roadFriction: raining ? 0.65 : 1.0, // Scales vehicle target speed multiplier
      });
      if (raining) {
        playingRain = api.audio.play('rain-loop', { volume: 0.35, loop: true });
      } else {
        playingRain?.stop();
        playingRain = null;
      }
      api.ui.showToast(raining ? 'Rain enabled: heavy clouds & 65% road speed factor' : 'Clear weather restored');
    },
  });

  return () => {
    offInterval();
    offDayNight();
    offRain();
    playingRain?.stop();
    api.render.setEnvironment({ hour: null, sun: null, roadFriction: 1.0, cloudStrength: 0.35 });
  };
};
```

---

### Example 10 — Merge Zipper HUD Overlay, Styled Dashboard Widget, Keybind & Screenshot Exporter

Combines `overlay.addStyle`, `overlay.registerLayer`, `ui.registerHudWidget`, `world.findMergeConnectors`, `input.registerKeybind`, `camera.captureView`, and `io.exportText`.

```js
module.exports = function activate(api) {
  let showMerges = true;
  let lastImpacts = 0;

  api.overlay.addStyle(`
    .ops-hud-card {
      background: rgba(15, 23, 42, 0.86);
      color: #f8fafc;
      padding: 10px 12px;
      border-radius: 8px;
      font: 12px/1.4 monospace;
      pointer-events: auto;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }
    .ops-hud-card button {
      margin-top: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
    }
  `);

  const offImpacts = api.events.on('vehicleImpact', () => {
    lastImpacts++;
    api.ui.refreshUi();
  });

  const offHud = api.ui.registerHudWidget({
    id: 'ops-dashboard',
    position: 'bottom-left',
    render: (host) => {
      const m = api.sim.getMetrics() || {};
      const div = document.createElement('div');
      div.className = 'ops-hud-card';
      div.innerHTML = `
        <div><b>Traffic Telemetry</b></div>
        <div>Active: ${api.sim.getVehicles().length}</div>
        <div>Spawned: ${m.spawned ?? 0} | Arrived: ${m.arrived ?? 0}</div>
        <div>Impacts Seen: ${lastImpacts}</div>
        <button id="ops-snap-btn">Save Screenshot + JSON</button>
      `;
      div.querySelector('#ops-snap-btn')?.addEventListener('click', () => {
        const png = api.camera.captureView({ type: 'image/png' });
        if (png) api.io.exportText('traffic-snapshot-url.txt', png, 'text/plain');
        api.io.exportText('map-backup.json', api.maps.exportJson(), 'application/json');
      });
      host.appendChild(div);
    },
  });

  // 2D Canvas overlay marking all detected merge connectors
  const offOverlay = api.overlay.registerLayer('merge-pins', ({ ctx, worldToScreen }) => {
    if (!showMerges) return;
    const merges = api.world.findMergeConnectors();
    ctx.font = '11px monospace';
    for (const m of merges) {
      const p = worldToScreen(m.x, m.y, m.z + 0.5);
      if (p.depth <= 0) continue;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`${m.feederCls} -> ${m.targetCls}`, p.x + 7, p.y + 3);
    }
  });

  const offKey = api.input.registerKeybind({
    id: 'toggle-merges',
    label: 'Toggle Merge Pins',
    defaultKey: 'KeyH',
    handler: () => {
      showMerges = !showMerges;
      api.ui.showToast(`Merge pins ${showMerges ? 'shown' : 'hidden'}`);
    },
  });

  return () => {
    offImpacts();
    offHud();
    offOverlay();
    offKey();
  };
};
```

---

### Example 11 — Inter-Mod Service Provider + Localized Consumer (`mods` + `i18n` + `analytics` + `economy`)

Demonstrates sharing a clean API between two cooperating mods (`dependencies` in `mod.json`) while adding translated strings and analytics tracking.

**Provider Mod (`id: "weather-core"`)**
```js
module.exports = function activate(api) {
  let severity = 0;

  const service = {
    getSeverity: () => severity,
    setSeverity: (val) => {
      severity = Math.max(0, Math.min(1, val));
      api.mods.emit('weather-changed', { severity });
    },
  };

  return api.mods.registerService('default', service);
};
```

**Consumer Mod (`id: "weather-speed-advisor"`, `"dependencies": ["weather-core"]`)**
```js
module.exports = function activate(api) {
  api.i18n.addTranslations('en', {
    'mod.weather.advisory': 'Weather Advisory active ({{pct}}% severity)',
  });

  const weatherSvc = api.mods.getService('weather-core');
  api.mod.log('Initial severity:', weatherSvc?.getSeverity());

  const offMsg = api.mods.on('weather-changed', ({ severity }, sender) => {
    const msg = api.i18n.translate('mod.weather.advisory', {
      pct: Math.round(severity * 100),
    });
    api.ui.showToast(msg);
    api.analytics.trackEvent('weather_advisory', { sender, severity });
    const budget = api.economy.getBudget();
    api.mod.log('Campaign cost:', budget.cost, 'limit:', budget.limit);
  });

  return offMsg;
};
```
