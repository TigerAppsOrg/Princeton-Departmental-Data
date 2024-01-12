const yaml = require('js-yaml');
const fs = require('fs');

/**
 * Preprocess each yaml file in each directory, adding max_counted: 1
 * when it is not present or null.
 */
const preprocess = () => {
    const DIRECTORIES = ["minors", "certs"];
    DIRECTORIES.forEach(directory => {
        fs.readdir(directory, (err, files) => {
            if (err) {
                console.error(err);
                return;
            }
            files.forEach(file => {
                const filename = directory + "/" + file;
                const data = yaml.load(fs.readFileSync(`${directory}/${file}`, 'utf8'));
                if (!data.hasOwnProperty('req_list')) return;
                data.req_list = processReq(data.req_list);
                data.req_list = reorder(data.req_list, filename);

                // Write a new file with the processed data in YAML
                // const processedDataYaml = yaml.dump(data);
                // fs.writeFileSync(`${directory}/${file}`, processedDataYaml, 'utf8');
                // const processedDataJson = JSON.stringify(data);
                // fs.writeFileSync(`json/${directory}/${file.split('.')[0]}.json`, processedDataJson, 'utf8');
            })
        })
    })
}

const processReq = (req) => {
    req.forEach((r) => {
        if (!r.hasOwnProperty('max_counted') || r.max_counted === null) 
            r.max_counted = 1;
        if (r.hasOwnProperty('req_list')) 
            r.req_list = processReq(r.req_list);
    });
    return req;
}

const reorder = (req, filename) => {
    const FIELDS = ['name', 'min_needed', 'max_counted', 'no_crosslist', 'double_counting_allowed', 'max_common_with_major', 'pdfs_allowed', 'completed_by_semester', 'description', 'explanation', 'req_list', 'course_list', 'excluded_course_list', 'iw_relationship', 'no_req'];
    req.forEach((r) => {
        FIELDS.forEach((f) => {
            if (r.hasOwnProperty(f)) {
                if ((f === 'iw_relationship' || f === 'min_needed' || f === 'double_counting_allowed' || f === 'explanation' || f === 'description' || f === 'req_list' || f === 'course_list' || f === 'excluded_course_list') && r[f] === null) {
                    console.log("WARNING -- " + filename + ": " + f + " is null in req: " + r.name);
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

preprocess();