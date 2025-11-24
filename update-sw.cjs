const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, 'package.json');
const swPath = path.resolve(__dirname, 'client/public/sw.js');

try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;

    // Generate new cache version string
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const newCacheVersion = `v${version}-${date}`;

    // Read SW
    let swContent = fs.readFileSync(swPath, 'utf8');

    // Replace CACHE_VERSION
    // Regex looks for: const CACHE_VERSION = '...';
    const regex = /const CACHE_VERSION = '.*';/;

    if (regex.test(swContent)) {
        swContent = swContent.replace(regex, `const CACHE_VERSION = '${newCacheVersion}';`);
        fs.writeFileSync(swPath, swContent);
        console.log(`Updated Service Worker cache version to: ${newCacheVersion}`);
    } else {
        console.warn('Could not find CACHE_VERSION in sw.js');
    }

} catch (error) {
    console.error('Error updating SW version:', error);
    process.exit(1);
}
