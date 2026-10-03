const fs = require('fs');
let code = fs.readFileSync('src/game/WorldManager.ts', 'utf8');

const targetInit = `    this.specLegsGeo = new THREE.BoxGeometry(0.4, 0.7, 0.28);`;
const newInit = `    this.specCapGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 10);
    this.specLegsGeo = new THREE.BoxGeometry(0.4, 0.7, 0.28);`;

code = code.replace(targetInit, newInit);

const targetProp = `  private specArmGeo: THREE.BoxGeometry;`;
const newProp = `  private specArmGeo: THREE.BoxGeometry;
  private specCapGeo: THREE.CylinderGeometry;`;

code = code.replace(targetProp, newProp);
fs.writeFileSync('src/game/WorldManager.ts', code);
