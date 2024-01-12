/**
 * Preprocess and verify the YAML files in the minors and certs directories.
 * Run with "node preprocess.js" to just check the data without writing.
 * Run with "node preprocess.js write" to write the processed data to files.
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
const preprocess = (write, maxCountedOne) => {
    const DIRECTORIES = ["minors", "certs"];
    DIRECTORIES.forEach(directory => {
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
                fs.writeFileSync(`${directory}/${file}`, processedDataYaml, 
                    'utf8');
                const processedDataJson = JSON.stringify(data);
                fs.writeFileSync(`json/${directory}/${file.split('.')[0]}.json`, 
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
            r.req_list = processReq(r.req_list, filename);
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
                if ((f === 'iw_relationship' || f === 'min_needed' 
                || f === 'double_counting_allowed' || f === 'explanation' 
                || f === 'description' || f === 'req_list' 
                || f === 'course_list' || f === 'excluded_course_list') 
                && r[f] === null) {
                    console.log("NULL WARNING -- " + filename + ": " + f 
                    + " is null in req: " + r.name);
                }

                if (f === 'iw_relationship' && (r[f] !== 'combined' 
                && r[f] !== 'separate' && r[f] !== 'hybrid' 
                && r[f] !== null)) {
                    console.log("STYLE WARNING -- " + filename + ": " 
                        + "iw_relationship is invalid in req: " + r.name);
                }

                const value = r[f];
                delete r[f];
                r[f] = value;
            }
        });
        if (r.hasOwnProperty('req_list')) 
            r.req_list = reorder(r.req_list, filename);
    });
    return req;
}

// Run the script
const args = process.argv.slice(2);
preprocess(args.includes('write'), args.includes('maxCountedOne'));