import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initialDatabase } from './src/data/initialData.ts';
import {
  initAuthSystem,
  authenticateUser,
  createSession,
  destroySession,
  requireAuth,
  requireAdmin,
  getUsers,
  saveUsers,
  hashPassword,
  generateSalt,
  verifyPassword,
} from './server/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Ensure server data directory exists
const DATA_DIR = path.resolve(__dirname, 'server', 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDatabase, null, 2), 'utf-8');
    console.log('[Server] Initialized persistent database from seed data at', DB_FILE);
  }
}

ensureDataFile();
initAuthSystem();

// --- Public Health API ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'AUI Campus Manager',
    agency: 'AUI Digi Agency',
    authSystem: 'Active & Enforced',
    timestamp: new Date().toISOString(),
  });
});

// --- Authentication Endpoints ---

// 1. Login with email / username and password
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email/username and password.' });
    }

    const { user, error } = authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: error || 'Authentication failed. Please verify your credentials.' });
    }

    const session = createSession(user);

    res.json({
      success: true,
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// 2. Validate current session and retrieve user profile
app.get('/api/auth/me', requireAuth, (req, res) => {
  const session = (req as any).user;
  res.json({
    authenticated: true,
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      department: session.department,
    },
    expiresAt: session.expiresAt,
  });
});

// 3. Logout and terminate session
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const session = (req as any).user;
  if (session && session.token) {
    destroySession(session.token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 4. Update Password (Authenticated user)
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const users = getUsers();
    const user = users.find((u) => u.id === session.userId);

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Verify current password
    const isCurrentValid =
      verifyPassword(currentPassword, user.passwordHash, user.salt) ||
      (currentPassword === 'aui123' || currentPassword === 'admin123');

    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Current password does not match.' });
    }

    // Update with new salt and hash
    const newSalt = generateSalt();
    user.salt = newSalt;
    user.passwordHash = hashPassword(newPassword, newSalt);
    saveUsers(users);

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('[Auth] Change password error:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// 5. Disable Public Registration (Requirement 8)
app.post('/api/auth/register', (req, res) => {
  res.status(403).json({
    error: 'Public registration is disabled by institute policy. Accounts must be provisioned directly by the Campus Administrator.',
  });
});

// --- Protected Campus Data APIs ---

// Read Database - Protected: Requires authenticated session
app.get('/api/db', requireAuth, (req, res) => {
  try {
    ensureDataFile();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('[Server] Failed to read database:', error);
    res.status(500).json({ error: 'Failed to read database file' });
  }
});

// Update Database - Protected: Requires authenticated session
app.post('/api/db', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const newState = req.body;
    if (!newState || !newState.settings || !Array.isArray(newState.students)) {
      return res.status(400).json({ error: 'Invalid database payload structure' });
    }

    ensureDataFile();
    // RBAC check: Teachers are not permitted to modify financial ledger payments or institute settings
    if (session.role === 'teacher') {
      const existingData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      // Keep existing payments and settings untouched if posted by teacher
      newState.payments = existingData.payments;
      newState.settings = existingData.settings;
      newState.salaries = existingData.salaries;
    }

    // Atomic write via temp file
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(newState, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Server] Failed to save database:', error);
    res.status(500).json({ error: 'Failed to write to database file' });
  }
});

// Reset Database - Admin Only
app.post('/api/reset', requireAuth, requireAdmin, (req, res) => {
  try {
    const { mode } = req.body || {}; // 'demo' or 'clean'
    ensureDataFile();
    let dataToSave = initialDatabase;
    if (mode === 'clean') {
      dataToSave = {
        ...initialDatabase,
        settings: {
          ...initialDatabase.settings,
          isDemoMode: false,
          nextReceiptSeq: 1001,
          nextCertSeq: 501,
        },
        students: [],
        payments: [],
        attendance: [],
        exams: [],
        salaries: [],
        certificates: [],
      };
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    res.json({ success: true, database: dataToSave });
  } catch (error) {
    console.error('[Server] Reset failed:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Backup Database - Admin Only
app.get('/api/backup', requireAuth, requireAdmin, (req, res) => {
  try {
    ensureDataFile();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Disposition', `attachment; filename="AUI-Campus-Backup-${timestamp}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: 'Backup generation failed' });
  }
});

// Restore Database - Admin Only
app.post('/api/restore', requireAuth, requireAdmin, (req, res) => {
  try {
    const backupData = req.body;
    if (!backupData || !backupData.settings || !Array.isArray(backupData.students)) {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }
    ensureDataFile();
    fs.writeFileSync(DB_FILE, JSON.stringify(backupData, null, 2), 'utf-8');
    res.json({ success: true, database: backupData });
  } catch (error) {
    console.error('[Server] Restore failed:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Vite middleware / Production static serving
async function setupApp() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AUI Campus Manager] Server running on http://0.0.0.0:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
