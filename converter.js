// ===================================
// FFMPEG CONVERTER MODULE
// ===================================

class VideoConverter {
    constructor() {
        this.ffmpeg = null;
        this.isLoaded = false;
    }

    async loadFFmpeg() {
        if (this.isLoaded) return;

        try {
            const { FFmpeg } = FFmpegWASM;
            this.ffmpeg = new FFmpeg();
            
            // Load FFmpeg
            await this.ffmpeg.load({
                coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
            });
            
            this.isLoaded = true;
            console.log('FFmpeg loaded successfully');
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
            throw error;
        }
    }

    async convertToMP4(webmBlob, onProgress) {
        try {
            // Ensure FFmpeg is loaded
            if (!this.isLoaded) {
                await this.loadFFmpeg();
            }

            // Convert blob to Uint8Array
            const arrayBuffer = await webmBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Write input file to FFmpeg's virtual file system
            await this.ffmpeg.writeFile('input.webm', uint8Array);

            // Set up progress callback
            if (onProgress) {
                this.ffmpeg.on('progress', ({ progress }) => {
                    onProgress(Math.round(progress * 100));
                });
            }

            // Convert WebM to MP4
            await this.ffmpeg.exec([
                '-i', 'input.webm',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '22',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                'output.mp4'
            ]);

            // Read the output file
            const data = await this.ffmpeg.readFile('output.mp4');

            // Clean up
            await this.ffmpeg.deleteFile('input.webm');
            await this.ffmpeg.deleteFile('output.mp4');

            // Convert to blob
            const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
            
            console.log('Conversion successful');
            return mp4Blob;

        } catch (error) {
            console.error('Conversion failed:', error);
            throw error;
        }
    }

    async downloadAsMP4(webmBlob, filename = 'recording') {
        try {
            // Show progress
            const progressInfo = document.getElementById('progressInfo');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');

            progressInfo.style.display = 'block';
            progressText.textContent = 'Converting to MP4...';

            // Convert to MP4
            const mp4Blob = await this.convertToMP4(webmBlob, (progress) => {
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Converting to MP4... ${progress}%`;
            });

            // Download the file
            progressText.textContent = 'Preparing download...';
            const url = URL.createObjectURL(mp4Blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Hide progress
            setTimeout(() => {
                progressInfo.style.display = 'none';
                progressFill.style.width = '0%';
            }, 1000);

            console.log('Download complete');
            return true;

        } catch (error) {
            console.error('Download failed:', error);
            
            // Hide progress and show error
            const progressInfo = document.getElementById('progressInfo');
            const progressText = document.getElementById('progressText');
            progressText.textContent = 'Conversion failed. Downloading as WebM...';
            
            // Fallback: Download as WebM
            setTimeout(() => {
                this.downloadAsWebM(webmBlob, filename);
                progressInfo.style.display = 'none';
            }, 2000);

            return false;
        }
    }

    downloadAsWebM(webmBlob, filename = 'recording') {
        const url = URL.createObjectURL(webmBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('WebM download complete');
    }
}

// Export for use in app.js
const videoConverter = new VideoConverter();
