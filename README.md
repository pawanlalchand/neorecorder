# NeoRecorder 🎥

A stunning browser-based screen recording application with neomorphic glassmorphism design.

## ✨ Features

- 🎬 **Screen Recording**: Capture your screen with system audio
- 🎨 **Neomorphic Design**: Beautiful glassmorphism UI with neon accents
- ⏯️ **Full Controls**: Start, pause, resume, and stop recording
- 📹 **Live Preview**: Real-time preview of your recording
- 💾 **MP4 Export**: Download recordings as MP4 files
- ⏱️ **Timer**: Track recording duration
- 🌙 **Dark Mode**: Sleek dark theme with vibrant gradients

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Modern browser (Chrome/Edge 94+, Firefox 92+)

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 🎯 How to Use

1. **Click "Start Recording"** - Grant screen capture permissions
2. **Select what to share** - Choose your screen, window, or tab
3. **Enable audio** - Make sure to check "Share audio" in the permission dialog
4. **Control your recording** - Use pause/resume as needed
5. **Stop when done** - Click "Stop" to finish recording
6. **Download** - Click "Download MP4" to save your recording

## 🛠️ Technical Details

### Technologies Used

- **HTML5** - Semantic structure
- **CSS3** - Glassmorphism effects, animations
- **JavaScript** - ES6+ features
- **MediaRecorder API** - Screen capture
- **FFmpeg.wasm** - Client-side MP4 conversion
- **Express.js** - Development server

### Browser Requirements

The app requires modern browser support for:
- Screen Capture API with audio
- MediaRecorder API
- SharedArrayBuffer (for FFmpeg.wasm)

### Headers Configuration

The Express server sets required headers for FFmpeg.wasm:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

## 📁 Project Structure

```
neorecorder/
├── index.html          # Main HTML structure
├── styles.css          # Neomorphic glassmorphism styles
├── app.js              # Recording logic and UI controls
├── converter.js        # FFmpeg.wasm MP4 conversion
├── server.js           # Express server with headers
├── package.json        # Dependencies
└── README.md           # Documentation
```

## 🎨 Design Features

- **Glassmorphism**: Frosted glass effect with backdrop blur
- **Neon Accents**: Cyan, purple, and pink gradient highlights
- **Smooth Animations**: Hover effects, pulse animations, transitions
- **Pill-shaped Buttons**: Modern, rounded interactive elements
- **Responsive Design**: Works on desktop and mobile devices

## ⚠️ Known Limitations

- Safari has limited Screen Capture API support
- MP4 conversion requires significant processing time for large recordings
- SharedArrayBuffer requires secure context (HTTPS in production)

## 🔧 Troubleshooting

**Recording doesn't start:**
- Make sure you grant screen capture permissions
- Check browser console for errors
- Ensure you're using a supported browser

**MP4 conversion fails:**
- The app will fallback to WebM format
- Check browser console for FFmpeg errors
- Large recordings may take time to convert

**No audio in recording:**
- Make sure to check "Share audio" when granting permissions
- Some browsers/systems may not support audio capture
- Try selecting "System Audio" in the share dialog

## 📝 License

MIT License - feel free to use this project however you like!

## 🙏 Credits

Built with modern web technologies and love for beautiful UI design.
