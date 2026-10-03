const fs = require('fs');
let code = fs.readFileSync('src/game/GameEngine.ts', 'utf8');

const targetFunction = `  private checkObstacleCollisions() {
    // Player bounding box (slimmer when sliding or jumping)
    const playerMinX = this.playerX - 0.35;
    const playerMaxX = this.playerX + 0.35;
    const playerMinZ = this.playerZ - 0.35;
    const playerMaxZ = this.playerZ + 0.35;
    const playerMinY = this.playerY;
    const playerMaxY = this.isSliding ? this.playerY + 0.75 : this.playerY + 1.85;

    for (let obs of this.obstacleManager.obstacles) {
      // Check Z distance first for quick cull
      const obsMinZ = obs.z - obs.depth / 2;
      const obsMaxZ = obs.z + obs.depth / 2;
      if (playerMinZ > obsMaxZ || playerMaxZ < obsMinZ) continue;

      // Check X lane overlap
      const obsMinX = obs.x - obs.width / 2 + 0.25; // forgiving hitbox margins
      const obsMaxX = obs.x + obs.width / 2 - 0.25;
      if (playerMinX > obsMaxX || playerMaxX < obsMinX) continue;

      // Check Y height clearance
      const obsMinY = obs.y;
      const obsMaxY = obs.y + obs.height;

      // Can jump over?
      if (obs.canJumpOver && playerMinY >= obsMaxY - 0.2) {
        // Clean jump over barrier!
        continue;
      }

      // Can slide under?
      if (obs.canSlideUnder && this.isSliding && playerMaxY <= obsMaxY) {
        // Clean slide under!
        continue;
      }

      // COLLISION OCCURRED!
      this.handleCollision();
      break;
    }
  }`;

const newFunction = `  private checkObstacleCollisions(delta: number) {
    // Player bounding box
    const playerMinX = this.playerX - 0.35;
    const playerMaxX = this.playerX + 0.35;
    
    // Swept Z-axis collision (Continuous Collision Detection against tunneling)
    const forwardStep = this.currentSpeed * delta;
    const playerMinZ = this.playerZ - 0.35; 
    const playerMaxZ = this.playerZ + 0.35 + forwardStep; // Extend back to where we were last frame
    
    const playerMinY = this.playerY;
    const playerMaxY = this.isSliding ? this.playerY + 0.75 : this.playerY + 1.85;

    for (let obs of this.obstacleManager.obstacles) {
      // Check Z distance first for quick cull
      const obsMinZ = obs.z - obs.depth / 2;
      const obsMaxZ = obs.z + obs.depth / 2;
      
      if (playerMinZ > obsMaxZ || playerMaxZ < obsMinZ) continue;

      // Check X lane overlap
      const obsMinX = obs.x - obs.width / 2 + 0.25; // forgiving hitbox margins
      const obsMaxX = obs.x + obs.width / 2 - 0.25;
      if (playerMinX > obsMaxX || playerMaxX < obsMinX) continue;

      // Check Y height clearance
      const obsMinY = obs.y;
      const obsMaxY = obs.y + obs.height;

      // Can jump over? (Strictly enforce jumping action to avoid phasing)
      if (obs.canJumpOver && this.isJumping && playerMinY >= obsMaxY - 0.4) {
        // Clean jump over barrier!
        continue;
      }

      // Can slide under?
      if (obs.canSlideUnder && this.isSliding && playerMaxY <= obsMaxY) {
        // Clean slide under!
        continue;
      }

      // COLLISION OCCURRED!
      this.handleCollision();
      break;
    }
  }`;

if (code.includes(targetFunction)) {
    code = code.replace(targetFunction, newFunction);
    // Also update the call site
    code = code.replace("this.checkObstacleCollisions();", "this.checkObstacleCollisions(delta);");
    fs.writeFileSync('src/game/GameEngine.ts', code);
    console.log('patched collision');
} else {
    console.log('not found');
}
