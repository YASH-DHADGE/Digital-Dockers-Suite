const simpleGit = require('simple-git');
const git = simpleGit();

async function testLsRemote() {
    const repoUrl = 'https://github.com/octocat/Hello-World.git';
    const invalidUrl = 'https://github.com/octocat/ThisRepoDoesNotExist12345.git';

    console.log(`Checking ${repoUrl}...`);
    try {
        await git.listRemote([repoUrl]);
        console.log('✅ Valid Repo (ls-remote success)');
    } catch (e) {
        console.log('❌ Failed:', e.message);
    }

    console.log(`Checking ${invalidUrl}...`);
    try {
        await git.listRemote([invalidUrl]);
        console.log('✅ Valid Repo (Unexpected for invalid URL)');
    } catch (e) {
        console.log('✅ Correctly identified invalid repo (ls-remote failed)');
        // console.log(e.message);
    }
}

testLsRemote();
