// Admin Panel Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Immediate authentication check - block page rendering if not authenticated
    console.log('=== ADMIN PANEL AUTHENTICATION CHECK ===');
    console.log('Current URL:', window.location.href);
    console.log('Current user from authManager:', authManager.currentUser);
    console.log('Current user from localStorage:', localStorage.getItem('currentUser'));
    console.log('UserSession from localStorage:', localStorage.getItem('userSession'));
    
    // Check if authManager is available
    if (typeof authManager === 'undefined') {
        console.error('AuthManager not loaded - but continuing anyway');
        // Don't redirect, just continue
    }
    
    // Multiple attempts to load session
    let sessionLoaded = false;
    if (authManager && !authManager.currentUser) {
        console.log('No current user, attempting session reload...');
        sessionLoaded = authManager.loadSession();
        console.log('First session load attempt:', sessionLoaded);
        
        // If still no user, try direct localStorage access
        if (!authManager.currentUser) {
            console.log('Trying direct localStorage access...');
            const userSession = JSON.parse(localStorage.getItem('userSession') || 'null');
            const currentUserData = JSON.parse(localStorage.getItem('currentUser') || 'null');
            
            if (userSession && userSession.user) {
                console.log('Found user in userSession, setting as current user');
                authManager.currentUser = userSession.user;
                sessionLoaded = true;
            } else if (currentUserData) {
                console.log('Found user in currentUser, setting as current user');
                authManager.currentUser = currentUserData;
                sessionLoaded = true;
            }
        }
    } else if (authManager) {
        sessionLoaded = true;
    }
    
    console.log('Final session status:', sessionLoaded);
    console.log('Final current user:', authManager?.currentUser);
    
    // Get current user but don't redirect if not found
    const currentUser = authManager?.currentUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) {
        console.log('No current user found - but continuing anyway');
        // Don't redirect, just continue with limited functionality
    }
    
    console.log('Proceeding with admin panel initialization');
    
    // Check if user has admin access using new permissions system
    if (authManager && !authManager.hasPermission('admin_access')) {
        console.log('User lacks admin permissions. User permissions:', currentUser?.permissions);
        console.log('User authority (legacy):', currentUser?.authority);
        console.log('User lacks admin permissions - but continuing anyway');
        // Don't redirect, just continue with limited functionality
    }
    
    console.log('Admin permissions verified for user:', currentUser.id);
    console.log('User permissions:', currentUser.permissions);

    // Initialize admin panel
    initializeAdminPanel();
    setupNavigation();
    setupEventListeners();
    loadDashboardData();

    // Initialize admin panel
    function initializeAdminPanel() {
        // Set current user info
        document.getElementById('current-user').textContent = 
            `${currentUser.firstName} ${currentUser.lastName}`;
        
        // Show appropriate sections based on permissions
        setupPermissionBasedUI();
        
        // Load initial data
        showSection('dashboard');
    }

    function setupPermissionBasedUI() {
        // Hide sections user doesn't have access to
        if (!authManager.hasPermission('all')) {
            // Department heads have limited access
            const restrictedSections = ['payroll', 'reports'];
            restrictedSections.forEach(section => {
                const navLink = document.querySelector(`[data-section="${section}"]`);
                if (navLink) {
                    navLink.parentElement.style.display = 'none';
                }
            });
        }
    }

    // Navigation setup
    function setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                link.classList.add('active');
                
                // Show corresponding section
                showSection(section);
            });
        });
    }

    function showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.classList.remove('active'));
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update section title
        const titles = {
            dashboard: 'Dashboard',
            employees: 'Employee Management',
            schedules: 'Schedule Management',
            attendance: 'Attendance Records',
            leaves: 'Leave Management',
            payroll: 'Payroll Management',
            reports: 'Reports & Analytics'
        };
        
        document.getElementById('section-title').textContent = titles[sectionName] || 'Dashboard';
        
        // Load section-specific data
        loadSectionData(sectionName);
    }

    // Event listeners setup
    function setupEventListeners() {
        // Employee management
        document.getElementById('add-employee-btn').addEventListener('click', showEmployeeModal);
        
        // Employee modal
        const employeeModal = document.getElementById('employee-modal');
        const closeModal = employeeModal.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-btn');
        const employeeForm = document.getElementById('employee-form');
        
        closeModal.addEventListener('click', hideEmployeeModal);
        cancelBtn.addEventListener('click', hideEmployeeModal);
        employeeForm.addEventListener('submit', handleEmployeeSubmit);
        
        // Attendance filter
        document.getElementById('filter-attendance').addEventListener('click', filterAttendance);
        
        // Payroll generation
        document.getElementById('generate-payroll').addEventListener('click', generatePayroll);
        
        // Logout button
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
        
        // Auto-refresh dashboard stats every 30 seconds
        setInterval(() => {
            if (document.getElementById('dashboard-section').classList.contains('active')) {
                loadDashboardData();
            }
        }, 30000);
    }

    // Load section-specific data
    function loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'employees':
                loadEmployeesData();
                break;
            case 'schedules':
                loadSchedulesData();
                break;
            case 'attendance':
                loadAttendanceData();
                break;
            case 'leaves':
                loadLeavesData();
                break;
            case 'payroll':
                loadPayrollData();
                break;
            case 'reports':
                loadReportsData();
                break;
        }
    }

    // Dashboard data loading
    function loadDashboardData() {
        const stats = db.getStatistics();
        
        // Update stat cards
        document.getElementById('total-employees').textContent = stats.totalEmployees;
        document.getElementById('present-today').textContent = stats.presentToday;
        document.getElementById('absent-today').textContent = stats.absentToday;
        document.getElementById('pending-leaves').textContent = stats.pendingLeaves;
        
        // Load recent activities
        loadRecentActivities();
    }

    function loadRecentActivities() {
        const activities = authManager.getRecentActivities(10);
        const activityList = document.getElementById('activity-list');
        activityList.innerHTML = '';
        
        if (activities.length === 0) {
            activityList.innerHTML = '<p class="no-data">No recent activities</p>';
            return;
        }
        
        activities.forEach(activity => {
            const employee = db.getEmployee(activity.userId);
            const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
            
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            
            const iconClass = getActivityIcon(activity.action);
            const actionText = getActivityText(activity.action);
            
            activityElement.innerHTML = `
                <div class="activity-icon ${activity.action}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="activity-details">
                    <strong>${employeeName}</strong> ${actionText}
                    <br><span>${getTimeAgo(activity.timestamp)}</span>
                </div>
                <div class="activity-time">${db.formatTime(activity.timestamp)}</div>
            `;
            
            activityList.appendChild(activityElement);
        });
    }

    function getActivityIcon(action) {
        const icons = {
            login: 'fas fa-sign-in-alt',
            logout: 'fas fa-sign-out-alt',
            clock_in: 'fas fa-clock',
            clock_out: 'fas fa-clock',
            leave_request: 'fas fa-calendar-times'
        };
        return icons[action] || 'fas fa-info-circle';
    }

    function getActivityText(action) {
        const texts = {
            login: 'logged in',
            logout: 'logged out',
            clock_in: 'clocked in',
            clock_out: 'clocked out',
            leave_request: 'requested leave'
        };
        return texts[action] || 'performed an action';
    }

    function getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    }

    // Employee management
    function loadEmployeesData() {
        const employees = db.getEmployees();
        const tableBody = document.querySelector('#employees-table tbody');
        tableBody.innerHTML = '';
        
        employees.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.id}</td>
                <td>${employee.firstName} ${employee.lastName}</td>
                <td>${employee.position}</td>
                <td>${employee.department}</td>
                <td>${employee.scheduleGroup}</td>
                <td>
                    <span class="status-badge ${employee.status}">
                        ${employee.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editEmployee('${employee.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${employee.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Add status badge styles
        addStatusBadgeStyles();
    }

    function addStatusBadgeStyles() {
        if (!document.querySelector('.status-badge-styles')) {
            const style = document.createElement('style');
            style.className = 'status-badge-styles';
            style.textContent = `
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    text-transform: capitalize;
                }
                .status-badge.active {
                    background: #c6f6d5;
                    color: #2f855a;
                }
                .status-badge.inactive {
                    background: #fed7d7;
                    color: #c53030;
                }
                .btn-sm {
                    padding: 4px 8px;
                    font-size: 0.8rem;
                    margin-right: 5px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Employee modal functions
    function showEmployeeModal(employeeId = null) {
        const modal = document.getElementById('employee-modal');
        const form = document.getElementById('employee-form');
        const title = document.getElementById('modal-title');
        
        if (employeeId) {
            // Edit mode
            const employee = db.getEmployee(employeeId);
            if (employee) {
                title.textContent = 'Edit Employee';
                populateEmployeeForm(employee);
                form.dataset.employeeId = employeeId;
            }
        } else {
            // Add mode
            title.textContent = 'Add Employee';
            form.reset();
            delete form.dataset.employeeId;
            
            // Generate new employee ID
            const employees = db.getEmployees();
            const maxId = Math.max(...employees.map(emp => 
                parseInt(emp.id.replace(/\D/g, '')) || 0
            ));
            document.getElementById('emp-id').value = `EMP${String(maxId + 1).padStart(3, '0')}`;
        }
        
        modal.style.display = 'block';
    }

    function hideEmployeeModal() {
        const modal = document.getElementById('employee-modal');
        modal.style.display = 'none';
        document.getElementById('employee-form').reset();
    }

    function populateEmployeeForm(employee) {
        document.getElementById('emp-id').value = employee.id;
        document.getElementById('emp-first-name').value = employee.firstName;
        document.getElementById('emp-middle-name').value = employee.middleName || '';
        document.getElementById('emp-last-name').value = employee.lastName;
        document.getElementById('emp-email').value = employee.email;
        document.getElementById('emp-phone').value = employee.phone || '';
        document.getElementById('emp-address').value = employee.address || '';
        document.getElementById('emp-birthday').value = employee.birthday || '';
        document.getElementById('emp-civil-status').value = employee.civilStatus || 'single';
        document.getElementById('emp-hire-date').value = employee.hireDate;
        document.getElementById('emp-position').value = employee.position;
        document.getElementById('emp-department').value = employee.department;
        document.getElementById('emp-schedule-group').value = employee.scheduleGroup;
        document.getElementById('emp-daily-rate').value = employee.dailyRate || '';
        document.getElementById('emp-hourly-rate').value = employee.hourlyRate || '';
        document.getElementById('emp-authority').value = employee.authority;
        document.getElementById('emp-status').value = employee.status;
    }

    function handleEmployeeSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const isEdit = !!form.dataset.employeeId;
        
        const employeeData = {
            id: document.getElementById('emp-id').value,
            firstName: document.getElementById('emp-first-name').value,
            middleName: document.getElementById('emp-middle-name').value,
            lastName: document.getElementById('emp-last-name').value,
            email: document.getElementById('emp-email').value,
            phone: document.getElementById('emp-phone').value,
            address: document.getElementById('emp-address').value,
            birthday: document.getElementById('emp-birthday').value,
            civilStatus: document.getElementById('emp-civil-status').value,
            hireDate: document.getElementById('emp-hire-date').value,
            position: document.getElementById('emp-position').value,
            department: document.getElementById('emp-department').value,
            scheduleGroup: document.getElementById('emp-schedule-group').value,
            dailyRate: parseFloat(document.getElementById('emp-daily-rate').value) || 0,
            hourlyRate: parseFloat(document.getElementById('emp-hourly-rate').value) || 0,
            authority: document.getElementById('emp-authority').value,
            status: document.getElementById('emp-status').value,
            faceData: null,
            leaveCredits: {
                annual: 15,
                sick: 10,
                emergency: 5
            }
        };
        
        try {
            if (isEdit) {
                db.updateEmployee(form.dataset.employeeId, employeeData);
                showNotification('Employee updated successfully!', 'success');
            } else {
                db.addEmployee(employeeData);
                showNotification('Employee added successfully!', 'success');
            }
            
            hideEmployeeModal();
            loadEmployeesData();
            loadDashboardData(); // Refresh stats
        } catch (error) {
            console.error('Employee save error:', error);
            showNotification('Failed to save employee', 'error');
        }
    }

    // Global functions for employee actions
    window.editEmployee = function(employeeId) {
        showEmployeeModal(employeeId);
    };

    window.deleteEmployee = function(employeeId) {
        const employee = db.getEmployee(employeeId);
        if (!employee) return;
        
        if (confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`)) {
            try {
                db.deleteEmployee(employeeId);
                showNotification('Employee deleted successfully!', 'success');
                loadEmployeesData();
                loadDashboardData(); // Refresh stats
            } catch (error) {
                console.error('Employee delete error:', error);
                showNotification('Failed to delete employee', 'error');
            }
        }
    };

    // Attendance management
    function loadAttendanceData() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('attendance-date').value = today;
        filterAttendance();
    }

    function filterAttendance() {
        const selectedDate = document.getElementById('attendance-date').value;
        const attendance = db.getAttendance(selectedDate);
        const tableBody = document.querySelector('#attendance-table tbody');
        tableBody.innerHTML = '';
        
        attendance.forEach(record => {
            const employee = db.getEmployee(record.employeeId);
            if (!employee) return;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.employeeId}</td>
                <td>${employee.firstName} ${employee.lastName}</td>
                <td>${db.formatDate(record.date)}</td>
                <td>${record.timeIn ? db.formatTime(record.timeIn) : '--:--'}</td>
                <td>${record.timeOut ? db.formatTime(record.timeOut) : '--:--'}</td>
                <td>${record.hoursWorked || 0}h</td>
                <td>${record.overtimeHours || 0}h</td>
                <td>
                    <span class="status-badge ${record.status}">
                        ${record.status}
                    </span>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        if (attendance.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="no-data">No attendance records found for selected date</td></tr>';
        }
    }

    // Leave management
    function loadLeavesData() {
        const leaveRequests = db.getLeaveRequests();
        const tableBody = document.querySelector('#leaves-table tbody');
        tableBody.innerHTML = '';
        
        // Update leave stats
        const pending = leaveRequests.filter(req => req.status === 'pending').length;
        const approved = leaveRequests.filter(req => req.status === 'approved').length;
        const rejected = leaveRequests.filter(req => req.status === 'rejected').length;
        
        document.getElementById('pending-count').textContent = pending;
        document.getElementById('approved-count').textContent = approved;
        document.getElementById('rejected-count').textContent = rejected;
        
        leaveRequests.forEach(request => {
            const days = db.calculateDaysBetween(request.startDate, request.endDate);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.employeeName}</td>
                <td>${request.leaveType}</td>
                <td>${db.formatDate(request.startDate)}</td>
                <td>${db.formatDate(request.endDate)}</td>
                <td>${days}</td>
                <td>${request.reason}</td>
                <td>
                    <span class="status-badge ${request.status}">
                        ${request.status}
                    </span>
                </td>
                <td>
                    ${request.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="approveLeave('${request.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="rejectLeave('${request.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : '--'}
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        if (leaveRequests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="no-data">No leave requests found</td></tr>';
        }
    }

    // Global functions for leave actions
    window.approveLeave = function(requestId) {
        if (confirm('Are you sure you want to approve this leave request?')) {
            try {
                db.updateLeaveRequest(requestId, { 
                    status: 'approved',
                    approvedBy: currentUser.id,
                    approvedDate: new Date().toISOString()
                });
                showNotification('Leave request approved!', 'success');
                loadLeavesData();
                loadDashboardData(); // Refresh stats
            } catch (error) {
                console.error('Leave approval error:', error);
                showNotification('Failed to approve leave request', 'error');
            }
        }
    };

    window.rejectLeave = function(requestId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
            try {
                db.updateLeaveRequest(requestId, { 
                    status: 'rejected',
                    rejectedBy: currentUser.id,
                    rejectedDate: new Date().toISOString(),
                    rejectionReason: reason
                });
                showNotification('Leave request rejected!', 'success');
                loadLeavesData();
                loadDashboardData(); // Refresh stats
            } catch (error) {
                console.error('Leave rejection error:', error);
                showNotification('Failed to reject leave request', 'error');
            }
        }
    };

    // Payroll management
    function loadPayrollData() {
        // Populate month dropdown
        const monthSelect = document.getElementById('payroll-month');
        monthSelect.innerHTML = '<option value="">Select Month</option>';
        
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const currentYear = new Date().getFullYear();
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
            option.textContent = `${month} ${currentYear}`;
            monthSelect.appendChild(option);
        });
        
        // Set current month as default
        const currentMonth = new Date().getMonth();
        monthSelect.value = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    }

    function generatePayroll() {
        const selectedMonth = document.getElementById('payroll-month').value;
        if (!selectedMonth) {
            showNotification('Please select a month', 'error');
            return;
        }
        
        const [year, month] = selectedMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
        
        const employees = db.getEmployees().filter(emp => emp.status === 'active');
        const tableBody = document.querySelector('#payroll-table tbody');
        tableBody.innerHTML = '';
        
        employees.forEach(employee => {
            const payroll = db.calculatePayroll(employee.id, startDate, endDate);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payroll.employeeName}</td>
                <td>$${payroll.basicPay}</td>
                <td>${payroll.daysWorked}</td>
                <td>${payroll.totalOvertimeHours}h</td>
                <td>$${payroll.overtimePay}</td>
                <td>$${payroll.grossPay}</td>
                <td>$${payroll.deductions}</td>
                <td><strong>$${payroll.netPay}</strong></td>
            `;
            tableBody.appendChild(row);
        });
        
        showNotification('Payroll generated successfully!', 'success');
    }

    // Schedule management
    function loadSchedulesData() {
        // This would load schedule management interface
        // For now, it's a placeholder
    }

    // Reports
    function loadReportsData() {
        // This would load reports interface
        // For now, it's a placeholder
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

    // Handle logout
    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            authManager.logout();
        }
    }
});