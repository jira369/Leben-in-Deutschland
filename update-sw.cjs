const fs = require('fs');
const path = require('path');

// Load .env file so VITE_* vars are available
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
        const match = line.match(/^(VITE_[A-Z_]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2];
        }
    }
}

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

        // Remove any previous Firebase config injection
        swContent = swContent.replace(/^self\.__FIREBASE_CONFIG__\s*=\s*.*;\n?/m, '');

        // Inject Firebase config for push notifications if env vars are available
        const fbConfig = {
            apiKey: process.env.VITE_FIREBASE_API_KEY || '',
            authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
            projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
            messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
            appId: process.env.VITE_FIREBASE_APP_ID || '',
        };
        const configLine = `self.__FIREBASE_CONFIG__ = ${JSON.stringify(fbConfig)};\n`;
        swContent = configLine + swContent;

        fs.writeFileSync(swPath, swContent);
        console.log(`Updated Service Worker cache version to: ${newCacheVersion}`);
        if (fbConfig.apiKey) {
            console.log('Injected Firebase config into Service Worker');
        }
    } else {
        console.warn('Could not find CACHE_VERSION in sw.js');
    }

} catch (error) {
    console.error('Error updating SW version:', error);
    process.exit(1);
}
