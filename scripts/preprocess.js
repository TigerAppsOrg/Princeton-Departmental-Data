/**
 * Preprocess and verify the data in the yaml files.
 * Run with node preprocess.js [write] [maxCountedOne] [directories=...]
 * write: whether to write the processed data to files
 * maxCountedOne: whether to set max_counted to 1 (default ALL)
 * directories: comma-separated list of directories to process (can be ALL)
 * Run node preprocess.js help for more information.
 */
const yaml = require('js-yaml');
const fs = require('fs');

/**
 * Preprocess each yaml file in each directory, adding max_counted: 1
 * when it is not present or null and reordering the fields to match
 * the order in the schema.
 * @param {boolean} write - whether to write the processed data to files
 * @param {boolean} maxCountedOne - whether to set max_counted to 1 (default ALL)
 */
const preprocess = (write, maxCountedOne, directories) => {
    directories.forEach(directory => {
        fs.readdir(directory, (err, files) => {
            if (err) {
                console.error(err);
                return;
            }
            files.forEach(file => {
                const filename = directory + "/" + file;
                const data = yaml.load(fs.readFileSync(`${directory}/${file}`,
                    'utf8'));

                // Check description
                if (!data.hasOwnProperty('description') || data.description === null) {
                    console.log("NULL WARNING -- " + filename + ": description is null");
                } else if (data.description.includes('\n\n')) {
                    console.log("STYLE WARNING -- " + filename 
                    + ": description has consecutive newlines");
                }

                // Check urls
                if (!data.hasOwnProperty('urls') || data.urls === null 
                || data.urls.length === 0) {
                    console.log("NULL WARNING -- " + filename + ": urls is null");
                } 

                // Check contacts
                if (!data.hasOwnProperty('contacts') || data.contacts === null
                || data.contacts.length === 0) {
                    console.log("NULL WARNING -- " + filename + ": contacts is null");
                } 
                
                if (!data.hasOwnProperty('req_list')) {
                    console.log("NULL WARNING -- " + filename 
                    + ": req_list is null... skipping");
                    return;
                }

                // Write both yaml and json files
                data.req_list = processReq(data.req_list, filename, 
                    maxCountedOne);
                data.req_list = reorder(data.req_list, filename);

                if (!write) return;
                const processedDataYaml = yaml.dump(data);
                fs.writeFileSync(`out/yaml/${directory}/${file}`, processedDataYaml, 
                    'utf8');
                const processedDataJson = JSON.stringify(data);
                fs.writeFileSync(`out/json/${directory}/${file.split('.')[0]}.json`, 
                    processedDataJson, 'utf8');
            })
        })
    })
}

/**
 * Add max_counted: 1 to each req in the req_list if it is not present
 * @param {*} req 
 * @param {string} filename
 * @returns req
 */
const processReq = (req, filename, maxCountedOne) => {
    req.forEach((r) => {
        if (!r.hasOwnProperty('max_counted') || r.max_counted === null) {
            if (maxCountedOne) r.max_counted = 1;
            else r.max_counted = 'ALL';
        }
        if (r.hasOwnProperty('explanation') && r['explanation'] 
        && r['explanation'].includes('\n\n')) {
            console.log("STYLE WARNING -- " + filename + ": " 
            + "explanation has consecutive newlines in req: " + r.name);
        }
        if (r.hasOwnProperty('req_list')) 
            r.req_list = processReq(r.req_list, filename, maxCountedOne);
    });
    return req;
}

/**
 * Reorder the fields in each req to match the order in the schema
 * @param {*} req 
 * @param {string} filename 
 * @returns req
 */
