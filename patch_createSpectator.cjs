const fs = require('fs');
let code = fs.readFileSync('src/game/WorldManager.ts', 'utf8');

const targetMethod = `  private createSpectator(x: number, y: number, z: number, rotationY: number): { group: THREE.Group; animated: AnimatedSpectator } {
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

    // Cap / hair for variation
    if (Math.random() > 0.4) {
      const capGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 10);
      const capMat = new THREE.MeshStandardMaterial({ color: shirtColor });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0, 1.58, 0);
      group.add(cap);
    }

    // Left Arm
    const armGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
    armGeo.translate(0, -0.2, 0); // pivot at shoulder
    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.set(-0.32, 1.15, 0);
    group.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.set(0.32, 1.15, 0);
    group.add(rightArm);`;

const newMethod = `  private createSpectator(x: number, y: number, z: number, rotationY: number): { group: THREE.Group; animated: AnimatedSpectator } {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    // Use pre-allocated materials instead of creating new ones
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

    // Left Arm
    const leftArm = new THREE.Mesh(this.specArmGeo, shirtMat);
    leftArm.position.set(-0.32, 1.15, 0);
    group.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Mesh(this.specArmGeo, shirtMat);
    rightArm.position.set(0.32, 1.15, 0);
    group.add(rightArm);`;

if (code.includes(targetMethod)) {
    code = code.replace(targetMethod, newMethod);
    console.log('Successfully replaced createSpectator');
    fs.writeFileSync('src/game/WorldManager.ts', code);
} else {
    console.log('Failed to match createSpectator string precisely.');
}
