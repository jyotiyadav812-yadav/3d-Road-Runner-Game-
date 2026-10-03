const fs = require('fs');
let code = fs.readFileSync('src/game/WorldManager.ts', 'utf8');

code = code.replace(
  "this.specArmGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);\n    this.specArmGeo.translate(0, -0.2, 0);",
  "this.specArmGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);\n    this.specArmGeo.translate(0, 0.22, 0);"
);

fs.writeFileSync('src/game/WorldManager.ts', code);
