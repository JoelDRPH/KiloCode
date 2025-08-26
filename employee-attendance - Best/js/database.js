// Database Management System using localStorage
class AttendanceDatabase {
    constructor() {
        this.initializeDatabase();
    }

    initializeDatabase() {
        console.log('=== DATABASE INITIALIZATION START ===');
        console.log('Current URL:', window.location.href);
        console.log('Protocol:', window.location.protocol);
        
        // Always check and reinitialize if data is missing or corrupted
        const employees = localStorage.getItem('employees');
        const currentUser = localStorage.getItem('currentUser');
        
        console.log('Existing employees data:', employees ? 'EXISTS' : 'MISSING');
        console.log('Existing currentUser data:', currentUser ? 'EXISTS' : 'MISSING');
        
        // Force initialization for HTTP protocol or if data is missing/corrupted
        const forceInit = window.location.protocol === 'http:' ||
                         !employees ||
                         employees === 'null' ||
                         employees === '[]';
        
        if (forceInit) {
            console.log('FORCING database initialization...');
            this.createDefaultData();
        } else {
            // Verify data integrity
            try {
                const parsedEmployees = JSON.parse(employees);
                if (!Array.isArray(parsedEmployees) || parsedEmployees.length === 0) {
                    console.log('Reinitializing corrupted database...');
                    this.createDefaultData();
                } else {
                    console.log('Database already initialized with', parsedEmployees.length, 'employees');
                }
            } catch (error) {
                console.log('Reinitializing corrupted database due to parse error:', error);
                this.createDefaultData();
            }
        }
        
        // Ensure currentUser is properly initialized
        if (!currentUser || currentUser === 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(null));
        }
        
