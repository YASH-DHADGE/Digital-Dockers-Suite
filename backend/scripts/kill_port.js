const { exec } = require('child_process');

const PORTS = [5000, 5001];

const isWindows = process.platform === 'win32';

PORTS.forEach(port => {
    const command = isWindows
        ? `netstat -ano | findstr :${port}`
        : `lsof -i :${port} -t`;

    exec(command, (err, stdout, stderr) => {
        if (err || !stdout) return;

        const lines = stdout.trim().split('\n');
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const pid = isWindows ? parts[parts.length - 1] : parts[0];

            if (pid && !isNaN(pid)) {
                console.log(`Killing process on port ${port} (PID: ${pid})...`);
                const killCmd = isWindows ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
                exec(killCmd, (kErr) => {
                    if (!kErr) console.log(`✅ Killed PID ${pid}`);
                });
            }
        });
    });
});
