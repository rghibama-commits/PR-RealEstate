import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import {
  initDatabase,
  getDatabaseStatus,
  authenticateStaff,
  getAllDevelopers,
  getAllOffplanProjects,
  getOffplanProjectBySlug,
  getAllProperties,
  getPropertyBySlug,
  getAllAgents,
  createBuyerLead,
  getLeads,
  getLeadByRef,
  updateLeadStage,
  reassignLead,
  addLeadNote,
  completeWonDeal,
  createViewing,
  getAllViewings,
  getNotifications,
  markNotificationsAsRead,
  getAdminAnalytics,
  getAgentLeaderboard,
  createProperty,
  updateProperty,
  deleteProperty,
  createOffplanProject,
  updateOffplanProject,
  deleteOffplanProject
} from './db.js';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// 1. Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// 2. CORS configuration (allowing local dev, staging & production)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://pr-realestate.ae',
  'https://pr-real-estate.vercel.app'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json());

// Initialize Database connection on boot
initDatabase().catch(err => {
  console.error('[SERVER] Database init error:', err);
});

/* --------------------------------------------------------------------------
   ANTI-SPAM RATE LIMITING (Blocks rapid submissions & prunes old entries)
   -------------------------------------------------------------------------- */
const requestLog = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'client';
  const now = Date.now();
  const windowMs = 60 * 1000; // 60 seconds
  const maxRequests = 5;

  const history = requestLog.get(ip) || [];
  const recent = history.filter(ts => now - ts < windowMs);

  // Prune expired entries to prevent memory leak
  if (requestLog.size > 1000) {
    for (const [key, timestamps] of requestLog.entries()) {
      if (timestamps.every(ts => now - ts >= windowMs)) {
        requestLog.delete(key);
      }
    }
  }

  if (recent.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      rateLimited: true,
      message: 'Too many submissions received from this device. Please wait a moment before sending another inquiry.'
    });
  }

  recent.push(now);
  requestLog.set(ip, recent);
  next();
}

// User-specified universal confirmation message
const THANK_YOU_MESSAGE = "Thank you. A PR Real Estate advisor will contact you within 24 hours.";

/* --------------------------------------------------------------------------
   PUBLIC PORTFOLIO APIS
   -------------------------------------------------------------------------- */
