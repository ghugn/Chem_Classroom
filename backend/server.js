const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
// Load .env explicitly
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// #region agent log
const debugLogPath = path.join(__dirname, '..', 'debug-dd61b8.log');
let debugWriteOkCount = 0;
let debugWriteLastError = null;
function agentDebugLog(payload) {
    try {
        const base = {
            sessionId: 'dd61b8',
            timestamp: Date.now(),
            ...payload,
        };
        fs.appendFileSync(debugLogPath, JSON.stringify(base) + '\n', { encoding: 'utf8' });
        debugWriteOkCount += 1;
        debugWriteLastError = null;
    } catch (e) {
        debugWriteLastError = e && e.message ? e.message : String(e);
    }
}
// #endregion

// Middleware
app.use(cors());
app.use(express.json());

// #region agent log
app.use((req, res, next) => {
    res.setHeader('X-Agent-Debug-Session', 'dd61b8');
    res.setHeader('X-Agent-Debug-Write', debugWriteLastError ? 'error' : 'ok');
    res.setHeader('X-Agent-Debug-Count', String(debugWriteOkCount));
    agentDebugLog({
        runId: 'pre-fix',
        hypothesisId: 'R1',
        location: 'server.js:request',
        message: 'Incoming request',
        data: {
            method: req.method,
            path: req.path,
            originalUrl: req.originalUrl,
            params: req.params,
            query: req.query,
        },
    });
    next();
});
// #endregion

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// New Document Management Routes
app.use('/api/admin/documents', require('./routes/adminDocumentRoutes'));
app.use('/api/student/documents', require('./routes/studentDocumentRoutes'));

// Grade Management Routes
app.use('/api/admin/grades', require('./routes/adminGradeRoutes'));
app.use('/api/student/grades', require('./routes/studentGradeRoutes'));

// Tuition Management Routes
app.use('/api/admin', require('./routes/adminTuitionRoutes'));
app.use('/api/student', require('./routes/studentTuitionRoutes'));

// Basic health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// Application api routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin/classes', require('./routes/classRoutes'));
app.use('/api/admin/students', require('./routes/adminStudentRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/admin/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));

// Root route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
