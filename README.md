# Left-Hand Traffic (LHT) — `MOD_HIGHWAYSCO_LEFTHAND`

A mod for **Highways & Co.** (`apiVersion: 1`) that switches traffic to **Left-Hand Traffic (LHT)** across the road compiler, simulation worker, and 3D renderer.

## Features

- **Full LHT Compilation & Physics**: Uses `api.world.setDriveSide('lht', true)` to flip two-way road lane geometry, roundabouts, ramp kerb defaults, priority-to-the-left yielding, keep-left/pass-right lane bias, turn-on-red polarity, and curb-side traffic signal/sign placement.
- **Per-Map LHT / RHT Toggle**: Adds an **LHT / RHT** toggle button to the top toolbar, persisted per map via `api.storage.forMap()`.
- **Mod Browser Settings**: Configure the default drive side (`lht` or `rht`) and toggle notifications directly inside the in-game Mods UI.
- **Save-File Portability**: Embeds and restores `lhtMod.driveSide` inside exported JSON map saves via `api.maps.beforeSave` / `afterLoad`.
- **Clean Unload**: Automatically restores Right-Hand Traffic (`rht`) when the mod is disabled or uninstalled.

## Installation

1. In Highways & Co., open the **Mods** browser and install from GitHub (`noelschenk/MOD_HIGHWAYSCO_LEFTHAND`) or click **Install from Folder...** and select this directory.
2. Enable **Left-Hand Traffic (LHT)**.
