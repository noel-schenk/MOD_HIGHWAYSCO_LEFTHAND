const MENU_SCREENS = new Set(['title', 'levels', 'maps']);

/**
 * Activates the Left-Hand Traffic (LHT) mod.
 * Uses Highways & Co. apiVersion 1 drive-side support, per-map persistence,
 * top-bar quick toggle, and save-file metadata embedding.
 */
module.exports = function activate(api) {
  let active = true;

  const isPlayableScreen = (screen = api.world.getScreen()) => {
    return !MENU_SCREENS.has(screen) && Boolean(api.world.getMap());
  };

  const getDesiredSide = () => {
    const fallback = api.mod.getSetting('defaultSide', 'lht') === 'rht' ? 'rht' : 'lht';
    const stored = api.storage.forMap().get('driveSide', fallback);
    return stored === 'rht' ? 'rht' : 'lht';
  };

  const notifySwitch = (side) => {
    if (!api.mod.getSetting('showToasts', true)) return;
    api.ui.showToast(`Traffic switched to ${side.toUpperCase()}`, { icon: 'compass' });
  };

  const applySide = (side, { notify = true } = {}) => {
    if (!active) return;
    const normalized = side === 'rht' ? 'rht' : 'lht';

    if (!isPlayableScreen()) return;

    const map = api.world.getMap();
    const needsSync = api.world.getDriveSide() !== normalized || map?.driveSide !== normalized;
    if (!needsSync) return;

    api.world.setDriveSide(normalized, true);
    api.ui.refreshUi();
    if (notify) notifySwitch(normalized);
  };

  // Apply immediately if the user enabled the mod mid-session.
  applySide(getDesiredSide(), { notify: isPlayableScreen() });

  // Re-apply when entering campaign, sandbox, or editor.
  const offScreen = api.events.on('screenChange', (screen) => {
    if (MENU_SCREENS.has(screen)) return;
    applySide(getDesiredSide(), { notify: false });
  });

  // Catch level transitions or map resets that keep the same screen name.
  const offNet = api.events.on('netChange', () => {
    applySide(getDesiredSide(), { notify: false });
  });

  // React immediately when the user changes mod settings in the Mods modal.
  const offSetting = api.events.on('settingChange', ({ modId, key, value }) => {
    if (modId !== api.mod.id || key !== 'defaultSide') return;
    const side = value === 'rht' ? 'rht' : 'lht';
    if (isPlayableScreen()) {
      api.storage.forMap().set('driveSide', side);
    }
    applySide(side, { notify: true });
  });

  // Top-bar pill to flip LHT <-> RHT for the current map.
  const offBtn = api.ui.registerTopBarAction({
    id: 'toggle-drive-side',
    label: 'LHT / RHT',
    title: 'Toggle Left-Hand vs Right-Hand Traffic for this map',
    isActive: () => api.world.getDriveSide() === 'lht',
    onClick: () => {
      const next = api.world.getDriveSide() === 'lht' ? 'rht' : 'lht';
      if (isPlayableScreen()) {
        api.storage.forMap().set('driveSide', next);
      }
      applySide(next, { notify: true });
    },
  });

  // Embed and restore drive-side inside exported JSON saves.
  const offBeforeSave = api.maps.beforeSave((doc) => {
    if (!doc || typeof doc !== 'object') return;
    doc.lhtMod = { driveSide: api.world.getDriveSide() };
  });

  const offAfterLoad = api.maps.afterLoad((doc) => {
    const saved = doc?.lhtMod?.driveSide ?? doc?.network?.driveSide ?? doc?.driveSide;
    if (saved !== 'lht' && saved !== 'rht') return;
    api.storage.forMap().set('driveSide', saved);
    applySide(saved, { notify: false });
  });

  return function deactivate() {
    active = false;
    offScreen();
    offNet();
    offSetting();
    offBtn();
    offBeforeSave();
    offAfterLoad();
    api.world.setDriveSide('rht', isPlayableScreen());
    api.ui.refreshUi();
  };
};
