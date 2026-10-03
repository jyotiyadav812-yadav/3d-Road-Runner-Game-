const fs = require('fs');
let code = fs.readFileSync('src/game/WorldManager.ts', 'utf8');

// 1. Add class properties
const propsToInsert = `
  // Shared Crowd Assets
  private specSkinMats: THREE.MeshBasicMaterial[] = [];
  private specShirtMats: THREE.MeshBasicMaterial[] = [];
  private specPantsMat: THREE.MeshBasicMaterial;
  private specLegsGeo: THREE.BoxGeometry;
  private specBodyGeo: THREE.BoxGeometry;
  private specHeadGeo: THREE.SphereGeometry;
  private specArmGeo: THREE.BoxGeometry;
`;
code = code.replace("private crowdShirtColors", propsToInsert + "\n  private crowdShirtColors");

// 2. Initialize in constructor
const initToInsert = `
    // Pre-allocate crowd geometries and materials for performance
    this.crowdSkinColors.forEach(c => this.specSkinMats.push(new THREE.MeshBasicMaterial({ color: c })));
    this.crowdShirtColors.forEach(c => this.specShirtMats.push(new THREE.MeshBasicMaterial({ color: c })));
    this.specPantsMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    
    this.specLegsGeo = new THREE.BoxGeometry(0.4, 0.7, 0.28);
    this.specBodyGeo = new THREE.BoxGeometry(0.48, 0.55, 0.32);
    this.specHeadGeo = new THREE.SphereGeometry(0.2, 8, 8);
    this.specArmGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
    this.specArmGeo.translate(0, -0.2, 0); // Pivot at shoulder
`;
code = code.replace("this.initBannerTextures();", initToInsert + "\n    this.initBannerTextures();");

// 3. Update createSpectator
const oldCreateSpecStart = `  private createSpectator(x: number, y: number, z: number, rotationY: number): { group: THREE.Group; animated: AnimatedSpectator } {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    const skinColor = this.crowdSkinColors[Math.floor(Math.random() * this.crowdSkinColors.length)];
    const shirtColor = this.crowdShirtColors[Math.floor(Math.random() * this.crowdShirtColors.length)];

    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.5 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

    // Legs
    const legsGeo = new THREE.BoxGeometry(0.4, 0.7, 0.28);
    const legs = new THREE.Mesh(legsGeo, pantsMat);
    legs.position.y = 0.35;
    group.add(legs);

    // Torso
    const bodyGeo = new THREE.BoxGeometry(0.48, 0.55, 0.32);
    const body = new THREE.Mesh(bodyGeo, shirtMat);
    body.position.y = 0.95;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.2, 10, 8);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.45;
    group.add(head);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
    armGeo.translate(0, -0.2, 0); // pivot at shoulder

    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.set(-0.3, 1.15, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.set(0.3, 1.15, 0);
    group.add(rightArm);`;

const newCreateSpecStart = `  private createSpectator(x: number, y: number, z: number, rotationY: number): { group: THREE.Group; animated: AnimatedSpectator } {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    const skinMat = this.specSkinMats[Math.floor(Math.random() * this.specSkinMats.length)];
    const shirtMat = this.specShirtMats[Math.floor(Math.random() * this.specShirtMats.length)];
    const pantsMat = this.specPantsMat;

    // Legs
    const legs = new THREE.Mesh(this.specLegsGeo, pantsMat);
    legs.position.y = 0.35;
    group.add(legs);

    // Torso
    const body = new THREE.Mesh(this.specBodyGeo, shirtMat);
    body.position.y = 0.95;
    group.add(body);

    // Head
    const head = new THREE.Mesh(this.specHeadGeo, skinMat);
    head.position.y = 1.45;
    group.add(head);

    // Arms
    const leftArm = new THREE.Mesh(this.specArmGeo, shirtMat);
    leftArm.position.set(-0.3, 1.15, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(this.specArmGeo, shirtMat);
    rightArm.position.set(0.3, 1.15, 0);
    group.add(rightArm);`;

if (code.includes(oldCreateSpecStart)) {
    code = code.replace(oldCreateSpecStart, newCreateSpecStart);
    console.log('createSpectator replaced');
} else {
    console.log('createSpectator NOT FOUND');
}

// 4. Update the crowd density logic
const oldDensity = `    // 6. Crowds / Audiences Cheering on Both Sides
    // Place spectators in rows along sidewalks
    const crowdZSpacing = 6.0;
    const crowdCount = Math.floor(roadLength / crowdZSpacing);

    for (let c = 0; c < crowdCount; c++) {
      const cz = -roadLength / 2 + c * crowdZSpacing + (Math.random() - 0.5) * 0.6;
      
      // Left side crowd (1 row)
      const leftRows = 1;
      for (let r = 0; r < leftRows; r++) {
        const cx = -halfRoad - 1.4 - r * 1.1 - (Math.random() * 0.3);
        const cy = 0.25 + r * 0.22; // tiered grandstand step effect
        const spec = this.createSpectator(cx, cy, cz, Math.PI / 2 + (Math.random() - 0.5) * 0.3);
        group.add(spec.group);
        spectators.push(spec.animated);
      }

      // Right side crowd (1 row)
      const rightRows = 1;
      for (let r = 0; r < rightRows; r++) {`;

const newDensity = `    // 6. Crowds / Audiences Cheering on Both Sides
    // Place spectators in rows along sidewalks
    const crowdZSpacing = 2.4; // Dense crowd
    const crowdCount = Math.floor(roadLength / crowdZSpacing);

    for (let c = 0; c < crowdCount; c++) {
      const cz = -roadLength / 2 + c * crowdZSpacing + (Math.random() - 0.5) * 0.6;
      
      // Left side crowd (2 rows)
      const leftRows = 2 + (c % 2);
      for (let r = 0; r < leftRows; r++) {
        const cx = -halfRoad - 1.4 - r * 1.1 - (Math.random() * 0.3);
        const cy = 0.25 + r * 0.22; // tiered grandstand step effect
        const spec = this.createSpectator(cx, cy, cz, Math.PI / 2 + (Math.random() - 0.5) * 0.3);
        group.add(spec.group);
        spectators.push(spec.animated);
      }

      // Right side crowd (2 rows)
      const rightRows = 2 + ((c + 1) % 2);
      for (let r = 0; r < rightRows; r++) {`;

if (code.includes(oldDensity)) {
    code = code.replace(oldDensity, newDensity);
    console.log('density replaced');
} else {
    console.log('density NOT FOUND');
}

fs.writeFileSync('src/game/WorldManager.ts', code);
