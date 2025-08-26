// Camera and Face Capture Functionality
class CameraManager {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.stream = null;
        this.isInitialized = false;
    }

    async initialize(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        
        console.log('Initializing camera...');
        
        // Check if camera is supported first
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log('Camera not supported, using demo mode');
            this.isInitialized = true;
            this.demoMode = true;
            return { success: true, demoMode: true, error: 'Camera not supported on this device' };
        }
        
        try {
            // Create a timeout promise that rejects after 3 seconds
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Camera initialization timeout')), 3000);
            });
            
            // Create camera access promise
            const cameraPromise = navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            // Race between camera access and timeout
            this.stream = await Promise.race([cameraPromise, timeoutPromise]);
            
            this.video.srcObject = this.stream;
            
            // Wait for video to be ready with shorter timeout
            await new Promise((resolve, reject) => {
                const videoTimeout = setTimeout(() => reject(new Error('Video loading timeout')), 2000);
                
                this.video.onloadedmetadata = () => {
                    clearTimeout(videoTimeout);
                    this.video.play().then(resolve).catch(reject);
                };
                this.video.onerror = () => {
                    clearTimeout(videoTimeout);
                    reject(new Error('Video error'));
                };
            });
            
            // Additional check to ensure video is actually playing
            if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
                throw new Error('Video dimensions are invalid');
            }
            
            this.isInitialized = true;
            this.demoMode = false;
            console.log('Camera initialized successfully - real camera mode');
            return { success: true, demoMode: false };
            
        } catch (error) {
            console.error('Camera initialization failed:', error);
            console.log('Falling back to demo mode...');
            
            // Clean up any partial stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            // Fallback to demo mode if camera fails
            this.isInitialized = true;
            this.demoMode = true;
            
            return { success: true, demoMode: true, error: this.getCameraErrorMessage(error) };
        }
    }

    getCameraErrorMessage(error) {
        switch (error.name) {
            case 'NotAllowedError':
                return 'Camera access denied. Please allow camera permissions and refresh the page.';
            case 'NotFoundError':
                return 'No camera found. Please connect a camera and try again.';
            case 'NotReadableError':
                return 'Camera is being used by another application.';
            case 'OverconstrainedError':
                return 'Camera constraints cannot be satisfied.';
            default:
                return 'Failed to access camera. Please check your camera settings.';
        }
    }

    captureFrame() {
        console.log('CaptureFrame called - isInitialized:', this.isInitialized, 'demoMode:', this.demoMode);
        
        if (!this.isInitialized) {
            console.log('Camera not initialized, returning error');
            return { success: false, error: 'Camera not initialized' };
        }

        // If in demo mode, immediately return simulated capture
        if (this.demoMode) {
            console.log('Demo mode: Simulating face capture...');
            const faceData = {
                timestamp: new Date().toISOString(),
                imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
                confidence: 0.85,
                features: this.extractSimulatedFeatures('demo_image_data')
            };
            
            console.log('Demo face capture successful:', faceData);
            return { success: true, faceData: faceData };
        }

        // Real camera mode - check if video elements exist
        if (!this.video || !this.canvas) {
            console.log('Video or canvas elements missing');
            return { success: false, error: 'Camera not initialized' };
        }

        // Check if video is ready
        if (this.video.readyState < 2) {
            console.log('Video not ready, readyState:', this.video.readyState);
            return { success: false, error: 'Camera is still loading. Please wait a moment and try again.' };
        }

        // Check if video has valid dimensions
        if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
            console.log('Video dimensions invalid:', this.video.videoWidth, 'x', this.video.videoHeight);
            return { success: false, error: 'Camera feed not ready. Please wait a moment and try again.' };
        }

        try {
            const context = this.canvas.getContext('2d');
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            // Draw the current video frame to canvas
            context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Get image data as base64
            const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
            
            // Validate that we actually captured something
            if (!imageData || imageData.length < 100) {
                return { success: false, error: 'Failed to capture image data. Please try again.' };
            }
            
            // In a real application, you would process this image for face recognition
            // For demo purposes, we'll just return the image data
            const faceData = {
                timestamp: new Date().toISOString(),
                imageData: imageData,
                confidence: Math.random() * 0.3 + 0.7, // Simulated confidence score
                features: this.extractSimulatedFeatures(imageData)
            };
            
            return { success: true, faceData: faceData };
        } catch (error) {
            console.error('Frame capture failed:', error);
            return { success: false, error: `Failed to capture image: ${error.message}` };
        }
    }

    extractSimulatedFeatures(imageData) {
        // In a real system, this would use face recognition algorithms
        // For demo, we'll generate simulated facial features
        const hash = this.simpleHash(imageData);
        return {
            faceId: hash.substring(0, 16),
            landmarks: this.generateSimulatedLandmarks(),
            encoding: this.generateSimulatedEncoding()
        };
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    generateSimulatedLandmarks() {
        // Simulate facial landmark points
        const landmarks = [];
        for (let i = 0; i < 68; i++) {
            landmarks.push({
                x: Math.random() * 640,
                y: Math.random() * 480
            });
        }
        return landmarks;
    }

    generateSimulatedEncoding() {
        // Simulate face encoding vector
        const encoding = [];
        for (let i = 0; i < 128; i++) {
            encoding.push(Math.random() * 2 - 1); // Values between -1 and 1
        }
        return encoding;
    }

    compareFaces(faceData1, faceData2, threshold = 0.6) {
        // In a real system, this would compare actual face encodings
        // For demo, we'll simulate face comparison
        if (!faceData1 || !faceData2) {
            return { match: false, confidence: 0 };
        }

        // Simulate comparison based on face IDs (simplified)
        const similarity = faceData1.features.faceId === faceData2.features.faceId ? 
            0.95 : Math.random() * 0.5;
        
        return {
            match: similarity >= threshold,
            confidence: similarity
        };
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        this.isInitialized = false;
    }

    // Face detection simulation (in real app, would use ML libraries)
    detectFace(imageData) {
        // Simulate face detection
        return {
            detected: Math.random() > 0.1, // 90% success rate
            boundingBox: {
                x: Math.random() * 200 + 100,
                y: Math.random() * 150 + 75,
                width: Math.random() * 200 + 200,
                height: Math.random() * 250 + 250
            },
            confidence: Math.random() * 0.3 + 0.7
        };
    }

    // Utility methods
    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    async getAvailableCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Failed to get camera devices:', error);
            return [];
        }
    }
}