const reorder = (req, filename) => {
    const FIELDS = ['name', 'min_needed', 'max_counted', 'no_crosslist', 
    'double_counting_allowed', 'max_common_with_major', 'pdfs_allowed', 
    'completed_by_semester', 'explanation', 'req_list', 
    'course_list', 'excluded_course_list', 'iw_relationship', 'no_req'];
    req.forEach((r) => {
        FIELDS.forEach((f) => {
            if (r.hasOwnProperty(f)) {
                // Check for null values
                if ((f === 'iw_relationship' || f === 'min_needed' 
                || f === 'double_counting_allowed' || f === 'explanation' 
                || f === 'req_list' || f === 'course_list' 
                || f === 'excluded_course_list') && r[f] === null) {
                    console.log("NULL WARNING -- " + filename + ": " + f 
                    + " is null in req: " + r.name);
                }

                // Verify iw_relationship is valid
                if (f === 'iw_relationship' && (r[f] !== 'combined' 
                && r[f] !== 'separate' && r[f] !== 'hybrid' 
                && r[f] !== null)) {
                    console.log("STYLE WARNING -- " + filename + ": " 
                        + "iw_relationship is invalid in req: " + r.name);
                }

                // Sort and check course_list
                if (f === 'course_list' && r[f] !== null 
                && r[f].length !== 0) {
                    // Check for invalid courses
                    const DEPTS = ['AAS', 'AFS', 'AMS', 'ANT', 'AOS', 'APC', 'ARA', 'ARC', 'ART', 'ASA', 'ASL', 'AST', 'ATL', 'BCS', 'BNG', 'CBE', 'CDH', 'CEE', 'CGS', 'CHI', 'CHM', 'CHV', 'CLA', 'CLG', 'COM', 'COS', 'CSE', 'CWR', 'CZE', 'DAN', 'EAS', 'ECE', 'ECO', 'ECS', 'EEB', 'EGR', 'ENE', 'ENG', 'ENT', 'ENV', 'EPS', 'FIN', 'FRE', 'FRS', 'GEO', 'GER', 'GEZ', 'GHP', 'GLS', 'GSS', 'HEB', 'HIN', 'HIS', 'HLS', 'HOS', 'HUM', 'ITA', 'JDS', 'JPN', 'JRN', 'KOR', 'LAO', 'LAS', 'LAT', 'LIN', 'MAE', 'MAT', 'MED', 'MOD', 'MOG', 'MOL', 'MPP', 'MSE', 'MTD', 'MUS', 'NES', 'NEU', 'ORF', 'PAW', 'PER', 'PHI', 'PHY', 'PLS', 'POL', 'POP', 'POR', 'POR', 'PSY', 'QCB', 'REL', 'RES', 'RUS', 'SAN', 'SAS', 'SLA', 'SML', 'SOC', 'SPA', 'SPI', 'STC', 'SWA', 'THR', 'TPP', 'TRA', 'TUR', 'TWI', 'UKR', 'URB', 'URD', 'VIS', 'WRI', 'ISC', 'LANG']
                    
                    r[f].forEach(course => {
                        const dept = course.split(' ')[0];
                        if (!DEPTS.includes(dept)) {
                            console.log("CONTENT WARNING -- " + filename + ": " 
                            + course + " is not a valid course in req: " + r.name);
                        }
                    });

                    // Sort course_list
                    r[f] = r[f].sort();
                }

                // Sort excluded_course_list
                if (f === 'excluded_course_list' && r[f] !== null
                && r[f].length !== 0) {
                    r[f] = r[f].sort();
                }

                const value = r[f];
                delete r[f];
                r[f] = value;
            }
        });
        // Check for extra fields
        for (const field in r) {
            if (!FIELDS.includes(field)) {
                console.log("CONTENT WARNING -- " + filename + ": " 
                + "extra field " + field + " in req: " + r.name);
            }
        }

        // Recurse on req_list
        if (r.hasOwnProperty('req_list')) 
            r.req_list = reorder(r.req_list, filename);
    });
    return req;
}

// Run the script
const args = process.argv.slice(2);

if (args.includes('help')) {
    console.log("Usage: node preprocess.js [write] [maxCountedOne]");
    console.log("write: whether to write the processed data to files");
    console.log("maxCountedOne: whether to set max_counted to 1 (default ALL)");
    return;
}

const write = args.includes('write');
const maxCountedOne = args.includes('maxCountedOne');

const directoryEntry = args.find(arg => arg.includes('directories='));
let directories = [];
if (directories) {
    directories = directoryEntry.split('=')[1].split(',');
    for (let i = 0; i < directories.length; i++){
        directories[i] = directories[i].trim().toLowerCase();
        if (directories[i] === 'all') {
            directories = ['minors', 'certificates', 'majors', 'degrees'];
            break;
        }
        if (directories[i] !== 'minors' && directories[i] !== 'certificates'
        && directories[i] !== 'majors' && directories[i] !== 'degrees') {
            console.log("Invalid directory: " + directories[i]);
            return;
        }
    }
} else {
    console.log("Usage: node preprocess.js [write] [maxCountedOne] [directories=...]");
    return;
}

preprocess(write, maxCountedOne, directories);
console.log("Preprocessing complete.");