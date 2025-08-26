# Employee Attendance System

A comprehensive facial recognition-based employee attendance management system with granular permissions and role-based access control.

## 🚀 Quick Start

⚠️ **IMPORTANT**: This application must be served via a web server (HTTP/HTTPS). Do NOT open HTML files directly in the browser (file:// protocol) as this will cause camera and security issues.

### Method 1: Python HTTP Server (Recommended)
```bash
# Navigate to the project root directory
cd path/to/KiloCode

# Start the Python server
python -m http.server 8000

# Access the application
http://localhost:8000/
```

### Method 2: VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Open the `employee-attendance` folder in VS Code
3. Right-click on `index.html` and select "Open with Live Server"
4. Or use the Live Server extension to serve the folder

**Important**: If VS Code Live Server doesn't automatically load the login page:
- Access: `http://127.0.0.1:5500/employee-attendance/`
- If it shows a directory listing, click on `index.html`
- If it goes to admin.html directly, it will automatically redirect to login

### ❌ What NOT to Do
- Do NOT double-click on HTML files to open them directly
- Do NOT use `file://` URLs (like `file:///C:/path/to/index.html`)
- This will cause camera permissions and localStorage issues

## 🔐 Demo Credentials

### Administrator
- **ID**: ADMIN001
- **Password**: admin123
- **Permissions**: Full admin access, can manage employees, approve leaves

### Manager
- **ID**: EMP001  
- **Password**: emp123
- **Permissions**: Can approve leaves, request leaves

### Employee
- **ID**: EMP002
- **Password**: emp123
- **Permissions**: Can request leaves only

## 🛡️ Security Features

### Granular Permissions System
- **isAdmin**: 0/1 - Administrator access
- **canApproveLeaves**: 0/1 - Leave approval permissions
- **isAllowedLeaves**: 0/1 - Can request leaves
- **canApproveLeaveFromOtherGroups**: 0/1 - Cross-group leave approval
- **canManageEmployees**: 0/1 - Employee management permissions

### Group-Based Access Control
- **Groups**: sales, admin, accounting, audit, HR
- **Department-level permissions** for enhanced security

### Authentication Protection
- **Direct URL access protection** - accessing admin.html or dashboard.html directly redirects to login
- **Session validation** with 8-hour timeout
- **Role-based navigation** - admins go to admin panel, employees to dashboard
- **Backward compatibility** with legacy authority-based checks

## 📁 File Structure

```
employee-attendance/
├── index.html          # Login page (main entry point)
├── admin.html          # Admin panel
├── dashboard.html      # Employee dashboard
├── default.html        # Fallback redirect page
├── .htaccess          # Apache server configuration
├── css/
│   └── styles.css     # Application styles
└── js/
    ├── database.js    # Data management with permissions
    ├── auth.js        # Authentication & authorization
    ├── admin.js       # Admin panel functionality
    ├── dashboard.js   # Employee dashboard
    ├── main.js        # Login page logic
    └── camera.js      # Face recognition system
```

## 🔧 Troubleshooting

### VS Code Live Server Issues

**Problem**: Accessing the folder goes directly to admin.html instead of login
**Solution**: 
1. The system will automatically redirect to login if not authenticated
2. Clear browser cache and localStorage
3. Access `http://127.0.0.1:5500/employee-attendance/index.html` directly
4. Use the Python server method instead

**Problem**: Directory listing shown instead of login page
**Solution**:
1. Click on `index.html` from the directory listing
2. Or access `http://127.0.0.1:5500/employee-attendance/index.html` directly

### Camera Issues

**Problem**: Face capture shows "camera is still loading" or doesn't work
**Solution**:
1. **Use a web server** - Do NOT open HTML files directly (file:// protocol)
2. Use Python server: `python -m http.server 8000` then access `http://localhost:8000/`
3. Or use VS Code Live Server extension
4. Allow camera permissions in browser when prompted
5. System includes demo mode fallback for testing environments
6. Check browser console for camera initialization logs

**Problem**: "Camera not initialized" error
**Solution**:
1. Ensure you're using HTTP/HTTPS protocol, not file://
2. Check browser console for detailed error messages
3. Try refreshing the page after granting camera permissions

### Session Issues

**Problem**: Logged out unexpectedly
**Solution**:
1. Sessions expire after 8 hours
2. Clear localStorage and login again
3. Check browser console for authentication logs

## 🎯 Features

### For Administrators (ADMIN001)
- ✅ Employee management (add, edit, delete)
- ✅ Attendance monitoring and reports
- ✅ Leave request approval/rejection
- ✅ Payroll management
- ✅ System analytics and reporting
- ✅ Full access to all system features

### For Managers (EMP001)
- ✅ Leave request approval (within group)
- ✅ Personal attendance tracking
- ✅ Leave request submission
- ✅ Team attendance overview

### For Employees (EMP002)
- ✅ Personal attendance tracking
- ✅ Clock in/out with face verification
- ✅ Leave request submission
- ✅ Personal attendance history

## 🔄 System Architecture

### Authentication Flow
1. **Login**: Username/password validation
2. **Face Capture**: Biometric verification
3. **Session Creation**: Secure session with permissions
4. **Role-based Redirect**: Admin panel or employee dashboard
5. **Permission Validation**: Granular access control

### Permission System
- **Database-driven**: All permissions stored in user objects
- **Granular Control**: Multiple permission flags per user
- **Group-based**: Department-level access management
- **Backward Compatible**: Works with legacy authority system

## 📞 Support

For technical support or questions about the system:
1. Check browser console for error messages
2. Verify camera permissions are granted
3. Clear browser cache and localStorage if experiencing issues
4. Use Python server method for most reliable experience

---

**Version**: 2.0.0 with Granular Permissions System  
**Last Updated**: 2025-08-25