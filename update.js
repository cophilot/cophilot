const fs = require('fs');

const OUTPUT = 'README.md';
const OUTPUTDEV = 'README-DEV.md';
const TIMESTAMP_FILE = '.timestamp';

let devMode = false;
let quiet = false;

// run with -dev for dev mode

async function main() {
    let projects = await fetch(
        'https://raw.githubusercontent.com/cophilot/.project-provider/main/projects.json'
    ).then((response) => {
        return response.json();
    });

    let html = '<p align="center">\n';
    for (let project of projects) {
        html += convertProjectToHTML(project) + '\n';
    }
    html += '</p>';

    const part1 = fs.readFileSync('parts/part1.md', 'utf8') + '\n';
    const part2 = fs.readFileSync('parts/part2.md', 'utf8') + '\n';
    const release = await generateRelease(projects);
    generateRelease(projects);
    html = part1 + html + release + part2;
    // write to file
    const op = devMode ? OUTPUTDEV : OUTPUT;
    fs.writeFile(op, html, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        log('File has been created');
    });
    // get timestamp as string
    let timestamp = new Date().toString();
    fs.writeFile(TIMESTAMP_FILE, timestamp, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        log('Timestamp has been updated');
    });
}

async function generateRelease(projects) {
    let releaseArr = [];
    for (let project of projects) {
        if (project.version == '') {
            continue;
        }
        let releases = await fetch(
            `https://api.github.com/repos/cophilot/${project.name}/releases`
        ).then((response) => {
            return response.json();
        });
        for (let release of releases) {
            const projectVersion = project.version
                .toLowerCase()
                .replace(/v/g, '');
            console.log(
                project.name +
                    ';' +
                    projectVersion +
                    ';' +
                    release.tag_name +
                    ';' +
                    release.name
            );
            if (
                release.tag_name.toLowerCase().replace(/v/g, '') ==
                    projectVersion ||
                release.name.toLowerCase().replace(/v/g, '') == projectVersion
            ) {
                let date = new Date(release.published_at);

                // continue if release is older than 1 month
                if (new Date() - date > 30 * 24 * 60 * 60 * 1000) {
                    continue;
                }

                // format date to YYYY-MM-DD
                date = date.toISOString().split('T')[0];

                releaseArr.push({
                    name: project.name,
                    version: project.version,
                    date: date,
                });
            }
        }
    }

    console.log(releaseArr);
    if (releaseArr.length == 0) {
        return '';
    }
    releaseArr.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    let releaseStr = '\n<h2 align="center">Releases:</h2>\n';
    releaseStr += '<p align="center">\n';

    for (let r of releaseArr) {
        if (r.version.startsWith('v')) {
            r.version = r.version.substring(1);
        }
        releaseStr +=
            '<div align="center">' +
            '' +
            r.date +
            ': ' +
            '<a target="_blank" href="https://github.com/cophilot/' +
            r.name +
            '/releases/latest">' +
            r.name +
            '@' +
            r.version +
            '</a>' +
            '</div>\n';
    }
    releaseStr += '</p>\n';
    return releaseStr;
}

function convertProjectToHTML(project) {
    let logo_url =
        project.logo_small_url == ''
            ? project.logo_url
            : project.logo_small_url;
    return (
        `<!--${project.name}-->` +
        `<a target="_blank" href="${project.url}" target="_blank" rel="noreferrer">` +
        `<img src="${logo_url}" alt="${project.name}" height="60" /></a>`
    );
}

function parseArgs() {
    // get command line arguments
    const args = process.argv.slice(2);
    for (let arg of args) {
        if (arg == '-dev') {
            devMode = true;
        }
        if (arg == '-q' || arg == '-quiet') {
            quiet = true;
        }
    }
}

function log(msg) {
    if (!quiet) {
        console.log(msg);
    }
}

parseArgs();

main();
