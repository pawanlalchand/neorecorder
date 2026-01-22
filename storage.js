// ===================================
// INDEXEDDB STORAGE MODULE
// ===================================

class RecordingStorage {
    constructor() {
        this.dbName = 'NeoRecorderDB';
        this.dbVersion = 1;
        this.storeName = 'recordings';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    // Create indexes
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('title', 'title', { unique: false });

                    console.log('Object store created');
                }
            };
        });
    }

    async saveRecording(videoBlob, metadata = {}) {
        try {
            if (!this.db) {
                await this.init();
            }

            // Generate thumbnail
            const thumbnail = await this.generateThumbnail(videoBlob);

            const recording = {
                title: metadata.title || `Recording ${new Date().toLocaleString()}`,
                timestamp: Date.now(),
                duration: metadata.duration || 0,
                size: videoBlob.size,
                videoBlob: videoBlob,
                thumbnail: thumbnail,
                mimeType: videoBlob.type
            };

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.add(recording);

                request.onsuccess = () => {
                    console.log('Recording saved with ID:', request.result);
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('Failed to save recording:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error saving recording:', error);
            throw error;
        }
    }

    async getAllRecordings() {
        try {
            if (!this.db) {
                await this.init();
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.getAll();

                request.onsuccess = () => {
                    // Sort by timestamp (newest first)
                    const recordings = request.result.sort((a, b) => b.timestamp - a.timestamp);
                    resolve(recordings);
                };

                request.onerror = () => {
                    console.error('Failed to get recordings:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting recordings:', error);
            throw error;
        }
    }

    async getRecording(id) {
        try {
            if (!this.db) {
                await this.init();
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.get(id);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('Failed to get recording:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting recording:', error);
            throw error;
        }
    }

    async deleteRecording(id) {
        try {
            if (!this.db) {
                await this.init();
            }

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.delete(id);

                request.onsuccess = () => {
                    console.log('Recording deleted:', id);
                    resolve(true);
                };

                request.onerror = () => {
                    console.error('Failed to delete recording:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error deleting recording:', error);
            throw error;
        }
    }

    async updateRecordingTitle(id, newTitle) {
        try {
            if (!this.db) {
                await this.init();
            }

            const recording = await this.getRecording(id);
            if (!recording) {
                throw new Error('Recording not found');
            }

            recording.title = newTitle;

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.put(recording);

                request.onsuccess = () => {
                    console.log('Recording title updated:', id);
                    resolve(true);
                };

                request.onerror = () => {
                    console.error('Failed to update recording:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error updating recording:', error);
            throw error;
        }
    }

    async generateThumbnail(videoBlob) {
        return new Promise((resolve) => {
            try {
                const video = document.createElement('video');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                video.preload = 'metadata';
                video.muted = true;
                video.playsInline = true;

                video.onloadeddata = () => {
                    // Seek to 1 second or 10% of video
                    video.currentTime = Math.min(1, video.duration * 0.1);
                };

                video.onseeked = () => {
                    // Set canvas size
                    canvas.width = 320;
                    canvas.height = (video.videoHeight / video.videoWidth) * 320;

                    // Draw video frame to canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // Convert to data URL
                    const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

                    // Clean up
                    URL.revokeObjectURL(video.src);
                    resolve(thumbnail);
                };

                video.onerror = () => {
                    console.error('Failed to generate thumbnail');
                    URL.revokeObjectURL(video.src);
                    resolve(null); // Return null if thumbnail generation fails
                };

                video.src = URL.createObjectURL(videoBlob);
            } catch (error) {
                console.error('Error generating thumbnail:', error);
                resolve(null);
            }
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Create global instance
const recordingStorage = new RecordingStorage();
