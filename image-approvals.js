window.KC_KITCHEN_DETECTIVE_APPROVED_ASSETS = {
  version: '1.1.0',
  approvedSingle: ['KD-001'],
  approvedDifference: [],
  note: 'Nur visuell und logisch abgenommene Bilder werden im Spiel freigeschaltet.'
};

(function applyKitchenDetectiveAssetGate(){
  const manifest = window.KC_KITCHEN_DETECTIVE_APPROVED_ASSETS;
  const scenes = Array.isArray(window.KC_KITCHEN_DETECTIVE_SCENES)
    ? window.KC_KITCHEN_DETECTIVE_SCENES
    : [];

  const approved = new Set([
    ...manifest.approvedSingle,
    ...manifest.approvedDifference
  ]);

  window.KC_KITCHEN_DETECTIVE_SCENES_ALL = scenes;
  window.KC_KITCHEN_DETECTIVE_SCENES = scenes.filter(scene => approved.has(scene.id));

  window.KC_KITCHEN_DETECTIVE_ASSET_STATUS = {
    approved: window.KC_KITCHEN_DETECTIVE_SCENES.map(scene => scene.id),
    pending: scenes.filter(scene => !approved.has(scene.id)).map(scene => scene.id),
    approvedCount: window.KC_KITCHEN_DETECTIVE_SCENES.length,
    totalCount: scenes.length
  };
})();
