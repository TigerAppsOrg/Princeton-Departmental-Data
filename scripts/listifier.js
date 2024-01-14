/**
 * Take in a file path and overrite the file with the list 
 * formatted as a yaml list
 * Usage: node listifier.js <path-to-file> [--help] [--dashed] [--dept <dept>]
 */
const fs = require('fs');

const USAGE = `
Usage: node listifier.js <path-to-file> [--help] [--dashed] [--dept <dept>]`;

const HELP = `
Options:
    --help      Show this message
    --dashed    If the list is already dashed, remove the dash and space from each line
    --dept      Add the department to each line. Must be followed by the department name

Examples:
    node listifier.js ./list.txt
    node listifier.js ./list.txt --dashed
    node listifier.js ./list.txt --dept COS
    node listifier.js ./list.txt --dashed --dept COS
`;

//----------------------------------------------------------------------

const args = process.argv.slice(2);
if (args.includes('--help')) {
    console.log(USAGE);
    console.log(HELP);
    process.exit(0);
}

const pathToFile = args[0];
if (!pathToFile) {
    console.error('No path specified');
    console.log(USAGE);
    process.exit(1);
}

if (!fs.existsSync(pathToFile)) {
    console.error(`File not found: ${pathToFile}`);
    process.exit(1);
}

const flags = args.slice(1);

// If --dashed, first remove the dash and space from each line
let dashed = false;
if (flags.includes('--dashed')) {
    dashed = true;
}

// If --dept, add the department to each line
let dept = '';
if (flags.includes('--dept')) {
    if (flags.indexOf('--dept') === flags.length - 1) {
        console.error('No department specified');
        console.log(USAGE);
        process.exit(1);
    }
    dept = flags[flags.indexOf('--dept') + 1];
}

//----------------------------------------------------------------------

// Process the file
const file = fs.readFileSync(pathToFile, 'utf8');
let lines = file.split('\n');
lines = lines.filter(line => line !== '').map(line => line.trim());
if (dashed) lines = lines.map(line => line.replace('- ', ''));
lines = [...new Set(lines)];
lines = lines.sort()
if (dept !== '') lines = lines.map(line => `${dept} ${line}`);
const list = lines.map(line => `- ${line}`).join('\n');

// Write the file
fs.writeFileSync(pathToFile, list, 'utf8')