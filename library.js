// ===================================
// LIBRARY UI MODULE
// ===================================

class LibraryManager {
    constructor() {
        this.currentPlayingId = null;
        this.init();
    }

    init() {
        // Will be called after DOM is ready
        console.log('Library Manager initialized');
    }

    async loadLibrary() {
        try {
            const recordings = await recordingStorage.getAllRecordings();
            this.renderRecordings(recordings);
        } catch (error) {
            console.error('Failed to load library:', error);
            this.showError('Failed to load recordings');
        }
    }

    renderRecordings(recordings) {
        const libraryGrid = document.getElementById('libraryGrid');
        const emptyState = document.getElementById('emptyState');

        if (!recordings || recordings.length === 0) {
            libraryGrid.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        libraryGrid.innerHTML = recordings.map(recording => this.createRecordingCard(recording)).join('');

        // Attach event listeners
        this.attachCardListeners();
    }

    createRecordingCard(recording) {
        const date = new Date(recording.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const duration = recordingStorage.formatDuration(recording.duration);
        const fileSize = recordingStorage.formatFileSize(recording.size);
        const thumbnailSrc = recording.thumbnail || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23000" width="100" height="100"/></svg>';

        return `
            <div class="recording-card glass-card" data-id="${recording.id}">
                <div class="recording-thumbnail">
                    <img src="${thumbnailSrc}" alt="${recording.title}">
                    <div class="play-overlay" data-action="play" data-id="${recording.id}">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </div>
                    <div class="duration-badge">${duration}</div>
                </div>
                <div class="recording-info">
                    <h3 class="recording-title" data-action="edit-title" data-id="${recording.id}">${recording.title}</h3>
                    <p class="recording-meta">${formattedDate}</p>
                    <p class="recording-size">${fileSize}</p>
                </div>
                <div class="recording-actions">
                    <button class="btn-icon" data-action="download" data-id="${recording.id}" title="Download">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                    <button class="btn-icon btn-danger" data-action="delete" data-id="${recording.id}" title="Delete">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    attachCardListeners() {
        // Play buttons
        document.querySelectorAll('[data-action="play"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.playRecording(id);
            });
        });

        // Download buttons
        document.querySelectorAll('[data-action="download"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.dataset.id);
                this.downloadRecording(id);
            });
        });

        // Delete buttons
        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.dataset.id);
                this.deleteRecording(id);
            });
        });

        // Edit title
        document.querySelectorAll('[data-action="edit-title"]').forEach(title => {
            title.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.dataset.id);
                this.editTitle(id, e.currentTarget);
            });
        });
    }

    async playRecording(id) {
        try {
            const recording = await recordingStorage.getRecording(id);
            if (!recording) {
                this.showError('Recording not found');
                return;
            }

            const modal = document.getElementById('playerModal');
            const video = document.getElementById('playerVideo');
            const title = document.getElementById('playerTitle');

            // Set video source
            const url = URL.createObjectURL(recording.videoBlob);
            video.src = url;
            title.textContent = recording.title;

            // Show modal
            modal.classList.add('active');
            video.play();

            this.currentPlayingId = id;

            // Clean up URL when video ends
            video.onended = () => {
                URL.revokeObjectURL(url);
            };

        } catch (error) {
            console.error('Failed to play recording:', error);
            this.showError('Failed to play recording');
        }
    }

    closePlayer() {
        const modal = document.getElementById('playerModal');
        const video = document.getElementById('playerVideo');

        video.pause();
        video.src = '';
        modal.classList.remove('active');
        this.currentPlayingId = null;
    }

    async downloadRecording(id) {
        try {
            const recording = await recordingStorage.getRecording(id);
            if (!recording) {
                this.showError('Recording not found');
                return;
            }

            // Download as WebM
            const url = URL.createObjectURL(recording.videoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${recording.title}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('Recording downloaded:', recording.title);

        } catch (error) {
            console.error('Failed to download recording:', error);
            this.showError('Failed to download recording');
        }
    }

    async deleteRecording(id) {
        if (!confirm('Are you sure you want to delete this recording?')) {
            return;
        }

        try {
            await recordingStorage.deleteRecording(id);
            await this.loadLibrary(); // Refresh the list
            console.log('Recording deleted');
        } catch (error) {
            console.error('Failed to delete recording:', error);
            this.showError('Failed to delete recording');
        }
    }

    async editTitle(id, element) {
        const currentTitle = element.textContent;
        const newTitle = prompt('Enter new title:', currentTitle);

        if (newTitle && newTitle !== currentTitle) {
            try {
                await recordingStorage.updateRecordingTitle(id, newTitle);
                element.textContent = newTitle;
                console.log('Title updated');
            } catch (error) {
                console.error('Failed to update title:', error);
                this.showError('Failed to update title');
            }
        }
    }

    showError(message) {
        // Simple error display - could be enhanced with a toast notification
        alert(message);
    }
}

// Create global instance
const libraryManager = new LibraryManager();
