const fs = require('fs');
const data = fs.readFileSync('public/adventurer.glb');
// The JSON chunk is usually at the beginning of the file, after the 12-byte header and 8-byte chunk header
const jsonLength = data.readUInt32LE(12);
const jsonStr = data.toString('utf8', 20, 20 + jsonLength);
const json = JSON.parse(jsonStr);
console.log(json.animations.map(a => a.name));