app.get('/api/status', async (req, res) => {
  try {
    const status = await getDatabaseStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/developers', async (req, res) => {
  try {
    const developers = await getAllDevelopers();
    res.json({ success: true, data: developers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/offplan', async (req, res) => {
  try {
    const projects = await getAllOffplanProjects();
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/offplan/:slug', async (req, res) => {
  try {
    const project = await getOffplanProjectBySlug(req.params.slug);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/properties', async (req, res) => {
  try {
    let properties = await getAllProperties();
    const { community, category, minPrice, maxPrice, bedrooms } = req.query;

    if (community && community !== 'all') {
      properties = properties.filter(p => p.community.toLowerCase() === community.toLowerCase());
    }
    if (category && category !== 'all') {
      properties = properties.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (minPrice) {
      properties = properties.filter(p => p.priceAED >= Number(minPrice));
    }
    if (maxPrice) {
      properties = properties.filter(p => p.priceAED <= Number(maxPrice));
    }
    if (bedrooms && bedrooms !== 'all') {
      properties = properties.filter(p => p.bedrooms >= Number(bedrooms));
    }

    res.json({ success: true, count: properties.length, data: properties });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/properties/:slug', async (req, res) => {
  try {
    const property = await getPropertyBySlug(req.params.slug);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, data: property });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/agents', async (req, res) => {
  try {
    const agents = await getAllAgents();
    res.json({ success: true, count: agents.length, data: agents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------------------------------------------------------------
   FORM SUBMISSIONS (All save buyer as lead, track form, rate-limited, no email)
   -------------------------------------------------------------------------- */
app.post('/api/leads', rateLimiter, async (req, res) => {
  try {
    const { firstName, lastName, phone, interestType, community, budget, sourceForm, source, notes, honeypot } = req.body;

    // Honeypot spam check
    if (honeypot && honeypot.trim() !== '') {
      return res.json({ success: true, message: THANK_YOU_MESSAGE, reference: 'PR-DXB-BOT' });
    }

    if (!firstName || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide both your name and phone number.' });
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 7) {
      return res.status(400).json({ success: false, message: 'Please provide a valid contact number.' });
    }

    const lead = await createBuyerLead({
      firstName: firstName.trim(),
      lastName: (lastName || '').trim(),
      phone: cleanPhone,
      interestType: interestType || 'General Portfolio',
      community: community || 'All Prime Enclaves',
      budget: budget || 'AED 15M - 25M',
      sourceForm: sourceForm || source || 'Website Registration',
      notes: notes || ''
    });

    res.json({
      success: true,
      reference: lead.ref,
      score: lead.score,
      temperature: lead.temperature,
      message: THANK_YOU_MESSAGE
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/viewings', rateLimiter, async (req, res) => {
  try {
    const { propertyId, propertyTitle, clientName, clientPhone, viewingDate, viewingTime, notes, honeypot } = req.body;

    if (honeypot && honeypot.trim() !== '') {
      return res.json({ success: true, message: THANK_YOU_MESSAGE });
    }

    if (!clientName || !clientPhone || !viewingDate) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
    }

    const viewing = await createViewing({
      propertyId,
      propertyTitle: propertyTitle || 'Dubai Luxury Residence',
      clientName: clientName.trim(),
      clientPhone: clientPhone.replace(/[^0-9+]/g, ''),
      viewingDate,
      viewingTime: viewingTime || '11:00 AM',
      notes: notes || 'Booked via website viewing portal'
    });

    res.json({
      success: true,
      reference: viewing.ref,
      message: THANK_YOU_MESSAGE
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/valuations', rateLimiter, async (req, res) => {
  try {
    const { ownerName, phone, propertyType, community, estimatedPrice, notes, honeypot } = req.body;

    if (honeypot && honeypot.trim() !== '') {
      return res.json({ success: true, message: THANK_YOU_MESSAGE });
    }

    if (!ownerName || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide your name and phone number.' });
    }

    const lead = await createBuyerLead({
      firstName: ownerName.trim(),
      lastName: '(Owner / Seller)',
      phone: phone.replace(/[^0-9+]/g, ''),
      interestType: `Sell Valuation: ${propertyType || 'Residence'} in ${community || 'Dubai'}`,
      community: community || 'Dubai Prime',
      budget: estimatedPrice || 'Valuation Appraisal',
      sourceForm: 'Sell Valuation Form',
      notes: notes || ''
    });

    res.json({
      success: true,
      reference: lead.ref,
      message: THANK_YOU_MESSAGE
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/call-me-back', rateLimiter, async (req, res) => {
  try {
    const { name, phone, preferredTime, honeypot } = req.body;

    if (honeypot && honeypot.trim() !== '') {
      return res.json({ success: true, message: THANK_YOU_MESSAGE });
    }

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide your name and phone number.' });
    }

    const lead = await createBuyerLead({
      firstName: name.trim(),
      lastName: '',
      phone: phone.replace(/[^0-9+]/g, ''),
      interestType: `Priority Call Request (${preferredTime || 'Immediate'})`,
      community: 'All Prime Enclaves',
      budget: 'VIP Advisory',
      sourceForm: 'Call Me Back Button'
    });

    res.json({
      success: true,
      reference: lead.ref,
      message: THANK_YOU_MESSAGE
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------------------------------------------------------------
   STAFF & ADMIN AUTHENTICATION
   -------------------------------------------------------------------------- */
const JWT_SECRET = process.env.JWT_SECRET || 'pr_dxb_prime_secret_key_2026_crm';

function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    agentId: user.agentId,
    exp: Date.now() + (24 * 60 * 60 * 1000)
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Authentication Middleware: rejects missing or invalid tokens
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: A valid staff authentication token is required.'
    });
  }

  req.user = user;
  next();
}

// Role Authorization Middleware: requires Director role
function requireDirector(req, res, next) {
  if (!req.user || req.user.role !== 'Director') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Director authorization required.'
    });
  }
  next();
}

// Helper to extract session user from verified token
function getAuthUser(req) {
  return req.user || {
    role: 'Agent',
    username: 'unauthenticated',
    agentId: null,
    fullName: 'Guest'
  };
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await authenticateStaff(username, password);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your username and password.' });
    }

    res.json({
      success: true,
      user,
      token: generateToken(user)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------------------------------------------------------------
   ADMIN CRM ENDPOINTS (Leads, Notifications, Pipeline, Deals, Inventory)
   -------------------------------------------------------------------------- */

// 1. Leads list with search, filters, and role-based visibility
app.get('/api/admin/leads', requireAuth, async (req, res) => {
  try {
    const user = getAuthUser(req);
    const filters = req.query;
    const leads = await getLeads(filters, user);
    res.json({ success: true, count: leads.length, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Single Lead Details with notes & viewing history
app.get('/api/admin/leads/:ref', requireAuth, async (req, res) => {
  try {
    const lead = await getLeadByRef(req.params.ref);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Update Lead Stage (Pipeline Drag-and-Drop)
app.put('/api/admin/leads/:ref/stage', requireAuth, async (req, res) => {
  try {
    const user = getAuthUser(req);
    const { stage } = req.body;
    const lead = await updateLeadStage(req.params.ref, stage, user);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Reassign Agent (Director only)
app.put('/api/admin/leads/:ref/assign', requireAuth, requireDirector, async (req, res) => {
  try {
    const user = getAuthUser(req);
    const { agentId } = req.body;
    const lead = await reassignLead(req.params.ref, agentId, user);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Add Note to Lead
app.post('/api/admin/leads/:ref/notes', requireAuth, async (req, res) => {
  try {
    const user = getAuthUser(req);
    const { noteText } = req.body;
    if (!noteText) return res.status(400).json({ success: false, message: 'Note text required' });

    const note = await addLeadNote(req.params.ref, noteText, user.fullName || 'Advisor', user.agentId);
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Complete Deal as "Won" (Calculates 2% commission & marks property as Sold)
app.post('/api/admin/deals/complete-won', requireAuth, async (req, res) => {
  try {
    const { leadRef, propertyTitle, salePriceAED, buyerName, sellerName, agentId, closingDate } = req.body;
    if (!salePriceAED) return res.status(400).json({ success: false, message: 'Sale price required' });

    const result = await completeWonDeal({
      leadRef,
      propertyTitle,
      salePriceAED,
      buyerName,
      sellerName,
      agentId,
      closingDate
    });

    res.json({
      success: true,
      message: `Deal Closed! 2% Commission: AED ${result.commissionAED.toLocaleString()}. Property marked as Sold.`,
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Notifications (Bell Icon Polling)
app.get('/api/admin/notifications', requireAuth, async (req, res) => {
  try {
    const user = getAuthUser(req);
    const notifications = await getNotifications(user);
    res.json({ success: true, ...notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/notifications/mark-read', requireAuth, async (req, res) => {
  try {
    const user = getAuthUser(req);
    await markNotificationsAsRead(user);
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Analytics Dashboard & Charts
app.get('/api/admin/analytics', requireAuth, async (req, res) => {
  try {
    const user = getAuthUser(req);
    const analytics = await getAdminAnalytics(user);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Agent Leaderboard
app.get('/api/admin/leaderboard', requireAuth, async (req, res) => {
  try {
    const leaderboard = await getAgentLeaderboard();
    res.json({ success: true, data: leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Viewings Schedule
app.get('/api/admin/viewings', requireAuth, async (req, res) => {
  try {
    const user = getAuthUser(req);
    const viewings = await getAllViewings(user);
    res.json({ success: true, count: viewings.length, data: viewings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Property Inventory Management (CRUD - Director Only)
app.post('/api/admin/properties', requireAuth, requireDirector, async (req, res) => {
  try {
    const property = await createProperty(req.body);
    res.json({ success: true, message: 'Property created successfully', data: property });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/properties/:slug', requireAuth, requireDirector, async (req, res) => {
  try {
    const property = await updateProperty(req.params.slug, req.body);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, message: 'Property updated successfully', data: property });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/properties/:slug', requireAuth, requireDirector, async (req, res) => {
  try {
    const success = await deleteProperty(req.params.slug);
    if (!success) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, message: 'Property removed from inventory' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Off-Plan Project Inventory Management (CRUD - Director Only)
app.post('/api/admin/offplan', requireAuth, requireDirector, async (req, res) => {
  try {
    const project = await createOffplanProject(req.body);
    res.json({ success: true, message: 'Project created successfully', data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/offplan/:slug', requireAuth, requireDirector, async (req, res) => {
  try {
    const project = await updateOffplanProject(req.params.slug, req.body);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project updated successfully', data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/offplan/:slug', requireAuth, requireDirector, async (req, res) => {
  try {
    const success = await deleteOffplanProject(req.params.slug);
    if (!success) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project removed from portfolio' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Global error handling middleware (prevents stack trace disclosure)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON request payload.' });
  }
  console.error('[SERVER ERROR]', err.message);
  res.status(500).json({ success: false, message: 'An internal server error occurred.' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[PR Real Estate API] Running on http://localhost:${PORT}`);
  });
}

export default app;
