const fs = require('fs');
const data = fs.readFileSync('public/adventurer.glb');
const jsonLength = data.readUInt32LE(12);
const jsonStr = data.toString('utf8', 20, 20 + jsonLength);
const json = JSON.parse(jsonStr);
console.log(json.animations.map(a => a.name));
