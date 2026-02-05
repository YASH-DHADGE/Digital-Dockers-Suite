const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const tempDir = path.join(__dirname, 'temp_test_clone');

if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir);

async function testClone() {
    console.log('Testing git clone...');
    try {
        const git = simpleGit();
        await git.clone('https://github.com/octocat/Hello-World.git', tempDir);
        console.log('Clone success!');
        const files = fs.readdirSync(tempDir);
        console.log('Files:', files);
    } catch (err) {
        console.error('Clone failed:', err);
    } finally {
        if (fs.existsSync(tempDir)) {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (e) { console.log('Cleanup error (ignored)'); }
        }
    }
}

testClone();