// Face Recognition Service (Simplified)
class FaceRecognitionService {
    constructor() {
        this.enrolledFaces = this.loadEnrolledFaces();
    }

    loadEnrolledFaces() {
        // Load enrolled faces from localStorage
        return JSON.parse(localStorage.getItem('enrolledFaces') || '{}');
    }

    saveEnrolledFaces() {
        localStorage.setItem('enrolledFaces', JSON.stringify(this.enrolledFaces));
    }

    enrollFace(employeeId, faceData) {
        // Store face data for employee
        this.enrolledFaces[employeeId] = {
            ...faceData,
            enrolledDate: new Date().toISOString()
        };
        this.saveEnrolledFaces();
        return true;
    }

    recognizeFace(faceData, threshold = 0.6) {
        // Compare against all enrolled faces
        let bestMatch = null;
        let bestConfidence = 0;

        for (const [employeeId, enrolledFace] of Object.entries(this.enrolledFaces)) {
            const comparison = this.compareFaceEncodings(
                faceData.features.encoding,
                enrolledFace.features.encoding
            );

            if (comparison.confidence > bestConfidence && comparison.confidence >= threshold) {
                bestMatch = employeeId;
                bestConfidence = comparison.confidence;
            }
        }

        return {
            employeeId: bestMatch,
            confidence: bestConfidence,
            recognized: bestMatch !== null
        };
    }

    compareFaceEncodings(encoding1, encoding2) {
        // Simplified face encoding comparison
        if (!encoding1 || !encoding2 || encoding1.length !== encoding2.length) {
            return { confidence: 0 };
        }

        // Calculate Euclidean distance
        let distance = 0;
        for (let i = 0; i < encoding1.length; i++) {
            distance += Math.pow(encoding1[i] - encoding2[i], 2);
        }
        distance = Math.sqrt(distance);

        // Convert distance to confidence (0-1)
        const confidence = Math.max(0, 1 - (distance / 10));
        return { confidence };
    }

    removeFace(employeeId) {
        delete this.enrolledFaces[employeeId];
        this.saveEnrolledFaces();
        return true;
    }

    getFaceCount() {
        return Object.keys(this.enrolledFaces).length;
    }
}

// Initialize services
const cameraManager = new CameraManager();
const faceRecognition = new FaceRecognitionService();

// Utility functions for camera operations
function showCameraError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'camera-error';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
    
    // Add error styles if not already present
    if (!document.querySelector('.camera-error-styles')) {
        const style = document.createElement('style');
        style.className = 'camera-error-styles';
        style.textContent = `
            .camera-error {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fed7d7;
                color: #c53030;
                padding: 15px 20px;
                border-radius: 8px;
                border-left: 4px solid #e53e3e;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                max-width: 300px;
            }
            .error-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .error-content i {
                font-size: 1.2rem;
            }
            .error-content p {
                margin: 0;
                font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function showCameraSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'camera-success';
    successDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <p>${message}</p>
        </div>
    `;
    
    // Add success styles if not already present
    if (!document.querySelector('.camera-success-styles')) {
        const style = document.createElement('style');
        style.className = 'camera-success-styles';
        style.textContent = `
            .camera-success {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #c6f6d5;
                color: #2f855a;
                padding: 15px 20px;
                border-radius: 8px;
                border-left: 4px solid #48bb78;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                max-width: 300px;
            }
            .success-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .success-content i {
                font-size: 1.2rem;
            }
            .success-content p {
                margin: 0;
                font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(successDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}