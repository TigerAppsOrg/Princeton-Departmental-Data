/**
 * Take in a file path and overrite the file with the list 
 * formatted as a yaml list
 * Usage: node listifier.js <path-to-file> [--help] [--dashed]
 */
const fs = require('fs');

const args = process.argv.slice(2);
if (args.includes('--help')) {
    console.log(`
    Usage: node listifier.js <path-to-file> [--help] [--dashed]
    `);
    console.log(`
    Options:
        --help      Show this message
        --dashed    If the list is already dashed, remove the dash and space from each line
    `);
    process.exit(0);
}

const pathToFile = args[0];
if (!pathToFile) {
    console.error('No path specified');
    console.log(`
    Usage: node listifier.js <path-to-file> [--help] [--dashed]
    `);
    process.exit(1);
}

if (!fs.existsSync(pathToFile)) {
    console.error(`File not found: ${pathToFile}`);
    process.exit(1);
}

const flags = args.slice(1);

// If dashed, first remove the dash and space from each line
let dashed = false;
if (flags.includes('--dashed')) {
    dashed = true;
}

const file = fs.readFileSync(pathToFile, 'utf8');
let lines = file.split('\n');
lines = lines.filter(line => line !== '').map(line => line.trim());
if (dashed) lines = lines.map(line => line.replace('- ', ''));
lines = [...new Set(lines)];
lines = lines.sort()
const list = lines.map(line => `- ${line}`).join('\n');

fs.writeFileSync(pathToFile, list, 'utf8')