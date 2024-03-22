/**
 * @file snapshot.js
 * @summary This script is used to take a snapshot of all the
 * degree requirements pages on https://ua.princeton.edu/
 * and save them as HTML files in the snapshots directory.
 * Usage: `node snapshot.js`
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const DEGREE_REQUIREMENTS_URL = 'https://ua.princeton.edu/fields-study/';
const AB_URL = 'departmental-majors-degree-bachelor-arts/';
const BSE_URL = 'departmental-majors-degree-bachelor-science-engineering/';
const MINORS_URL = 'minors/';
const CERTIFICATES_URL = 'certificate-programs';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Create new directory for snapshots with timestamp 
    const date = new Date();
    const timestamp = date.toISOString().split('T')[0];
    const snapshotDir = path.join(__dirname, '..', 'snapshots', timestamp);

    if (fs.existsSync(snapshotDir)) {
        console.error('Error: Snapshot directory for today already exists.');
        process.exit(1);
    }
    fs.mkdirSync(snapshotDir);
    
    // Open the AB degree requirements page
    await page.goto(DEGREE_REQUIREMENTS_URL + AB_URL);
    const abMajors = await page.evaluate(() => {
        const majors = [];
        document.querySelectorAll('.field-content a').forEach(major => {
            majors.push({
                name: major.innerText,
                url: major.href
            });
        });
        return majors;
    });

    for (const major of abMajors) {
        await page.goto(major.url);
        const majorName = 'AB-' + major.name.replace(/\s/g, '-').replace(/[^\w\s]/g, '').toLowerCase();
        const majorHtml = await page.content();
        const majorPath = path.join(snapshotDir, majorName + '.html');
        fs.writeFileSync(majorPath, majorHtml);
    }
    
    // Open the BSE degree requirements page
    await page.goto(DEGREE_REQUIREMENTS_URL + BSE_URL);
    const bseMajors = await page.evaluate(() => {
        const majors = [];
        document.querySelectorAll('.field-content a').forEach(major => {
            majors.push({
                name: major.innerText,
                url: major.href
            });
        });
        return majors;
    });

    for (const major of bseMajors) {
        await page.goto(major.url);
        const majorName = 'BSE-' + major.name.replace(/\s/g, '-').replace(/[^\w\s]/g, '').toLowerCase();
        const majorHtml = await page.content();
        const majorPath = path.join(snapshotDir, majorName + '.html');
        fs.writeFileSync(majorPath, majorHtml);
    }
   
    // Open the Minors page
    await page.goto(DEGREE_REQUIREMENTS_URL + MINORS_URL);
    const minors = await page.evaluate(() => {
        const minors = [];
        document.querySelectorAll('.field-content a').forEach(minor => {
            minors.push({
                name: minor.innerText,
                url: minor.href + '#prog-offering-2'
            });
        });
        return minors;
    });

    for (const minor of minors) {
        await page.goto(minor.url);
        const minorName = 'MINOR-' + minor.name.replace(/\s/g, '-').replace(/[^\w\s]/g, '').toLowerCase();
        const minorHtml = await page.content();
        const minorPath = path.join(snapshotDir, minorName + '.html');
        fs.writeFileSync(minorPath, minorHtml);
    }

    // Open the Certificates page
    await page.goto(DEGREE_REQUIREMENTS_URL + CERTIFICATES_URL);
    const certificates = await page.evaluate(() => {
        const certificates = [];
        document.querySelectorAll('.field-content a').forEach(certificate => {
            certificates.push({
                name: certificate.innerText,
                url: certificate.href + '#prog-offering-2'
            });
        });
        return certificates;
    });

    for (const certificate of certificates) {
        await page.goto(certificate.url);
        const certificateName = 'CERT-' + certificate.name.replace(/\s/g, '-').replace(/[^\w\s]/g, '').toLowerCase();
        const certificateHtml = await page.content();
        const certificatePath = path.join(snapshotDir, certificateName + '.html');
        fs.writeFileSync(certificatePath, certificateHtml);
    }
    
    await browser.close();
})();