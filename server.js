const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Set required headers for SharedArrayBuffer (needed for FFmpeg.wasm)
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 NeoRecorder is running at http://localhost:${PORT}`);
    console.log(`📹 Open your browser and start recording!`);
});
