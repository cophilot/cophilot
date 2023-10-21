const fs = require('fs');

const OUTPUT = 'README.md';
const TIMESTAMP_FILE = '.timestamp';

async function main() {
    fetch(
        'https://raw.githubusercontent.com/phil1436/.project-provider/main/projects.json'
    ).then((response) => {
        response.json().then((projects) => {
            let html = '<p align="center">\n';
            for (project of projects) {
                html += convertProjectToHTML(project) + '\n';
            }
            html += '</p>';

            const part1 = fs.readFileSync('parts/part1.md', 'utf8') + '\n';
            const part2 = fs.readFileSync('parts/part2.md', 'utf8') + '\n';
            html = part1 + html + part2;
            // write to file
            fs.writeFile(OUTPUT, html, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('File has been created');
            });
            // get timestamp as string
            let timestamp = new Date().toString();
            fs.writeFile(TIMESTAMP_FILE, timestamp, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('Timestamp has been updated');
            });
        });
    });
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

main();
