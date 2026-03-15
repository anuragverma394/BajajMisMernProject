const fs = require('fs');
const path = require('path');

const sharedDir = path.resolve(__dirname, '../shared');
const servicesDir = __dirname;

function fixPaths(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file.startsWith('.')) continue;

        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            fixPaths(filePath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let changed = false;

            // Replace all incorrect shared path requires
            const sharedRegex = /require\(['"]((?:\.\.\/)+)shared\/(.*?)['"]\)/g;
            content = content.replace(sharedRegex, (match, dots, rest) => {
                const relativePath = path.relative(path.dirname(filePath), sharedDir);
                const posixPath = relativePath.split(path.sep).join('/');
                changed = true;
                return `require('${posixPath}/${rest}')`;
            });

            if (changed) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Fixed paths in ${filePath}`);
            }
        }
    }
}

fixPaths(servicesDir);
