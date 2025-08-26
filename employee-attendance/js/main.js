// Main Login Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in - but only redirect if they explicitly want to
    // Don't auto-redirect on page load to prevent abrupt redirects
    console.log('Page loaded - checking for existing session...');
    if (authManager.currentUser) {
        console.log('Existing session found for user:', authManager.currentUser.id);
        console.log('User can manually navigate using the navigation buttons');
        // Show a notification instead of auto-redirecting
        setTimeout(() => {
            showNotification(`Welcome back, ${authManager.currentUser.firstName}! You can navigate to your dashboard using the buttons below.`, 'success');
        }, 1000);
    }

    // Initialize page elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('captureBtn');
    const proceedBtn = document.getElementById('proceedBtn');
    const employeeIdInput = document.getElementById('employeeId');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const faceSection = document.getElementById('faceSection');

    let capturedFaceData = null;
    let cameraInitialized = false;
    let authenticatedUser = null;

    // Event listeners
    console.log('Setting up event listeners...');
    console.log('loginBtn:', loginBtn);
    console.log('captureBtn:', captureBtn);
    console.log('proceedBtn:', proceedBtn);
    
    loginBtn.addEventListener('click', handlePasswordLogin);
    captureBtn.addEventListener('click', handleFaceCapture);
    
    // Add multiple event listeners to ensure the proceed button works
    proceedBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Proceed button clicked!');
        
        // Direct navigation to dashboard (no face capture required)
        if (authenticatedUser && authManager.currentUser) {
            console.log('Navigating authenticated user to dashboard');
            console.log('Current user before navigation:', authManager.currentUser);
            
            // Ensure session is saved before navigation
            authManager.updateSessionData();
            localStorage.setItem('currentUser', JSON.stringify(authManager.currentUser));
            
            const dashboardUrl = window.location.origin + window.location.pathname.replace('index.html', '') + 'dashboard.html';
            console.log('Navigating to:', dashboardUrl);
            window.location.href = dashboardUrl;
        } else {
            showError('Authentication error. Please refresh and try again.');
        }
    });
    
    // Also add a backup click handler
    proceedBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Proceed button onclick triggered!');
        
        // Direct navigation to dashboard (no face capture required)
        if (authenticatedUser && authManager.currentUser) {
            console.log('Navigating authenticated user to dashboard (onclick)');
            console.log('Current user before navigation:', authManager.currentUser);
            
            // Ensure session is saved before navigation
            authManager.updateSessionData();
            localStorage.setItem('currentUser', JSON.stringify(authManager.currentUser));
            
            const dashboardUrl = window.location.origin + window.location.pathname.replace('index.html', '') + 'dashboard.html';
            console.log('Navigating to:', dashboardUrl);
            window.location.href = dashboardUrl;
        } else {
            showError('Authentication error. Please refresh and try again.');
        }
    };
    
    console.log('Event listeners set up complete');
    
    // Enter key handlers
    employeeIdInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });
    
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handlePasswordLogin();
        }
    });

    // Initialize camera (only when needed)
    async function initializeCamera() {
        if (!cameraManager.isSupported()) {
            showError('Camera not supported on this device');
            captureBtn.disabled = true;
            return false;
        }

        try {
            showLoading('Initializing camera...');
            const result = await cameraManager.initialize(video, canvas);
            
            if (result.success) {
                cameraInitialized = true;
                captureBtn.disabled = false;
                updateCaptureButton('ready');
                hideLoading();
                showSuccess('Camera ready for face capture');
                return true;
            } else {
                showError(result.error);
                captureBtn.disabled = true;
                hideLoading();
                return false;
            }
        } catch (error) {
            console.error('Camera initialization error:', error);
            showError('Failed to initialize camera');
            captureBtn.disabled = true;
            hideLoading();
            return false;
        }
    }

    // Handle password login (first step)
    async function handlePasswordLogin() {
        const employeeId = employeeIdInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!employeeId) {
            showError('Please enter your Employee ID');
            employeeIdInput.focus();
            return;
        }

        if (!password) {
            showError('Please enter your password');
            passwordInput.focus();
            return;
        }

        try {
            loginBtn.disabled = true;
            updateLoginButton('logging-in');

            // Attempt password authentication
            const result = await authManager.loginWithPassword(employeeId, password);
            
            if (result.success) {
                authenticatedUser = result.user;
                showSuccess('Login successful!');
                
                // Set current user and session immediately
                authManager.currentUser = result.user;
                authManager.updateSessionData();
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                
                // Hide login form
                document.querySelector('.login-form-section').style.display = 'none';
                
                // Show face capture section but hide the capture button (navigation buttons are in this section)
                faceSection.style.display = 'block';
                
                // Immediately show navigation buttons based on isAdmin value
                updateNavigationForRole(result.user);
                
            } else {
                showError(result.message);
                updateLoginButton('ready');
            }
        } catch (error) {
            console.error('Password login error:', error);
            showError('Login failed. Please try again.');
            updateLoginButton('ready');
        } finally {
            setTimeout(() => {
                loginBtn.disabled = false;
            }, 2000);
        }
    }

    // Handle face capture
    async function handleFaceCapture() {
        console.log('=== HANDLE FACE CAPTURE CALLED ===');
        console.log('cameraInitialized:', cameraInitialized);
        console.log('cameraManager.demoMode:', cameraManager.demoMode);
        
        if (!cameraInitialized) {
            showError('Camera not initialized');
            return;
        }

        // Skip video checks if we're in demo mode
        if (!cameraManager.demoMode) {
            // Check if video is playing and has valid dimensions (only for real camera mode)
            if (!video || video.readyState < 2) {
                showError('Camera is still loading. Please wait a moment and try again.');
                return;
            }

            if (video.videoWidth === 0 || video.videoHeight === 0) {
                showError('Camera feed not ready. Please wait a moment and try again.');
                return;
            }
        } else {
            console.log('Demo mode detected - skipping video readiness checks');
        }

        try {
            captureBtn.disabled = true;
            updateCaptureButton('capturing');

            // Add a small delay to ensure video frame is stable (shorter for demo mode)
            const delay = cameraManager.demoMode ? 100 : 500;
            await new Promise(resolve => setTimeout(resolve, delay));

            console.log('Calling cameraManager.captureFrame()...');
            // Capture frame
            const result = cameraManager.captureFrame();
            console.log('Capture result:', result);
            
            if (result.success) {
                capturedFaceData = result.faceData;
                updateCaptureButton('captured');
                showSuccess('Face captured successfully');
                
                // Keep capture button disabled after successful capture
                captureBtn.disabled = true;
                captureBtn.style.pointerEvents = 'none';
                captureBtn.style.opacity = '0.6';
                console.log('Face capture button disabled:', captureBtn.disabled);
                console.log('Face capture button style:', captureBtn.style.cssText);
                
                // This section is no longer needed since face capture is disabled
                console.log('Face capture disabled - navigation handled in password login');
                
                console.log('Face captured successfully, navigation updated');
                
                // Show preview (optional)
                showFacePreview(result.faceData.imageData);
            } else {
                console.log('Capture failed:', result.error);
                showError(result.error || 'Failed to capture face. Please try again.');
                updateCaptureButton('ready');
                // Only re-enable if capture failed
                setTimeout(() => {
                    captureBtn.disabled = false;
                }, 1000);
            }
        } catch (error) {
            console.error('Face capture error:', error);
            showError('Failed to capture face: ' + error.message);
            updateCaptureButton('ready');
            // Only re-enable if capture failed
            setTimeout(() => {
                captureBtn.disabled = false;
            }, 1000);
        }
    }

    // Handle face login (second step)
    async function handleFaceLogin() {
        console.log('=== HANDLE FACE LOGIN CALLED ===');
        console.log('authenticatedUser:', authenticatedUser);
        console.log('capturedFaceData:', capturedFaceData ? 'EXISTS' : 'MISSING');
        
        if (!authenticatedUser) {
            console.log('ERROR: No authenticated user');
            showError('Authentication error. Please refresh and try again.');
            return;
        }

        if (!capturedFaceData) {
            console.log('ERROR: No captured face data');
            showError('Please capture your face first');
            return;
        }

        try {
            proceedBtn.disabled = true;
            updateProceedButton('processing');

            console.log('Completing face login for user:', authenticatedUser.id);

            // Complete face authentication
            const result = await authManager.completeFaceLogin(authenticatedUser, capturedFaceData);
            
            console.log('Face login result:', result);
            
            if (result.success) {
                showSuccess('Login successful!');
                
                // Stop camera
                console.log('Stopping camera...');
                if (cameraManager) {
                    cameraManager.stop();
                }
                
                // Ensure the session is properly saved before navigation
                console.log('Ensuring session is saved...');
                authManager.currentUser = result.user;
                authManager.updateSessionData();
                
                // Also save current user to localStorage
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                
                // Update navigation buttons based on user role
                updateNavigationForRole(authenticatedUser);
                
                // Don't auto-redirect, let user choose their destination
                console.log('Face login completed. User can now choose their destination.');
            } else {
                console.log('Face login failed:', result.message);
                showError(result.message);
                updateProceedButton('ready');
                
                // Clear captured face data on failed login
                capturedFaceData = null;
                updateCaptureButton('ready');
                captureBtn.disabled = false;
            }
        } catch (error) {
            console.error('Face login error:', error);
            showError('Face verification failed. Please try again.');
            updateProceedButton('ready');
            proceedBtn.disabled = false;
        }
    }

    // Navigation Functions
    function showNavigationButtons() {
        // Initially show both buttons, will be filtered by role after face login
        proceedBtn.style.display = 'block';
        proceedBtn.disabled = false;
        
        // Admin link is always visible in HTML, will be hidden for non-admins
        const adminLink = document.querySelector('.admin-link');
        if (adminLink) {
            adminLink.style.display = 'block';
        }
    }

    function updateNavigationForRole(user) {
        console.log('Updating navigation for user role using isAdmin value');
        console.log('User ID:', user.id);
        console.log('User permissions:', user.permissions);
        console.log('isAdmin value:', user.permissions?.isAdmin);
        
        const adminLink = document.querySelector('.admin-link');
        
        // Check isAdmin value - either/or logic
        const isAdmin = user.permissions && user.permissions.isAdmin === 1;
        
        if (isAdmin) {
            // isAdmin = 1: Hide/deactivate "Proceed to Dashboard", Display/activate "Admin Panel"
            console.log('isAdmin = 1: Hiding dashboard button, showing admin panel link');
            
            // Hide and deactivate Proceed to Dashboard button
            proceedBtn.style.display = 'none';
            proceedBtn.disabled = true;
            
            // Display and activate Admin Panel link
            if (adminLink) {
                adminLink.style.display = 'block';
                adminLink.innerHTML = '<button onclick="window.location.href=\'admin.html\'" class="admin-btn"><i class="fas fa-cog"></i> Go to Admin Panel</button>';
            }
            
            showSuccess('Administrator access granted. Click "Go to Admin Panel" to continue...');
        } else {
            // isAdmin = 0: Display/activate "Proceed to Dashboard", Hide/deactivate "Admin Panel"
            console.log('isAdmin = 0: Showing dashboard button, hiding admin panel link');
            
            // Display and activate Proceed to Dashboard button
            proceedBtn.style.display = 'block';
            proceedBtn.disabled = false;
            proceedBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Go to Dashboard';
            
            // Hide and deactivate Admin Panel link
            if (adminLink) {
                adminLink.style.display = 'none';
            }
            
            showSuccess('Employee access granted. Click "Go to Dashboard" to continue...');
        }
    }

    // UI Update Functions
    function updateCaptureButton(state) {
        if (!captureBtn) {
            console.error('Capture button not found');
            return;
        }
        
        const icon = captureBtn.querySelector('i');
        const text = captureBtn.querySelector('span') || captureBtn;
        
        switch (state) {
            case 'ready':
                if (icon) icon.className = 'fas fa-camera';
                if (text) text.textContent = 'Capture Face';
                captureBtn.className = 'capture-btn';
                break;
            case 'capturing':
                if (icon) icon.className = 'fas fa-spinner fa-spin';
                if (text) text.textContent = 'Capturing...';
                captureBtn.className = 'capture-btn capturing';
                break;
            case 'captured':
                if (icon) icon.className = 'fas fa-check';
                if (text) text.textContent = 'Face Captured';
                captureBtn.className = 'capture-btn captured';
                break;
        }
    }

    function updateLoginButton(state) {
        if (!loginBtn) {
            console.error('Login button not found');
            return;
        }
        
        const icon = loginBtn.querySelector('i');
        const text = loginBtn.querySelector('span') || loginBtn;
        
        switch (state) {
            case 'ready':
                if (icon) icon.className = 'fas fa-sign-in-alt';
                if (text) text.textContent = 'Sign In';
                loginBtn.className = 'login-btn';
                break;
            case 'logging-in':
                if (icon) icon.className = 'fas fa-spinner fa-spin';
                if (text) text.textContent = 'Signing In...';
                loginBtn.className = 'login-btn logging-in';
                break;
        }
    }

    function updateProceedButton(state) {
        if (!proceedBtn) {
            console.error('Proceed button not found');
            return;
        }
        
        const icon = proceedBtn.querySelector('i');
        const text = proceedBtn.querySelector('span') || proceedBtn;
        
        switch (state) {
            case 'ready':
                if (icon) icon.className = 'fas fa-arrow-right';
                if (text) text.textContent = 'Proceed to Dashboard';
                proceedBtn.className = 'proceed-btn';
                break;
            case 'processing':
                if (icon) icon.className = 'fas fa-spinner fa-spin';
                if (text) text.textContent = 'Verifying...';
                proceedBtn.className = 'proceed-btn processing';
                break;
        }
    }

    function showFacePreview(imageData) {
        // Remove existing preview
        const existingPreview = document.querySelector('.face-preview');
        if (existingPreview) {
            existingPreview.remove();
        }

        // Create preview element
        const preview = document.createElement('div');
        preview.className = 'face-preview';
        preview.innerHTML = `
            <div class="preview-content">
                <img src="${imageData}" alt="Captured face">
                <div class="preview-overlay">
                    <i class="fas fa-check-circle"></i>
                    <span>Face Captured</span>
                </div>
            </div>
        `;

        // Add preview styles
        if (!document.querySelector('.face-preview-styles')) {
            const style = document.createElement('style');
            style.className = 'face-preview-styles';
            style.textContent = `
                .face-preview {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    width: 150px;
                    height: 120px;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                }
                .preview-content {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                .preview-content img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .preview-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(72, 187, 120, 0.9);
                    color: white;
                    padding: 5px;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    justify-content: center;
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(preview);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (preview.parentNode) {
                preview.remove();
            }
        }, 5000);
    }

    // Utility Functions
    function showLoading(message) {
        const loading = document.createElement('div');
        loading.id = 'loading-indicator';
        loading.className = 'loading-indicator';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;

        // Add loading styles
        if (!document.querySelector('.loading-styles')) {
            const style = document.createElement('style');
            style.className = 'loading-styles';
            style.textContent = `
                .loading-indicator {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                .loading-content {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e2e8f0;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .loading-content p {
                    margin: 0;
                    color: #4a5568;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(loading);
    }

    function hideLoading() {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.remove();
        }
    }

    function showError(message) {
        showNotification(message, 'error');
    }

    function showSuccess(message) {
        showNotification(message, 'success');
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
                <p>${message}</p>
                <button class="close-notification">&times;</button>
            </div>
        `;

        // Add notification styles
        if (!document.querySelector('.notification-styles')) {
            const style = document.createElement('style');
            style.className = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 350px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    animation: slideInRight 0.3s ease;
                }
                .notification.error {
                    background: #fed7d7;
                    color: #c53030;
                    border-left: 4px solid #e53e3e;
                }
                .notification.success {
                    background: #c6f6d5;
                    color: #2f855a;
                    border-left: 4px solid #48bb78;
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .notification-content i {
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }
                .notification-content p {
                    margin: 0;
                    font-size: 0.9rem;
                    flex: 1;
                }
                .close-notification {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    color: inherit;
                    opacity: 0.7;
                    flex-shrink: 0;
                }
                .close-notification:hover {
                    opacity: 1;
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Handle close button
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (cameraManager) {
            cameraManager.stop();
        }
    });

    // Add some demo instructions
    setTimeout(() => {
        if (!capturedFaceData) {
            showNotification('Demo: Use Employee ID "ADMIN001", "EMP001", or "EMP002" to test login', 'success');
        }
    }, 2000);
});