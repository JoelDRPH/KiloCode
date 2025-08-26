// Authentication and Authorization Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        this.sessionTimer = null;
        this.init();
    }

    init() {
        // Check for existing session
        console.log('=== AUTH MANAGER INITIALIZATION ===');
        const sessionLoaded = this.loadSession();
        console.log('Session loaded on init:', sessionLoaded);
        console.log('Current user after init:', this.currentUser);
        this.setupSessionTimeout();
    }

    loadSession() {
        console.log('=== LOADING SESSION ===');
        
        // Try multiple sources for user data
        let user = db.getCurrentUser();
        const sessionData = JSON.parse(localStorage.getItem('sessionData') || 'null');
        const currentUserData = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const userSession = JSON.parse(localStorage.getItem('userSession') || 'null');
        
        console.log('User from db.getCurrentUser():', user);
        console.log('Session data from localStorage:', sessionData);
        console.log('CurrentUser from localStorage:', currentUserData);
        console.log('UserSession from localStorage:', userSession);
        
        // If db.getCurrentUser() returns null, try multiple fallbacks
        if (!user && currentUserData) {
            console.log('Using currentUser from localStorage as fallback');
            user = currentUserData;
        }
        
        if (!user && userSession && userSession.user) {
            console.log('Using userSession from localStorage as fallback');
            user = userSession.user;
        }
        
        if (user && sessionData) {
            const now = new Date().getTime();
            const timeSinceLogin = now - sessionData.loginTime;
            console.log('Time since login:', timeSinceLogin, 'ms');
            console.log('Session timeout:', this.sessionTimeout, 'ms');
            
            if (timeSinceLogin < this.sessionTimeout) {
                this.currentUser = user;
                this.updateSessionData();
                console.log('Session loaded successfully for user:', user.id);
                return true;
            } else {
                // Session expired
                console.log('Session expired, logging out');
                this.logout();
            }
        } else if (user && !sessionData) {
            // User exists but no session data - create new session
            console.log('User exists but no session data, creating new session');
            this.currentUser = user;
            this.updateSessionData();
            console.log('New session created for user:', user.id);
            return true;
        } else {
            console.log('No valid user or session data found');
        }
        return false;
    }

    async loginWithPassword(employeeId, password) {
        try {
            console.log('Login attempt:', { employeeId, passwordLength: password?.length });
            
            // Validate inputs
            if (!employeeId || employeeId.trim() === '') {
                console.log('Login failed: Empty employee ID');
                return {
                    success: false,
                    message: 'Please enter your Employee ID'
                };
            }

            if (!password || password.trim() === '') {
                console.log('Login failed: Empty password');
                return {
                    success: false,
                    message: 'Please enter your password'
                };
            }

            // Check if database is properly initialized
            const employees = db.getEmployees();
            console.log('Available employees:', employees.length);
            console.log('Employee IDs:', employees.map(emp => emp.id));

            // Authenticate with database (password only)
            const user = db.authenticateWithPassword(employeeId, password);
            console.log('Authentication result:', user ? 'SUCCESS' : 'FAILED');
            
            if (!user) {
                console.log('Login failed: Invalid credentials');
                return {
                    success: false,
                    message: 'Invalid Employee ID or password'
                };
            }

            console.log('Login successful for user:', user.id);
            return {
                success: true,
                user: user,
                message: 'Password verified. Please capture your face to complete login.'
            };

        } catch (error) {
            console.error('Password login error:', error);
            return {
                success: false,
                message: 'Login failed. Please try again.'
            };
        }
    }

    async completeFaceLogin(user, faceData) {
        try {
            console.log('Starting face verification for user:', user.id);
            
            // Face verification
            const faceVerification = await this.verifyFace(user.id, faceData);
            console.log('Face verification result:', faceVerification);
            
            if (!faceVerification.success) {
                console.log('Face verification failed:', faceVerification.message);
                return {
                    success: false,
                    message: faceVerification.message
                };
            }

            console.log('Face verification successful, setting up session...');

            // Set current user and session
            this.currentUser = user;
            this.updateSessionData();
            this.setupSessionTimeout();

            // Ensure user is saved to localStorage with multiple fallbacks
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('userSession', JSON.stringify({
                user: user,
                loginTime: new Date().getTime(),
                sessionId: Date.now().toString()
            }));
            console.log('User session set in localStorage:', user.id);
            console.log('Session data saved with multiple fallbacks');

            // Log login activity
            this.logActivity('login', user.id);

            const redirectUrl = this.getRedirectUrl(user);
            console.log('Redirect URL determined:', redirectUrl);

            return {
                success: true,
                user: user,
                redirectUrl: redirectUrl
            };

        } catch (error) {
            console.error('Face login error:', error);
            return {
                success: false,
                message: 'Face verification failed. Please try again.'
            };
        }
    }

    async verifyFace(employeeId, faceData) {
        try {
            console.log('Verifying face for employee:', employeeId);
            
            // Check if face is enrolled for this employee
            const enrolledFaces = JSON.parse(localStorage.getItem('enrolledFaces') || '{}');
            console.log('Enrolled faces:', Object.keys(enrolledFaces));
            
            if (!enrolledFaces[employeeId]) {
                // No face enrolled, enroll this face
                console.log('No face enrolled for', employeeId, '- enrolling now');
                faceRecognition.enrollFace(employeeId, faceData);
                return {
                    success: true,
                    message: 'Face enrolled successfully'
                };
            }

            console.log('Face already enrolled for', employeeId, '- verifying...');
            
            // For demo purposes, make face verification more lenient
            // In a real system, this would use actual face recognition algorithms
            const simulatedSuccess = Math.random() > 0.1; // 90% success rate for demo
            
            if (simulatedSuccess) {
                console.log('Face verification successful (simulated)');
                return {
                    success: true,
                    confidence: 0.85
                };
            } else {
                console.log('Face verification failed (simulated)');
                return {
                    success: false,
                    message: 'Face verification failed. Please try again or contact administrator.'
                };
            }

        } catch (error) {
            console.error('Face verification error:', error);
            return {
                success: false,
                message: 'Face verification system error'
            };
        }
    }

    getRedirectUrl(user) {
        // Use new permissions system for redirect logic
        if (user.permissions && user.permissions.isAdmin === 1) {
            return 'admin.html';
        } else {
            return 'dashboard.html';
        }
        
        // Fallback to legacy authority system if permissions not available
        switch (user.authority) {
            case 'administrator':
                return 'admin.html';
            case 'department-head':
            case 'basic':
            default:
                return 'dashboard.html';
        }
    }

    logout() {
        if (this.currentUser) {
            this.logActivity('logout', this.currentUser.id);
        }

        // Clear session data
        this.currentUser = null;
        db.logout();
        localStorage.removeItem('sessionData');
        
        // Clear session timer
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }

        // Stop camera if active
        if (cameraManager) {
            cameraManager.stop();
        }

        // Redirect to login
        if (window.location.pathname !== '/index.html' && 
            !window.location.pathname.endsWith('index.html') &&
            window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }

    updateSessionData() {
        const sessionData = {
            loginTime: new Date().getTime(),
            lastActivity: new Date().getTime(),
            userId: this.currentUser?.id
        };
        localStorage.setItem('sessionData', JSON.stringify(sessionData));
    }

    setupSessionTimeout() {
        // Clear existing timer
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        // Set new timer
        this.sessionTimer = setTimeout(() => {
            this.showSessionExpiredDialog();
        }, this.sessionTimeout);
    }

    showSessionExpiredDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'session-expired-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <i class="fas fa-clock"></i>
                        <h3>Session Expired</h3>
                    </div>
                    <div class="dialog-body">
                        <p>Your session has expired for security reasons. Please log in again to continue.</p>
                    </div>
                    <div class="dialog-footer">
                        <button id="session-login-btn" class="btn btn-primary">
                            <i class="fas fa-sign-in-alt"></i> Login Again
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add dialog styles
        if (!document.querySelector('.session-dialog-styles')) {
            const style = document.createElement('style');
            style.className = 'session-dialog-styles';
            style.textContent = `
                .session-expired-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 9999;
                }
                .dialog-overlay {
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .dialog-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }
                .dialog-header {
                    padding: 20px 25px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .dialog-header i {
                    color: #ed8936;
                    font-size: 1.5rem;
                }
                .dialog-header h3 {
                    color: #2d3748;
                    margin: 0;
                }
                .dialog-body {
                    padding: 20px 25px;
                }
                .dialog-body p {
                    color: #4a5568;
                    margin: 0;
                    line-height: 1.6;
                }
                .dialog-footer {
                    padding: 20px 25px;
                    border-top: 1px solid #e2e8f0;
                    text-align: right;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(dialog);

        // Handle login button click
        document.getElementById('session-login-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    // Authorization checks using granular permissions
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        // If user doesn't have permissions object, fall back to old authority system
        if (!this.currentUser.permissions) {
            console.warn('User missing permissions object, falling back to authority-based system');
            return this.hasLegacyPermission(permission);
        }

        const permissions = this.currentUser.permissions;
        
        // Map permission names to database fields
        const permissionMap = {
            'all': 'isAdmin',
            'admin_access': 'isAdmin',
            'manage_employees': 'canManageEmployees',
            'approve_leaves': 'canApproveLeaves',
            'view_reports': 'canViewReports',
            'manage_schedules': 'canManageSchedules',
            'process_payroll': 'canProcessPayroll',
            'view_all_attendance': 'canViewAllAttendance',
            'edit_system_settings': 'canEditSystemSettings',
            'request_leave': 'isAllowedLeaves',
            'approve_other_groups': 'canApproveOtherGroups'
        };
        
        const dbField = permissionMap[permission];
        if (!dbField) {
            console.warn(`Unknown permission: ${permission}`);
            return false;
        }
        
        // Check if user has admin access (overrides all other permissions)
        if (permissions.isAdmin === 1) {
            console.log(`Admin access granted for permission: ${permission}`);
            return true;
        }
        
        // Check specific permission
        const hasPermission = permissions[dbField] === 1;
        console.log(`Permission check: ${permission} (${dbField}) = ${hasPermission}`);
        return hasPermission;
    }
    
    // Legacy permission system for backward compatibility
    hasLegacyPermission(permission) {
        const permissions = {
            'administrator': ['all'],
            'department-head': ['manage_employees', 'approve_leaves', 'view_reports', 'manage_schedules'],
            'basic': ['view_own_data', 'request_leave', 'clock_in_out']
        };

        const userPermissions = permissions[this.currentUser.authority] || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }
    
    // Check if user belongs to specific group
    hasGroup(groupName) {
        if (!this.currentUser || !this.currentUser.groups) return false;
        return this.currentUser.groups.includes(groupName);
    }
    
    // Check if user can approve leaves for a specific department/group
    canApproveLeaveForGroup(targetGroup) {
        if (!this.currentUser) return false;
        
        // Admin can approve all
        if (this.hasPermission('all')) return true;
        
        // Check if user can approve leaves
        if (!this.hasPermission('approve_leaves')) return false;
        
        // Check if user can approve other groups or if it's their own group
        if (this.hasPermission('approve_other_groups')) return true;
        
        // Can only approve for their own groups
        return this.hasGroup(targetGroup);
    }

    requireAuth() {
        console.log('=== REQUIRE AUTH CHECK ===');
        console.log('this.currentUser:', this.currentUser);
        console.log('localStorage currentUser:', localStorage.getItem('currentUser'));
        
        // Try to load session if currentUser is null but localStorage has data
        if (!this.currentUser) {
            console.log('No currentUser, attempting to load session...');
            const sessionLoaded = this.loadSession();
            console.log('Session load result:', sessionLoaded);
        }
        
        if (!this.currentUser) {
            console.log('Authentication failed - redirecting to index.html');
            window.location.href = 'index.html';
            return false;
        }
        
        console.log('Authentication successful for user:', this.currentUser.id);
        return true;
    }

    requirePermission(permission) {
        if (!this.requireAuth()) return false;
        
        if (!this.hasPermission(permission)) {
            this.showAccessDenied();
            return false;
        }
        return true;
    }

    showAccessDenied() {
        const message = document.createElement('div');
        message.className = 'access-denied-message';
        message.innerHTML = `
            <div class="message-content">
                <i class="fas fa-ban"></i>
                <p>Access Denied: You don't have permission to perform this action.</p>
            </div>
        `;

        // Add styles
        if (!document.querySelector('.access-denied-styles')) {
            const style = document.createElement('style');
            style.className = 'access-denied-styles';
            style.textContent = `
                .access-denied-message {
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
                    max-width: 350px;
                }
                .message-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .message-content i {
                    font-size: 1.2rem;
                }
                .message-content p {
                    margin: 0;
                    font-size: 0.9rem;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(message);

        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }

    // Activity logging
    logActivity(action, userId, details = {}) {
        const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
        const activity = {
            id: Date.now().toString(),
            action: action,
            userId: userId,
            timestamp: new Date().toISOString(),
            details: details,
            ipAddress: 'localhost', // In real app, would get actual IP
            userAgent: navigator.userAgent
        };

        activities.unshift(activity); // Add to beginning
        
        // Keep only last 100 activities
        if (activities.length > 100) {
            activities.splice(100);
        }

        localStorage.setItem('userActivities', JSON.stringify(activities));
    }

    getRecentActivities(limit = 10) {
        const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
        return activities.slice(0, limit);
    }

    // Session management
    extendSession() {
        if (this.currentUser) {
            this.updateSessionData();
            this.setupSessionTimeout();
        }
    }

    getSessionInfo() {
        const sessionData = JSON.parse(localStorage.getItem('sessionData') || 'null');
        if (!sessionData) return null;

        const now = new Date().getTime();
        const timeRemaining = this.sessionTimeout - (now - sessionData.loginTime);
        
        return {
            loginTime: new Date(sessionData.loginTime),
            lastActivity: new Date(sessionData.lastActivity),
            timeRemaining: Math.max(0, timeRemaining),
            isExpired: timeRemaining <= 0
        };
    }
}

// Initialize authentication manager
const authManager = new AuthManager();

// Auto-extend session on user activity
let activityTimer;
document.addEventListener('click', () => {
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
        authManager.extendSession();
    }, 1000);
});

document.addEventListener('keypress', () => {
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
        authManager.extendSession();
    }, 1000);
});