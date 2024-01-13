/**
 * Take in a file path and overrite the file with the list 
 * formatted as a yaml list
 */
const fs = require('fs');

const args = process.argv.slice(2);
const pathToFile = args[0];
if (!pathToFile) {
    console.error('No path specified');
    process.exit(1);
}

const file = fs.readFileSync(pathToFile, 'utf8');
const lines = file.split('\n');
const list = lines.map(line => `- ${line}`).join('\n');

fs.writeFileSync(pathToFile, list, 'utf8')