        console.log('=== DATABASE INITIALIZATION COMPLETE ===');
        console.log('Final employees count:', this.getEmployees().length);
    }

    createDefaultData() {
        console.log('Creating default database data...');
        
        // Default admin user
        const defaultAdmin = {
            id: 'ADMIN001',
            password: 'admin123', // Default password
            firstName: 'System',
            middleName: '',
            lastName: 'Administrator',
            email: 'admin@company.com',
            phone: '+1234567890',
            address: 'Head Office',
            birthday: '1990-01-01',
            civilStatus: 'single',
            hireDate: '2020-01-01',
            position: 'System Administrator',
            department: 'admin',
            scheduleGroup: 'head-office',
            dailyRate: 1000,
            hourlyRate: 125,
            authority: 'administrator', // Keep for backward compatibility
            status: 'active',
            faceData: null,
            leaveCredits: {
                annual: 15,
                sick: 10,
                emergency: 5
            },
            // New granular permissions system
            permissions: {
                isAdmin: 1,                    // 0=No, 1=Yes - Full system admin
                canApproveLeaves: 1,           // 0=No, 1=Yes - Can approve leave requests
                isAllowedLeaves: 1,            // 0=No, 1=Yes - Can request leaves
                canApproveOtherGroups: 1,      // 0=No, 1=Yes - Can approve leaves from other departments
                canManageEmployees: 1,         // 0=No, 1=Yes - Can add/edit/delete employees
                canViewReports: 1,             // 0=No, 1=Yes - Can view system reports
                canManageSchedules: 1,         // 0=No, 1=Yes - Can manage work schedules
                canProcessPayroll: 1,          // 0=No, 1=Yes - Can process payroll
                canViewAllAttendance: 1,       // 0=No, 1=Yes - Can view all employee attendance
                canEditSystemSettings: 1       // 0=No, 1=Yes - Can modify system settings
            },
            groups: ['admin', 'management']    // User belongs to these groups
        };

        // Sample employees
        const sampleEmployees = [
            {
                id: 'EMP001',
                password: 'emp123', // Default password
                firstName: 'John',
                middleName: 'A',
                lastName: 'Doe',
                email: 'john.doe@company.com',
                phone: '+1234567891',
                address: '123 Main St, City',
                birthday: '1985-05-15',
                civilStatus: 'married',
                hireDate: '2021-03-01',
                position: 'Store Manager',
                department: 'sales',
                scheduleGroup: 'store-based',
                dailyRate: 800,
                hourlyRate: 100,
                authority: 'department-head', // Keep for backward compatibility
                status: 'active',
                faceData: null,
                leaveCredits: {
                    annual: 15,
                    sick: 10,
                    emergency: 5
                },
                // Department head permissions
                permissions: {
                    isAdmin: 0,                    // Not a system admin
                    canApproveLeaves: 1,           // Can approve leaves for their department
                    isAllowedLeaves: 1,            // Can request leaves
                    canApproveOtherGroups: 0,      // Cannot approve leaves from other departments
                    canManageEmployees: 0,         // Cannot manage employees (limited to HR/Admin)
                    canViewReports: 1,             // Can view department reports
                    canManageSchedules: 0,         // Cannot manage schedules
                    canProcessPayroll: 0,          // Cannot process payroll
                    canViewAllAttendance: 0,       // Can only view own department attendance
                    canEditSystemSettings: 0       // Cannot edit system settings
                },
                groups: ['sales', 'management']    // Belongs to sales and management groups
            },
            {
                id: 'EMP002',
                password: 'emp123', // Default password
                firstName: 'Jane',
                middleName: 'B',
                lastName: 'Smith',
                email: 'jane.smith@company.com',
                phone: '+1234567892',
                address: '456 Oak Ave, City',
                birthday: '1990-08-22',
                civilStatus: 'single',
                hireDate: '2022-01-15',
                position: 'Sales Associate',
                department: 'sales',
                scheduleGroup: 'store-based',
                dailyRate: 500,
                hourlyRate: 62.5,
                authority: 'basic', // Keep for backward compatibility
                status: 'active',
                faceData: null,
                leaveCredits: {
                    annual: 12,
                    sick: 8,
                    emergency: 3
                },
                // Basic employee permissions
                permissions: {
                    isAdmin: 0,                    // Not a system admin
                    canApproveLeaves: 0,           // Cannot approve leaves
                    isAllowedLeaves: 1,            // Can request leaves
                    canApproveOtherGroups: 0,      // Cannot approve leaves from other departments
                    canManageEmployees: 0,         // Cannot manage employees
                    canViewReports: 0,             // Cannot view reports
                    canManageSchedules: 0,         // Cannot manage schedules
                    canProcessPayroll: 0,          // Cannot process payroll
                    canViewAllAttendance: 0,       // Can only view own attendance
                    canEditSystemSettings: 0       // Cannot edit system settings
                },
                groups: ['sales']                  // Belongs to sales group only
            }
        ];

        // Default schedules
        const defaultSchedules = {
            'store-based': {
                name: 'Store Based',
                workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
                workingHours: {
                    start: '08:00',
                    end: '17:00'
                },
                breakTime: 60, // minutes
                overtimeThreshold: 8 // hours
            },
            'head-office': {
                name: 'Head Office',
                workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                workingHours: {
                    start: '09:00',
                    end: '18:00'
                },
                breakTime: 60,
                overtimeThreshold: 8
            },
            'open-schedule': {
                name: 'Open Schedule',
                workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                workingHours: {
                    start: 'flexible',
                    end: 'flexible'
                },
                breakTime: 60,
                overtimeThreshold: 8
            }
        };

        // Save to localStorage
        const allEmployees = [defaultAdmin, ...sampleEmployees];
        console.log('Saving employees to localStorage:', allEmployees.map(emp => emp.id));
        
        localStorage.setItem('employees', JSON.stringify(allEmployees));
        localStorage.setItem('schedules', JSON.stringify(defaultSchedules));
        localStorage.setItem('attendance', JSON.stringify([]));
        localStorage.setItem('leaveRequests', JSON.stringify([]));
        localStorage.setItem('currentUser', JSON.stringify(null));
        
        console.log('Default data creation complete');
        console.log('Verification - employees in localStorage:', JSON.parse(localStorage.getItem('employees')).length);
    }

    // Employee Management
    getEmployees() {
        return JSON.parse(localStorage.getItem('employees') || '[]');
    }

    getEmployee(id) {
        const employees = this.getEmployees();
        console.log('=== GET EMPLOYEE ===');
        console.log('Looking for employee ID:', id);
        console.log('Total employees in database:', employees.length);
        console.log('All employee IDs:', employees.map(emp => emp.id));
        
        const employee = employees.find(emp => emp.id === id);
        console.log('Employee found:', employee ? 'YES' : 'NO');
        if (employee) {
            console.log('Employee details:', {
                id: employee.id,
                password: employee.password,
                status: employee.status,
                firstName: employee.firstName,
                lastName: employee.lastName
            });
        }
        
        return employee;
    }

    addEmployee(employee) {
        const employees = this.getEmployees();
        employees.push(employee);
        localStorage.setItem('employees', JSON.stringify(employees));
        return true;
    }

    updateEmployee(id, updatedData) {
        const employees = this.getEmployees();
        const index = employees.findIndex(emp => emp.id === id);
        if (index !== -1) {
            employees[index] = { ...employees[index], ...updatedData };
            localStorage.setItem('employees', JSON.stringify(employees));
            return true;
        }
        return false;
    }

    deleteEmployee(id) {
        const employees = this.getEmployees();
        const filteredEmployees = employees.filter(emp => emp.id !== id);
        localStorage.setItem('employees', JSON.stringify(filteredEmployees));
        return true;
    }

    // Authentication
    authenticateEmployee(id, password, faceData = null) {
        const employee = this.getEmployee(id);
        if (employee && employee.status === 'active' && employee.password === password) {
            // Password verified, now check face data if provided
            // In a real system, you would verify face data here
            localStorage.setItem('currentUser', JSON.stringify(employee));
            return employee;
        }
        return null;
    }

    // Password-only authentication (for initial login)
    authenticateWithPassword(id, password) {
        console.log('=== AUTHENTICATE WITH PASSWORD ===');
        console.log('Attempting to authenticate:', id);
        console.log('Password provided:', password);
        console.log('Password length:', password?.length);
        
        const employee = this.getEmployee(id);
        console.log('Employee found:', employee ? 'YES' : 'NO');
        
        if (employee) {
            console.log('Employee status:', employee.status);
            console.log('Employee stored password:', employee.password);
            console.log('Password match:', employee.password === password);
            console.log('Status active:', employee.status === 'active');
            
            if (employee.status === 'active' && employee.password === password) {
                console.log('Authentication SUCCESS');
                return employee;
            }
        }
        
        console.log('Authentication FAILED');
        return null;
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }

    logout() {
        localStorage.setItem('currentUser', JSON.stringify(null));
    }

    // Attendance Management
    getAttendance(date = null, employeeId = null) {
        let attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        
        if (date) {
            attendance = attendance.filter(record => record.date === date);
        }
        
        if (employeeId) {
            attendance = attendance.filter(record => record.employeeId === employeeId);
        }
        
        return attendance;
    }

    clockIn(employeeId, timestamp = new Date(), faceData = null) {
        const today = timestamp.toISOString().split('T')[0];
        const attendance = this.getAttendance();
        
        // Check if already clocked in today
        const existingRecord = attendance.find(record => 
            record.employeeId === employeeId && record.date === today
        );
        
        if (existingRecord && existingRecord.timeIn) {
            return { success: false, message: 'Already clocked in today' };
        }
        
        const record = {
            id: Date.now().toString(),
            employeeId: employeeId,
            date: today,
            timeIn: timestamp.toISOString(),
            timeOut: null,
            hoursWorked: 0,
            overtimeHours: 0,
            status: 'present',
            faceDataIn: faceData
        };
        
        if (existingRecord) {
            // Update existing record
            const index = attendance.findIndex(r => r.id === existingRecord.id);
            attendance[index] = { ...existingRecord, ...record };
        } else {
            // Add new record
            attendance.push(record);
        }
        
        localStorage.setItem('attendance', JSON.stringify(attendance));
        return { success: true, record: record };
    }

    clockOut(employeeId, timestamp = new Date(), faceData = null) {
        const today = timestamp.toISOString().split('T')[0];
        const attendance = this.getAttendance();
        
        const recordIndex = attendance.findIndex(record => 
            record.employeeId === employeeId && record.date === today && record.timeIn && !record.timeOut
        );
        
        if (recordIndex === -1) {
            return { success: false, message: 'No active clock-in found for today' };
        }
        
        const record = attendance[recordIndex];
        const timeIn = new Date(record.timeIn);
        const timeOut = timestamp;
        
        // Calculate hours worked
        const hoursWorked = (timeOut - timeIn) / (1000 * 60 * 60);
        const employee = this.getEmployee(employeeId);
        const schedule = this.getSchedule(employee.scheduleGroup);
        
        // Calculate overtime
        const regularHours = schedule.overtimeThreshold;
        const overtimeHours = Math.max(0, hoursWorked - regularHours);
        
        record.timeOut = timeOut.toISOString();
        record.hoursWorked = Math.round(hoursWorked * 100) / 100;
        record.overtimeHours = Math.round(overtimeHours * 100) / 100;
        record.faceDataOut = faceData;
        
        attendance[recordIndex] = record;
        localStorage.setItem('attendance', JSON.stringify(attendance));
        
        return { success: true, record: record };
    }

    // Schedule Management
    getSchedules() {
        return JSON.parse(localStorage.getItem('schedules') || '{}');
    }

    getSchedule(scheduleGroup) {
        const schedules = this.getSchedules();
        return schedules[scheduleGroup];
    }

    updateSchedule(scheduleGroup, scheduleData) {
        const schedules = this.getSchedules();
        schedules[scheduleGroup] = scheduleData;
        localStorage.setItem('schedules', JSON.stringify(schedules));
        return true;
    }

    // Leave Management
    getLeaveRequests(employeeId = null, status = null) {
        let requests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
        
        if (employeeId) {
            requests = requests.filter(req => req.employeeId === employeeId);
        }
        
        if (status) {
            requests = requests.filter(req => req.status === status);
        }
        
        return requests;
    }

    submitLeaveRequest(request) {
        const requests = this.getLeaveRequests();
        const newRequest = {
            id: Date.now().toString(),
            ...request,
            submittedDate: new Date().toISOString(),
            status: 'pending'
        };
        
        requests.push(newRequest);
        localStorage.setItem('leaveRequests', JSON.stringify(requests));
        return newRequest;
    }

    updateLeaveRequest(id, updates) {
        const requests = this.getLeaveRequests();
        const index = requests.findIndex(req => req.id === id);
        
        if (index !== -1) {
            requests[index] = { ...requests[index], ...updates };
            localStorage.setItem('leaveRequests', JSON.stringify(requests));
            return true;
        }
        return false;
    }

    // Payroll Calculations
    calculatePayroll(employeeId, startDate, endDate) {
        const employee = this.getEmployee(employeeId);
        const attendance = this.getAttendance().filter(record => {
            const recordDate = new Date(record.date);
            return record.employeeId === employeeId && 
                   recordDate >= new Date(startDate) && 
                   recordDate <= new Date(endDate);
        });

        let totalHours = 0;
        let totalOvertimeHours = 0;
        let daysWorked = 0;

        attendance.forEach(record => {
            if (record.timeOut) {
                totalHours += record.hoursWorked;
                totalOvertimeHours += record.overtimeHours;
                daysWorked++;
            }
        });

        const basicPay = employee.dailyRate * daysWorked;
        const overtimePay = employee.hourlyRate * 1.5 * totalOvertimeHours; // 1.5x overtime rate
        const grossPay = basicPay + overtimePay;
        
        // Simple deductions (can be expanded)
        const deductions = grossPay * 0.1; // 10% total deductions
        const netPay = grossPay - deductions;

        return {
            employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            daysWorked,
            totalHours: Math.round(totalHours * 100) / 100,
            totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
            basicPay: Math.round(basicPay * 100) / 100,
            overtimePay: Math.round(overtimePay * 100) / 100,
            grossPay: Math.round(grossPay * 100) / 100,
            deductions: Math.round(deductions * 100) / 100,
            netPay: Math.round(netPay * 100) / 100
        };
    }

    // Statistics
    getStatistics() {
        const employees = this.getEmployees();
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = this.getAttendance(today);
        const pendingLeaves = this.getLeaveRequests(null, 'pending');

        return {
            totalEmployees: employees.filter(emp => emp.status === 'active').length,
            presentToday: todayAttendance.filter(record => record.timeIn).length,
            absentToday: employees.filter(emp => emp.status === 'active').length - todayAttendance.filter(record => record.timeIn).length,
            pendingLeaves: pendingLeaves.length
        };
    }

    // Utility functions
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    calculateDaysBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    // Manual reset function for debugging
    resetDatabase() {
        console.log('Manually resetting database...');
        localStorage.clear();
        this.createDefaultData();
        console.log('Database reset complete');
    }
}

// Initialize database
const db = new AttendanceDatabase();

// Add global function for debugging
window.resetDB = function() {
    db.resetDatabase();
    location.reload();
};

// Add global function to check database state
window.checkDB = function() {
    console.log('Current employees:', db.getEmployees());
    console.log('LocalStorage employees:', localStorage.getItem('employees'));
    console.log('Current user:', db.getCurrentUser());
};