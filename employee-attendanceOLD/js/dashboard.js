// Employee Dashboard Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Immediately start the clock regardless of authentication status
    console.log('DOM loaded - starting emergency clock...');
    startEmergencyClock();
    // Immediate authentication check
    console.log('=== EMPLOYEE DASHBOARD AUTHENTICATION CHECK ===');
    console.log('Current URL:', window.location.href);
    
    // Check if authManager is available
    if (typeof authManager === 'undefined') {
        console.error('AuthManager not loaded - but continuing anyway');
        // Don't redirect, just continue
    }
    
    // Add a small delay to ensure session data is loaded
    console.log('Checking authentication...');
    console.log('AuthManager currentUser before requireAuth:', authManager?.currentUser);
    console.log('LocalStorage currentUser:', localStorage.getItem('currentUser'));
    console.log('LocalStorage sessionData:', localStorage.getItem('sessionData'));
    
    // Try to load session if currentUser is null
    if (authManager && !authManager.currentUser) {
        console.log('No currentUser found, attempting to load session...');
        const sessionLoaded = authManager.loadSession();
        console.log('Session load result:', sessionLoaded);
        console.log('AuthManager currentUser after loadSession:', authManager.currentUser);
    }
    
    // Get current user but don't redirect if not found
    const currentUser = authManager?.currentUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) {
        console.log('No current user found - but continuing anyway');
        // Don't redirect, just continue with limited functionality
    } else {
        console.log('Authentication successful for user:', currentUser.id);
    }
    
    // Role-based access control: Allow all authenticated users to access dashboard
    console.log('=== DASHBOARD ACCESS CHECK ===');
    console.log('Current user authority (legacy):', currentUser.authority);
    console.log('Current user permissions:', currentUser.permissions);
    
    // Check if user is administrator using new permissions system
    const isAdmin = currentUser.permissions && currentUser.permissions.isAdmin === 1;
    const isLegacyAdmin = currentUser.authority === 'administrator'; // Backward compatibility
    
    if (isAdmin || isLegacyAdmin) {
        console.log('Administrator accessing employee dashboard - access granted');
        console.log('Admin check - permissions.isAdmin:', currentUser.permissions?.isAdmin);
        console.log('Admin check - legacy authority:', currentUser.authority);
        // Allow administrators to access dashboard - no redirect
    }
    
    console.log('Dashboard access granted for user:', currentUser.id);

    // Face capture modal variables
    let faceCaptureModal = null;
    let faceVideo = null;
    let faceCanvas = null;
    let capturedFaceData = null;
    let currentAction = null; // 'time-in' or 'time-out'
    let faceCameraInitialized = false;
    
    // Initialize dashboard
    console.log('Starting dashboard initialization...');
    initializeDashboard();
    setupEventListeners();
    console.log('Starting real-time clock...');
    startRealTimeClock();
    loadTodaysSummary();
    loadScheduleInfo();
    loadRecentAttendance();
    loadLeaveInfo();

    // Dashboard initialization
    function initializeDashboard() {
        // Set user info
        document.getElementById('employee-name').textContent =
            `${currentUser.firstName} ${currentUser.lastName}`;
        document.getElementById('employee-id').textContent =
            `ID: ${currentUser.id}`;

        // Initialize face capture modal elements
        initializeFaceCaptureModal();
        
        // Check current clock status
        updateClockStatus();
        
        // Update UI based on permissions
        updatePermissionBasedUI();
    }

    // Initialize face capture modal
    function initializeFaceCaptureModal() {
        faceCaptureModal = document.getElementById('face-capture-modal');
        faceVideo = document.getElementById('face-video');
        faceCanvas = document.getElementById('face-canvas');
        
        // Setup modal event listeners
        const closeFaceModal = document.getElementById('close-face-modal');
        const cancelFaceCapture = document.getElementById('cancel-face-capture');
        const proceedWithAction = document.getElementById('proceed-with-action');
        
        closeFaceModal.addEventListener('click', hideFaceCaptureModal);
        cancelFaceCapture.addEventListener('click', hideFaceCaptureModal);
        proceedWithAction.addEventListener('click', handleProceedWithAction);
        
        // Close modal when clicking outside
        faceCaptureModal.addEventListener('click', (e) => {
            if (e.target === faceCaptureModal) {
                hideFaceCaptureModal();
            }
        });
    }

    // Update UI based on user permissions
    function updatePermissionBasedUI() {
        if (!currentUser || !currentUser.permissions) {
            console.log('No permissions found, using default employee view');
            return;
        }

        const permissions = currentUser.permissions;
        console.log('Updating dashboard UI based on permissions:', permissions);

        // Show/hide leave approval features if user can approve leaves
        const approvalSection = document.querySelector('.leave-approval-section');
        if (approvalSection) {
            if (permissions.canApproveLeaves === 1) {
                approvalSection.style.display = 'block';
                console.log('User can approve leaves - showing approval section');
            } else {
                approvalSection.style.display = 'none';
                console.log('User cannot approve leaves - hiding approval section');
            }
        }

        // Show/hide employee management features
        const employeeManagementSection = document.querySelector('.employee-management-section');
        if (employeeManagementSection) {
            if (permissions.canManageEmployees === 1) {
                employeeManagementSection.style.display = 'block';
                console.log('User can manage employees - showing management section');
            } else {
                employeeManagementSection.style.display = 'none';
                console.log('User cannot manage employees - hiding management section');
            }
        }

        // Update user role display
        const roleElement = document.getElementById('user-role');
        if (roleElement) {
            let roleText = 'Employee';
            if (permissions.canApproveLeaves === 1) {
                roleText = 'Manager';
            }
            if (permissions.canManageEmployees === 1) {
                roleText = 'HR Manager';
            }
            roleElement.textContent = roleText;
        }

        // Show user's groups
        const groupsElement = document.getElementById('user-groups');
        if (groupsElement && currentUser.groups && currentUser.groups.length > 0) {
            groupsElement.textContent = currentUser.groups.join(', ');
        }

        // Show additional permissions info in console for debugging
        console.log('Permission-based UI updates:');
        console.log('- Can approve leaves:', permissions.canApproveLeaves === 1);
        console.log('- Can manage employees:', permissions.canManageEmployees === 1);
        console.log('- Is allowed leaves:', permissions.isAllowedLeaves === 1);
        console.log('- Can approve leaves from other groups:', permissions.canApproveLeaveFromOtherGroups === 1);
        console.log('- User groups:', currentUser.groups);
    }

    // Event listeners
    function setupEventListeners() {
        // Clock in/out buttons - now show face capture modal
        document.getElementById('time-in-btn').addEventListener('click', () => showFaceCaptureModal('time-in'));
        document.getElementById('time-out-btn').addEventListener('click', () => showFaceCaptureModal('time-out'));
        
        // Leave request
        document.getElementById('request-leave-btn').addEventListener('click', showLeaveModal);
        
        // Leave modal
        const leaveModal = document.getElementById('leave-modal');
        const closeModal = leaveModal.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-leave-btn');
        const leaveForm = document.getElementById('leave-form');
        
        closeModal.addEventListener('click', hideLeaveModal);
        cancelBtn.addEventListener('click', hideLeaveModal);
        leaveForm.addEventListener('submit', handleLeaveRequest);
        
        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            handleLogout();
        });

        // Auto-refresh data every minute
        setInterval(() => {
            loadTodaysSummary();
            updateClockStatus();
        }, 60000);
    }

    // Real-time clock
    function startRealTimeClock() {
        function updateClock() {
            try {
                // Get current time and add 8 hours for Philippines timezone (UTC+8)
                const now = new Date();
                const philippinesOffset = 8 * 60; // 8 hours in minutes
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const philippinesTime = new Date(utc + (philippinesOffset * 60000));
                
                // Format time as 12-hour format with AM/PM
                const hours24 = philippinesTime.getHours();
                const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
                const minutes = philippinesTime.getMinutes().toString().padStart(2, '0');
                const seconds = philippinesTime.getSeconds().toString().padStart(2, '0');
                const ampm = hours24 >= 12 ? 'PM' : 'AM';
                const timeString = `${hours12}:${minutes}:${seconds} ${ampm}`;
                
                // Format date
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const dateString = philippinesTime.toLocaleDateString('en-US', options);
                
                // Update the DOM elements
                const timeElement = document.getElementById('current-time');
                const dateElement = document.getElementById('current-date');
                
                if (timeElement) {
                    timeElement.textContent = timeString;
                }
                if (dateElement) {
                    dateElement.textContent = dateString;
                }
                
                console.log('Clock updated:', timeString, dateString);
            } catch (error) {
                console.error('Clock update error:', error);
            }
        }
        
        // Update immediately and then every second
        updateClock();
        setInterval(updateClock, 1000);
    }

    // Face Capture Modal Functions
    async function showFaceCaptureModal(action) {
        currentAction = action;
        capturedFaceData = null;
        
        // Update modal title and button text
        const title = document.getElementById('face-capture-title');
        const actionText = document.getElementById('action-text');
        const proceedBtn = document.getElementById('proceed-with-action');
        
        if (action === 'time-in') {
            title.textContent = 'Time In - Face Verification';
            actionText.textContent = 'Time In';
            proceedBtn.innerHTML = '<i class="fas fa-play"></i> <span id="action-text">Time In</span>';
        } else {
            title.textContent = 'Time Out - Face Verification';
            actionText.textContent = 'Time Out';
            proceedBtn.innerHTML = '<i class="fas fa-stop"></i> <span id="action-text">Time Out</span>';
        }
        
        // Initially disable the proceed button
        proceedBtn.disabled = true;
        proceedBtn.style.opacity = '0.5';
        proceedBtn.style.cursor = 'not-allowed';
        
        // Show modal
        faceCaptureModal.style.display = 'block';
        
        // Initialize camera
        try {
            updateFaceCaptureStatus('initializing', 'Initializing camera...');
            
            if (!cameraManager.isSupported()) {
                updateFaceCaptureStatus('error', 'Camera not supported on this device');
                return;
            }
            
            const result = await cameraManager.initialize(faceVideo, faceCanvas);
            
            if (result.success) {
                faceCameraInitialized = true;
                updateFaceCaptureStatus('ready', 'Auto-capturing face...');
                
                // Auto-capture immediately after camera is ready
                setTimeout(() => {
                    if (faceCameraInitialized && faceCaptureModal.style.display === 'block') {
                        handleFaceCapture();
                    }
                }, 1000);
            } else {
                updateFaceCaptureStatus('error', result.error || 'Failed to initialize camera');
            }
        } catch (error) {
            console.error('Camera initialization error:', error);
            updateFaceCaptureStatus('error', 'Failed to initialize camera');
        }
    }
    
    function hideFaceCaptureModal() {
        faceCaptureModal.style.display = 'none';
        
        // Stop camera
        if (cameraManager && faceCameraInitialized) {
            cameraManager.stop();
            faceCameraInitialized = false;
        }
        
        // Reset state
        capturedFaceData = null;
        currentAction = null;
        updateFaceCaptureStatus('ready', 'Position your face in the camera');
    }
    
    async function handleFaceCapture() {
        if (!faceCameraInitialized) {
            updateFaceCaptureStatus('error', 'Camera not initialized');
            return;
        }
        
        try {
            updateFaceCaptureStatus('capturing', 'Capturing face...');
            
            // Add a small delay to ensure video frame is stable
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Capture frame
            const result = cameraManager.captureFrame();
            
            if (result.success) {
                capturedFaceData = result.faceData;
                updateFaceCaptureStatus('captured', 'Face captured successfully! Click Proceed to continue.');
                
                // Enable proceed button after successful capture
                const proceedBtn = document.getElementById('proceed-with-action');
                proceedBtn.disabled = false;
                proceedBtn.style.opacity = '1';
                proceedBtn.style.cursor = 'pointer';
                
            } else {
                updateFaceCaptureStatus('error', result.error || 'Failed to capture face. Retrying...');
                
                // Retry after a delay
                setTimeout(() => {
                    if (faceCameraInitialized && faceCaptureModal.style.display === 'block') {
                        handleFaceCapture();
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Face capture error:', error);
            updateFaceCaptureStatus('error', 'Failed to capture face: ' + error.message);
        }
    }
    
    async function handleProceedWithAction() {
        if (!capturedFaceData) {
            showNotification('Please wait for face capture to complete', 'error');
            return;
        }
        
        if (!currentAction) {
            showNotification('No action specified', 'error');
            return;
        }
        
        try {
            const proceedBtn = document.getElementById('proceed-with-action');
            proceedBtn.disabled = true;
            updateFaceCaptureStatus('processing', 'Verifying face and processing...');
            
            // Verify face
            const verification = await authManager.verifyFace(currentUser.id, capturedFaceData);
            if (!verification.success) {
                showNotification(verification.message, 'error');
                updateFaceCaptureStatus('error', 'Face verification failed');
                proceedBtn.disabled = false;
                return;
            }
            
            // Perform the action
            let clockResult;
            if (currentAction === 'time-in') {
                clockResult = db.clockIn(currentUser.id, new Date(), capturedFaceData);
                if (clockResult.success) {
                    showNotification('Successfully clocked in!', 'success');
                    authManager.logActivity('clock_in', currentUser.id, {
                        timestamp: clockResult.record.timeIn
                    });
                }
            } else if (currentAction === 'time-out') {
                clockResult = db.clockOut(currentUser.id, new Date(), capturedFaceData);
                if (clockResult.success) {
                    showNotification(`Successfully clocked out! Hours worked: ${clockResult.record.hoursWorked}h`, 'success');
                    authManager.logActivity('clock_out', currentUser.id, {
                        timestamp: clockResult.record.timeOut,
                        hoursWorked: clockResult.record.hoursWorked
                    });
                }
            }
            
            if (clockResult.success) {
                // Update UI
                updateClockStatus();
                loadTodaysSummary();
                
                // Close modal
                hideFaceCaptureModal();
            } else {
                showNotification(clockResult.message, 'error');
                updateFaceCaptureStatus('error', clockResult.message);
                proceedBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Action processing error:', error);
            showNotification('Failed to process action. Please try again.', 'error');
            updateFaceCaptureStatus('error', 'Processing failed');
            document.getElementById('proceed-with-action').disabled = false;
        }
    }
    
    function updateFaceCaptureStatus(status, message) {
        const statusElement = document.getElementById('face-capture-status');
        const icon = statusElement.querySelector('i');
        const text = statusElement.querySelector('span');
        
        switch (status) {
            case 'initializing':
                icon.className = 'fas fa-spinner fa-spin';
                text.textContent = message || 'Initializing camera...';
                statusElement.className = 'capture-status initializing';
                break;
            case 'ready':
                icon.className = 'fas fa-camera';
                text.textContent = message || 'Position your face in the camera';
                statusElement.className = 'capture-status ready';
                break;
            case 'capturing':
                icon.className = 'fas fa-spinner fa-spin';
                text.textContent = message || 'Capturing face...';
                statusElement.className = 'capture-status capturing';
                break;
            case 'captured':
                icon.className = 'fas fa-check';
                text.textContent = message || 'Face captured successfully';
                statusElement.className = 'capture-status captured';
                break;
            case 'processing':
                icon.className = 'fas fa-spinner fa-spin';
                text.textContent = message || 'Processing...';
                statusElement.className = 'capture-status processing';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-triangle';
                text.textContent = message || 'Camera error';
                statusElement.className = 'capture-status error';
                break;
        }
    }

    function updateClockStatus() {
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = db.getAttendance(today, currentUser.id);
        const activeRecord = todayAttendance.find(record => record.timeIn && !record.timeOut);
        
        const statusElement = document.getElementById('clock-status');
        const timeInBtn = document.getElementById('time-in-btn');
        const timeOutBtn = document.getElementById('time-out-btn');
        
        if (activeRecord) {
            // Currently clocked in
            statusElement.textContent = 'Clocked In';
            statusElement.className = 'status-in';
            timeInBtn.disabled = true;
            timeOutBtn.disabled = false;
        } else {
            // Currently clocked out
            statusElement.textContent = 'Clocked Out';
            statusElement.className = 'status-out';
            timeInBtn.disabled = false;
            timeOutBtn.disabled = true;
        }
    }

    // Load today's summary
    function loadTodaysSummary() {
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = db.getAttendance(today, currentUser.id);
        
        let timeIn = '--:--';
        let timeOut = '--:--';
        let hoursWorked = '0.0h';
        let overtimeHours = '0.0h';
        
        if (todayAttendance.length > 0) {
            const record = todayAttendance[0];
            if (record.timeIn) {
                timeIn = db.formatTime(record.timeIn);
            }
            if (record.timeOut) {
                timeOut = db.formatTime(record.timeOut);
                hoursWorked = record.hoursWorked + 'h';
                overtimeHours = record.overtimeHours + 'h';
            }
        }
        
        document.getElementById('time-in-today').textContent = timeIn;
        document.getElementById('time-out-today').textContent = timeOut;
        document.getElementById('hours-worked').textContent = hoursWorked;
        document.getElementById('overtime-hours').textContent = overtimeHours;
    }

    // Load schedule information
    function loadScheduleInfo() {
        const schedule = db.getSchedule(currentUser.scheduleGroup);
        
        if (schedule) {
            document.getElementById('schedule-type').textContent = schedule.name;
            
            if (schedule.workingHours.start === 'flexible') {
                document.getElementById('working-hours').textContent = 'Flexible Hours';
            } else {
                document.getElementById('working-hours').textContent = 
                    `${schedule.workingHours.start} - ${schedule.workingHours.end}`;
            }
            
            const offDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                .filter(day => !schedule.workingDays.includes(day))
                .map(day => day.charAt(0).toUpperCase() + day.slice(1))
                .join(', ');
            
            document.getElementById('days-off').textContent = offDays || 'None';
            
            // Update weekly schedule
            updateWeeklySchedule(schedule);
        }
    }

    function updateWeeklySchedule(schedule) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const today = new Date().getDay();
        const todayName = days[today === 0 ? 6 : today - 1]; // Convert Sunday=0 to Sunday=6
        
        days.forEach(day => {
            const dayElement = document.querySelector(`[data-day="${day}"]`);
            if (dayElement) {
                const statusElement = dayElement.querySelector('.day-status');
                const hoursElement = dayElement.querySelector('.day-hours');
                
                if (schedule.workingDays.includes(day)) {
                    statusElement.textContent = 'Work';
                    if (schedule.workingHours.start === 'flexible') {
                        hoursElement.textContent = 'Flexible';
                    } else {
                        hoursElement.textContent = `${schedule.workingHours.start}-${schedule.workingHours.end}`;
                    }
                    dayElement.classList.remove('off');
                } else {
                    statusElement.textContent = 'Off';
                    hoursElement.textContent = '--';
                    dayElement.classList.add('off');
                }
                
                // Highlight today
                if (day === todayName) {
                    dayElement.classList.add('today');
                }
            }
        });
    }

    // Load recent attendance
    function loadRecentAttendance() {
        const recentAttendance = db.getAttendance(null, currentUser.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 7);
        
        const attendanceList = document.getElementById('recent-attendance');
        attendanceList.innerHTML = '';
        
        if (recentAttendance.length === 0) {
            attendanceList.innerHTML = '<p class="no-data">No attendance records found</p>';
            return;
        }
        
        recentAttendance.forEach(record => {
            const recordElement = document.createElement('div');
            recordElement.className = 'attendance-record';
            
            const status = record.timeOut ? 'present' : (record.timeIn ? 'present' : 'absent');
            const statusClass = status === 'present' ? 'present' : 'absent';
            
            recordElement.innerHTML = `
                <div class="record-date">${db.formatDate(record.date)}</div>
                <div class="record-times">
                    <span>In: ${record.timeIn ? db.formatTime(record.timeIn) : '--:--'}</span>
                    <span>Out: ${record.timeOut ? db.formatTime(record.timeOut) : '--:--'}</span>
                </div>
                <div class="record-status ${statusClass}">${status}</div>
            `;
            
            attendanceList.appendChild(recordElement);
        });
    }

    // Load leave information
    function loadLeaveInfo() {
        // Update leave balances
        document.getElementById('annual-leave').textContent = `${currentUser.leaveCredits.annual} days`;
        document.getElementById('sick-leave').textContent = `${currentUser.leaveCredits.sick} days`;
        document.getElementById('emergency-leave').textContent = `${currentUser.leaveCredits.emergency} days`;
        
        // Load recent leave requests
        const leaveRequests = db.getLeaveRequests(currentUser.id)
            .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate))
            .slice(0, 5);
        
        const requestsList = document.getElementById('leave-requests');
        requestsList.innerHTML = '';
        
        if (leaveRequests.length === 0) {
            requestsList.innerHTML = '<p class="no-data">No leave requests found</p>';
            return;
        }
        
        leaveRequests.forEach(request => {
            const requestElement = document.createElement('div');
            requestElement.className = 'leave-request';
            
            const days = db.calculateDaysBetween(request.startDate, request.endDate);
            
            requestElement.innerHTML = `
                <div class="request-info">
                    <div class="request-type">${request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} Leave</div>
                    <div class="request-dates">${db.formatDate(request.startDate)} - ${db.formatDate(request.endDate)} (${days} days)</div>
                </div>
                <div class="request-status ${request.status}">${request.status}</div>
            `;
            
            requestsList.appendChild(requestElement);
        });
    }

    // Leave request modal
    function showLeaveModal() {
        const modal = document.getElementById('leave-modal');
        modal.style.display = 'block';
        
        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('start-date').min = tomorrow.toISOString().split('T')[0];
        document.getElementById('end-date').min = tomorrow.toISOString().split('T')[0];
    }

    function hideLeaveModal() {
        const modal = document.getElementById('leave-modal');
        modal.style.display = 'none';
        document.getElementById('leave-form').reset();
    }

    async function handleLeaveRequest(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const leaveData = {
            employeeId: currentUser.id,
            employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
            leaveType: document.getElementById('leave-type').value,
            startDate: document.getElementById('start-date').value,
            endDate: document.getElementById('end-date').value,
            reason: document.getElementById('leave-reason').value
        };
        
        // Validate dates
        const startDate = new Date(leaveData.startDate);
        const endDate = new Date(leaveData.endDate);
        
        if (endDate < startDate) {
            showNotification('End date cannot be before start date', 'error');
            return;
        }
        
        try {
            const result = db.submitLeaveRequest(leaveData);
            showNotification('Leave request submitted successfully!', 'success');
            hideLeaveModal();
            loadLeaveInfo();
            
            // Log activity
            authManager.logActivity('leave_request', currentUser.id, {
                leaveType: leaveData.leaveType,
                startDate: leaveData.startDate,
                endDate: leaveData.endDate
            });
        } catch (error) {
            console.error('Leave request error:', error);
            showNotification('Failed to submit leave request', 'error');
        }
    }

    // Utility function for notifications
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

        // Add notification styles if not present
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
                .no-data {
                    text-align: center;
                    color: #718096;
                    font-style: italic;
                    padding: 20px;
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

    // Handle logout (same as admin panel)
    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            authManager.logout();
        }
    }

    // Emergency clock function that runs immediately
    function startEmergencyClock() {
        console.log('Emergency clock started');
        
        function updateEmergencyClock() {
            try {
                // Get current time and add 8 hours for Philippines timezone (UTC+8)
                const now = new Date();
                const philippinesOffset = 8 * 60; // 8 hours in minutes
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const philippinesTime = new Date(utc + (philippinesOffset * 60000));
                
                // Format time as 12-hour format with AM/PM
                const hours24 = philippinesTime.getHours();
                const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
                const minutes = philippinesTime.getMinutes().toString().padStart(2, '0');
                const seconds = philippinesTime.getSeconds().toString().padStart(2, '0');
                const ampm = hours24 >= 12 ? 'PM' : 'AM';
                const timeString = `${hours12}:${minutes}:${seconds} ${ampm}`;
                
                // Format date
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const dateString = philippinesTime.toLocaleDateString('en-US', options);
                
                // Update the DOM elements
                const timeElement = document.getElementById('current-time');
                const dateElement = document.getElementById('current-date');
                
                if (timeElement) {
                    timeElement.textContent = timeString;
                    console.log('Time updated to:', timeString);
                } else {
                    console.log('Time element not found');
                }
                
                if (dateElement) {
                    dateElement.textContent = dateString;
                    console.log('Date updated to:', dateString);
                } else {
                    console.log('Date element not found');
                }
                
            } catch (error) {
                console.error('Emergency clock update error:', error);
            }
        }
        
        // Update immediately and then every second
        updateEmergencyClock();
        setInterval(updateEmergencyClock, 1000);
    }

    // Update start date when end date changes
    document.getElementById('start-date').addEventListener('change', function() {
        const startDate = this.value;
        document.getElementById('end-date').min = startDate;
    });
});