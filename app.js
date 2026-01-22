// ===================================
// SCREEN RECORDER APPLICATION
// ===================================

class ScreenRecorder {
    constructor() {
        // State
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.stream = null;
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = null;
        this.pausedTime = 0;
        this.timerInterval = null;
        this.recordingDuration = 0;

        // DOM Elements
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resumeBtn: document.getElementById('resumeBtn'),
            stopBtn: document.getElementById('stopBtn'),
            saveBtn: document.getElementById('saveBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            previewVideo: document.getElementById('previewVideo'),
            previewPlaceholder: document.getElementById('previewPlaceholder'),
            recordingIndicator: document.getElementById('recordingIndicator'),
            timerDisplay: document.getElementById('timerDisplay'),
            statusBadge: document.getElementById('statusBadge'),
        };

        this.init();
    }

    init() {
        // Bind event listeners
        this.elements.startBtn.addEventListener('click', () => this.startRecording());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseRecording());
        this.elements.resumeBtn.addEventListener('click', () => this.resumeRecording());
        this.elements.stopBtn.addEventListener('click', () => this.stopRecording());
        this.elements.saveBtn.addEventListener('click', () => this.saveToLibrary());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadRecording());

        console.log('Screen Recorder initialized');
    }

    async startRecording() {
        try {
            // Request screen capture with audio
            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'screen',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // Set up preview
            this.elements.previewVideo.srcObject = this.stream;
            this.elements.previewVideo.classList.add('active');
            this.elements.previewPlaceholder.classList.add('hidden');

            // Set up MediaRecorder
            const options = {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 5000000 // 5 Mbps
            };

            // Fallback to vp8 if vp9 is not supported
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8,opus';
            }

            this.mediaRecorder = new MediaRecorder(this.stream, options);

            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            // Handle stop
            this.mediaRecorder.onstop = () => {
                this.handleRecordingStop();
            };

            // Handle stream end (user stops sharing)
            this.stream.getVideoTracks()[0].addEventListener('ended', () => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            });

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;
            this.startTime = Date.now();
            this.startTimer();

            // Update UI
            this.updateUI('recording');
            this.updateStatus('Recording', 'recording');

            console.log('Recording started');

        } catch (error) {
            console.error('Failed to start recording:', error);
            this.updateStatus('Error', 'error');
            alert('Failed to start recording. Please make sure you grant screen capture permissions.');
        }
    }

    pauseRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.pausedTime = Date.now();
            this.stopTimer();

            // Update UI
            this.updateUI('paused');
            this.updateStatus('Paused', 'paused');

            console.log('Recording paused');
        }
    }

    resumeRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.isPaused = false;

            // Adjust start time to account for paused duration
            const pauseDuration = Date.now() - this.pausedTime;
            this.startTime += pauseDuration;

            this.startTimer();

            // Update UI
            this.updateUI('recording');
            this.updateStatus('Recording', 'recording');

            console.log('Recording resumed');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.isPaused = false;
            this.stopTimer();

            // Stop all tracks
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            console.log('Recording stopped');
        }
    }

    handleRecordingStop() {
        // Create blob from recorded chunks
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recordedBlob = blob;

        // Update UI
        this.updateUI('stopped');
        this.updateStatus('Ready', 'ready');

        // Clear preview
        this.elements.previewVideo.srcObject = null;
        this.elements.previewVideo.classList.remove('active');
        this.elements.previewPlaceholder.classList.remove('hidden');

        console.log('Recording ready:', blob.size, 'bytes');
    }

    async saveToLibrary() {
        if (!this.recordedBlob) {
            alert('No recording available to save');
            return;
        }

        try {
            this.updateStatus('Saving...', 'recording');

            // Save to IndexedDB
            await recordingStorage.saveRecording(this.recordedBlob, {
                duration: this.recordingDuration
            });

            this.updateStatus('Saved!', 'complete');

            // Reset after save
            setTimeout(() => {
                this.reset();
                // Refresh library if on library tab
                if (document.getElementById('libraryTab').classList.contains('active')) {
                    libraryManager.loadLibrary();
                }
            }, 1500);

            console.log('Recording saved to library');

        } catch (error) {
            console.error('Failed to save recording:', error);
            this.updateStatus('Save Failed', 'error');
            alert('Failed to save recording to library');
        }
    }

    downloadRecording() {
        if (!this.recordedBlob) {
            alert('No recording available to download');
            return;
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `screen-recording-${timestamp}.webm`;

        // Direct WebM download (instant, no conversion)
        const url = URL.createObjectURL(this.recordedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.updateStatus('Downloaded!', 'complete');

        // Reset after download
        setTimeout(() => {
            this.reset();
        }, 1500);

        console.log('Recording downloaded:', filename);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            this.recordingDuration = Math.floor(elapsed / 1000);
            this.updateTimerDisplay(elapsed);
        }, 100);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const timeString = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');

        this.elements.timerDisplay.querySelector('.timer-text').textContent = timeString;
    }

    updateUI(state) {
        // Reset all buttons
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.resumeBtn.disabled = true;
        this.elements.stopBtn.disabled = true;
        this.elements.saveBtn.disabled = true;
        this.elements.downloadBtn.disabled = true;

        this.elements.pauseBtn.style.display = 'flex';
        this.elements.resumeBtn.style.display = 'none';
        this.elements.saveBtn.style.display = 'none';
        this.elements.downloadBtn.style.display = 'none';

        this.elements.recordingIndicator.classList.remove('active');

        switch (state) {
            case 'recording':
                this.elements.startBtn.disabled = true;
                this.elements.pauseBtn.disabled = false;
                this.elements.stopBtn.disabled = false;
                this.elements.recordingIndicator.classList.add('active');
                break;

            case 'paused':
                this.elements.startBtn.disabled = true;
                this.elements.pauseBtn.style.display = 'none';
                this.elements.resumeBtn.style.display = 'flex';
                this.elements.resumeBtn.disabled = false;
                this.elements.stopBtn.disabled = false;
                break;

            case 'stopped':
                this.elements.startBtn.disabled = false;
                this.elements.saveBtn.style.display = 'flex';
                this.elements.saveBtn.disabled = false;
                this.elements.downloadBtn.style.display = 'flex';
                this.elements.downloadBtn.disabled = false;
                break;
        }
    }

    updateStatus(text, type) {
        const statusText = this.elements.statusBadge.querySelector('.status-text');
        const statusDot = this.elements.statusBadge.querySelector('.status-dot');

        statusText.textContent = text;

        // Update badge styling based on type
        const badge = this.elements.statusBadge;
        badge.style.background = 'rgba(0, 245, 255, 0.1)';
        badge.style.borderColor = 'var(--color-neon-cyan)';
        statusDot.style.background = 'var(--color-neon-cyan)';

        switch (type) {
            case 'recording':
                badge.style.background = 'rgba(255, 0, 110, 0.1)';
                badge.style.borderColor = 'var(--color-neon-pink)';
                statusDot.style.background = 'var(--color-neon-pink)';
                break;
            case 'paused':
                badge.style.background = 'rgba(181, 55, 255, 0.1)';
                badge.style.borderColor = 'var(--color-neon-purple)';
                statusDot.style.background = 'var(--color-neon-purple)';
                break;
            case 'complete':
                badge.style.background = 'rgba(0, 245, 160, 0.1)';
                badge.style.borderColor = '#00f5a0';
                statusDot.style.background = '#00f5a0';
                break;
        }
    }

    reset() {
        this.recordedChunks = [];
        this.recordedBlob = null;
        this.recordingDuration = 0;
        this.updateUI('idle');
        this.updateStatus('Ready', 'ready');
        this.updateTimerDisplay(0);
    }
}

// Tab Management
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');

            // Load library when switching to library tab
            if (tabName === 'library') {
                libraryManager.loadLibrary();
            }
        });
    });
}

// Initialize Player Modal
function initPlayerModal() {
    const closeBtn = document.getElementById('closePlayerBtn');
    const modal = document.getElementById('playerModal');

    closeBtn.addEventListener('click', () => {
        libraryManager.closePlayer();
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            libraryManager.closePlayer();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            libraryManager.closePlayer();
        }
    });
}

// Initialize Refresh Button
function initRefreshButton() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', () => {
        libraryManager.loadLibrary();
    });
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize storage
    await recordingStorage.init();

    // Initialize components
    const recorder = new ScreenRecorder();
    initTabs();
    initPlayerModal();
    initRefreshButton();

    console.log('Application ready');
});
