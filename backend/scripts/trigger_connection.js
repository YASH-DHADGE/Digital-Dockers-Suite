const axios = require('axios');

async function triggerConnection() {
    const url = 'http://localhost:5001/api/tech-debt/connect-repo'; // Backend is on 5001 usually? Or 5000?
    // Let's check environment or assume standard port. 
    // Usually backend is 5001 based on previous logs (socket.io port issue).
    // Let's try 5000 first, then 5001.

    // Check .env for PORT if possible, but hardcoding retry is easier.

    const repoUrl = 'https://github.com/SiddharajShirke/CryptAsk';

    console.log(`Attempting to connect ${repoUrl}...`);

    try {
        const res = await axios.post('http://localhost:5000/api/tech-debt/connect-repo', { repoUrl });
        console.log('✅ Success (Port 5000)!');
        console.log('Response:', res.data);
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.log('Port 5000 failed, trying 5001...');
            try {
                const res = await axios.post('http://localhost:5001/api/tech-debt/connect-repo', { repoUrl });
                console.log('✅ Success (Port 5001)!');
                console.log('Response:', res.data);
            } catch (err2) {
                console.error('❌ Failed on 5001 too:', err2.message);
                if (err2.response) console.error('Data:', err2.response.data);
            }
        } else {
            console.error('❌ Request Failed:', err.message);
            if (err.response) console.error('Data:', err.response.data);
        }
    }
}

triggerConnection();
