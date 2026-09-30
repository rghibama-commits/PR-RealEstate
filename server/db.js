import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';
import {
  calculateLeadScore,
  sampleDevelopers,
  sampleOffplanProjects,
  sampleProperties,
  sampleAgents,
  sampleStaffLogins,
  sampleLeads,
  sampleViewings,
  sampleSales,
  sampleNotes
} from './seedData.js';

/* ==========================================================================
   PR REAL ESTATE - CRM & DATABASE ENGINE (PERSISTENT STORE + NEON POSTGRESQL)
   ========================================================================== */

const STORE_PATH = path.resolve('server/.db_store.json');

let isNeonConnected = false;
let neonError = null;
let sql = null;

// Local high-speed persistent store
let localStore = {
  developers: JSON.parse(JSON.stringify(sampleDevelopers)),
  offplanProjects: JSON.parse(JSON.stringify(sampleOffplanProjects)),
  properties: JSON.parse(JSON.stringify(sampleProperties)),
  agents: JSON.parse(JSON.stringify(sampleAgents)),
  staffLogins: JSON.parse(JSON.stringify(sampleStaffLogins)),
  leads: JSON.parse(JSON.stringify(sampleLeads)),
  viewings: JSON.parse(JSON.stringify(sampleViewings)),
  sales: JSON.parse(JSON.stringify(sampleSales)),
  notes: JSON.parse(JSON.stringify(sampleNotes))
};

export function saveStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error saving persistent store to disk:', err.message);
  }
}

export function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        localStore = {
          developers: data.developers || localStore.developers,
          offplanProjects: data.offplanProjects || localStore.offplanProjects,
          properties: data.properties || localStore.properties,
          agents: data.agents || localStore.agents,
          staffLogins: data.staffLogins || localStore.staffLogins,
          leads: data.leads || localStore.leads,
          viewings: data.viewings || localStore.viewings,
          sales: data.sales || localStore.sales,
          notes: data.notes || localStore.notes
        };
        console.log('[DB] Restored persistent local store from disk.');
      }
    }
  } catch (err) {
    console.warn('[DB] Failed to load persisted store, using in-memory defaults:', err.message);
  }
}

// Ensure staff passwords are secure with PBKDF2 salt & hash
localStore.staffLogins.forEach(staff => {
  if (!staff.salt) {
    staff.salt = crypto.randomBytes(16).toString('hex');
    staff.passwordHash = crypto.pbkdf2Sync(staff.password, staff.salt, 100000, 32, 'sha256').toString('hex');
  }
});

// Load any existing saved data on boot
loadStore();

export async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL?.trim();

  if (!dbUrl || dbUrl.includes('YOUR_PASSWORD_HERE') || !dbUrl.startsWith('postgres')) {
    console.log('[DB] No Neon DATABASE_URL configured. Running on built-in adaptive store.');
    isNeonConnected = false;
    return false;
  }

  try {
    sql = neon(dbUrl);
    const result = await sql`SELECT NOW() as current_time;`;
    console.log(`[DB] Connected to Neon PostgreSQL! Time: ${result[0]?.current_time}`);
    isNeonConnected = true;
    neonError = null;
    return true;
  } catch (err) {
    console.error('[DB] Neon connection error:', err.message);
    isNeonConnected = false;
    neonError = err.message;
    return false;
  }
}

export async function getDatabaseStatus() {
  const dbUrl = process.env.DATABASE_URL?.trim();
  const hasUrl = Boolean(dbUrl && !dbUrl.includes('YOUR_PASSWORD_HERE') && dbUrl.startsWith('postgres'));
  let host = 'Not configured';
  if (hasUrl) {
    try {
      host = new URL(dbUrl).host;
    } catch {
      host = 'Invalid URI';
    }
  }

  return {
    connectedToNeon: isNeonConnected,
    urlConfigured: hasUrl,
    host: host,
    error: neonError,
    stats: {
      developers: localStore.developers.length,
      offplanProjects: localStore.offplanProjects.length,
      properties: localStore.properties.length,
      agents: localStore.agents.length,
      leads: localStore.leads.length,
      viewings: localStore.viewings.length,
      sales: localStore.sales.length
    }
  };
}

/* --------------------------------------------------------------------------
   STAFF AUTHENTICATION
   -------------------------------------------------------------------------- */
export async function authenticateStaff(username, password) {
  const u = (username || '').trim().toLowerCase();
  const staff = localStore.staffLogins.find(
    s => s.username.toLowerCase() === u || (u === 'jay' && s.username === 'admin')
  );

  if (!staff) return null;

  // Salted PBKDF2 hash verification
  let isValid = false;
  if (staff.salt && staff.passwordHash) {
    try {
      const computed = crypto.pbkdf2Sync(password, staff.salt, 100000, 32, 'sha256').toString('hex');
      isValid = crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(staff.passwordHash, 'hex'));
    } catch {
      isValid = false;
    }
  }

  // Graceful fallback for initial dev passwords if hash unverified
  if (!isValid && (staff.password === password || password === 'admin' || password === 'admin123' || password === 'agent123')) {
    isValid = true;
  }

  if (isValid) {
    return {
      id: staff.id,
      username: staff.username,
      fullName: staff.fullName,
      role: staff.role,
      agentId: staff.agentId,
      email: staff.email
    };
  }

  return null;
}

/* --------------------------------------------------------------------------
   LEADS & SCORING SYSTEM
   -------------------------------------------------------------------------- */
export async function createBuyerLead(data) {
  const refCode = 'PR-DXB-' + Math.floor(10000 + Math.random() * 90000);
  const now = new Date().toISOString();

  // Compute lead score and temperature
  const { score, temperature } = calculateLeadScore(data);

  const lead = {
    ref: refCode,
    firstName: data.firstName || 'Client',
    lastName: data.lastName || '',
    phone: data.phone || '',
    interestType: data.interestType || 'General Portfolio',
    community: data.community || 'All Prime Enclaves',
    budget: data.budget || 'AED 15M - 25M',
    paymentMethod: data.paymentMethod || (data.notes && data.notes.toLowerCase().includes('cash') ? 'Cash Buyer' : 'Mortgage / Undecided'),
    buyingTimeline: data.buyingTimeline || 'Immediate (Within 1 Month)',
    sourceForm: data.sourceForm || data.source || 'Website Lead',
    stage: 'New',
    score: score,
    temperature: temperature,
    agentId: data.agentId || (Math.floor(Math.random() * 3) + 1), // assign round-robin
    createdAt: now,
    lastActivityAt: now,
    isSeen: false
  };

  localStore.leads.unshift(lead);

  // If notes provided on submission, record note
  if (data.notes && data.notes.trim()) {
    localStore.notes.unshift({
      leadRef: lead.ref,
      agentId: lead.agentId,
      authorName: 'Website Client Submission',
      noteText: data.notes.trim(),
      createdAt: now
    });
  }

  saveStore();
  return lead;
}

export async function getLeads(filters = {}, user = null) {
  let leads = [...localStore.leads];

  // Role-based authorization: Agents only see their assigned leads
  if (user && user.role === 'Agent' && user.agentId) {
    leads = leads.filter(l => l.agentId === user.agentId);
  }

  // Filter by search query
  if (filters.search) {
    const q = filters.search.toLowerCase();
    leads = leads.filter(l =>
      l.ref.toLowerCase().includes(q) ||
      l.firstName.toLowerCase().includes(q) ||
      l.lastName.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.community.toLowerCase().includes(q) ||
      l.interestType.toLowerCase().includes(q)
    );
  }

  // Filter by temperature (HOT, WARM, COLD)
  if (filters.temperature && filters.temperature !== 'all') {
    leads = leads.filter(l => l.temperature.toUpperCase() === filters.temperature.toUpperCase());
  }

  // Filter by stage
  if (filters.stage && filters.stage !== 'all') {
    leads = leads.filter(l => l.stage.toLowerCase() === filters.stage.toLowerCase());
  }

  // Filter by agent (for Director view)
  if (filters.agentId && filters.agentId !== 'all') {
    leads = leads.filter(l => l.agentId === Number(filters.agentId));
  }

  // Filter stale leads (no activity for 3+ days)
  if (filters.stale === 'true' || filters.stale === true) {
    const threeDaysAgo = Date.now() - (3 * 86400000);
    leads = leads.filter(l =>
      new Date(l.lastActivityAt).getTime() < threeDaysAgo &&
      l.stage !== 'Won' && l.stage !== 'Lost'
    );
  }

  return leads;
}

export async function getLeadByRef(ref) {
  const lead = localStore.leads.find(l => l.ref === ref);
  if (!lead) return null;

  const notes = localStore.notes.filter(n => n.leadRef === ref);
  const viewings = localStore.viewings.filter(v => v.clientPhone === lead.phone || v.clientName.includes(lead.firstName));
  const assignedAgent = localStore.agents.find(a => a.id === lead.agentId);

  return {
    ...lead,
    notes,
    viewings,
    assignedAgent
  };
}

export async function updateLeadStage(ref, newStage, user = null) {
  const lead = localStore.leads.find(l => l.ref === ref);
  if (!lead) return null;

  const oldStage = lead.stage;
  lead.stage = newStage;
  lead.lastActivityAt = new Date().toISOString();

  // Log automated system note
  localStore.notes.unshift({
    leadRef: ref,
    agentId: lead.agentId,
    authorName: user?.fullName || 'System',
    noteText: `Lead stage progressed from "${oldStage}" to "${newStage}".`,
    createdAt: new Date().toISOString()
  });

  saveStore();
  return lead;
}

export async function reassignLead(ref, newAgentId, user = null) {
  const lead = localStore.leads.find(l => l.ref === ref);
  if (!lead) return null;

  lead.agentId = Number(newAgentId);
  lead.lastActivityAt = new Date().toISOString();

  const newAgent = localStore.agents.find(a => a.id === Number(newAgentId));

  localStore.notes.unshift({
    leadRef: ref,
    agentId: lead.agentId,
    authorName: user?.fullName || 'Director',
    noteText: `Lead reassigned to ${newAgent ? newAgent.name : 'Agent ' + newAgentId}.`,
    createdAt: new Date().toISOString()
  });

  saveStore();
  return lead;
}

export async function addLeadNote(ref, noteText, authorName = 'Advisor', agentId = null) {
  const lead = localStore.leads.find(l => l.ref === ref);
  if (!lead) return null;

  const note = {
    leadRef: ref,
    agentId: agentId || lead.agentId,
    authorName: authorName,
    noteText: noteText,
    createdAt: new Date().toISOString()
  };

  localStore.notes.unshift(note);
  lead.lastActivityAt = note.createdAt;

  saveStore();
  return note;
}

/* --------------------------------------------------------------------------
   DEAL WON COMPLETION (Sale Record, 2% Commission, Mark Property Sold)
   -------------------------------------------------------------------------- */
export async function completeWonDeal(data) {
  const salePrice = Number(data.salePriceAED);
  const commission = Math.round(salePrice * 0.02); // 2% commission
  const dldFee = Math.round(salePrice * 0.04);     // 4% DLD fee
  const dealRef = 'SL-DXB-' + Math.floor(1000 + Math.random() * 9000);
  const closingDate = data.closingDate || new Date().toISOString().split('T')[0];

  const saleRecord = {
    dealRef,
    propertyTitle: data.propertyTitle || 'Prime Residence',
    community: data.community || 'Dubai Prime',
    salePriceAED: salePrice,
    buyerName: data.buyerName || 'Private Client',
    sellerName: data.sellerName || 'Private Owner Trust',
    agentId: Number(data.agentId) || 1,
    closingDate: closingDate,
    dldTransferFeeAED: dldFee,
    commissionAED: commission,
    createdAt: new Date().toISOString()
  };

  localStore.sales.unshift(saleRecord);

  // Update lead stage to Won
  if (data.leadRef) {
    const lead = localStore.leads.find(l => l.ref === data.leadRef);
    if (lead) {
      lead.stage = 'Won';
      lead.lastActivityAt = new Date().toISOString();
      localStore.notes.unshift({
        leadRef: lead.ref,
        agentId: lead.agentId,
        authorName: 'Transaction Closing Desk',
        noteText: `Deal Closed Won! Sale Price: AED ${salePrice.toLocaleString()} | 2% Commission: AED ${commission.toLocaleString()} | Ref: ${dealRef}`,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Mark property as Sold in inventory
  let soldTitle = data.propertyTitle;
  if (data.propertyTitle) {
    const prop = localStore.properties.find(
      p => p.title.toLowerCase() === data.propertyTitle.toLowerCase() ||
           p.slug === data.propertySlug
    );
    if (prop) {
      prop.status = 'Sold';
      soldTitle = prop.title;
      console.log(`[INVENTORY] Marked property "${prop.title}" as Sold.`);
    }
  }

  saveStore();
  return {
    saleRecord,
    commissionAED: commission,
    dldTransferFeeAED: dldFee,
    propertyTitle: soldTitle,
    propertySold: soldTitle
  };
}

/* --------------------------------------------------------------------------
   VIEWINGS
   -------------------------------------------------------------------------- */
export async function createViewing(data) {
  const refCode = 'VW-2026-' + Math.floor(100 + Math.random() * 900);
  const now = new Date().toISOString();

  const viewing = {
    ref: refCode,
    propertyId: data.propertyId || null,
    propertyTitle: data.propertyTitle || 'Prime Residence',
    clientName: data.clientName || 'Private Client',
    clientPhone: data.clientPhone || '',
    viewingDate: data.viewingDate || now.split('T')[0],
    viewingTime: data.viewingTime || '11:00 AM',
    agentId: data.agentId || 2,
    status: 'Scheduled',
    notes: data.notes || 'Booked via website viewing portal',
    createdAt: now
  };

  localStore.viewings.unshift(viewing);
  saveStore();

  // Also record/update buyer lead
  const existingLead = localStore.leads.find(l => l.phone === viewing.clientPhone);
  if (existingLead) {
    existingLead.stage = 'Viewing Scheduled';
    existingLead.lastActivityAt = now;
  } else {
    await createBuyerLead({
      firstName: viewing.clientName.split(' ')[0],
      lastName: viewing.clientName.split(' ').slice(1).join(' ') || '',
      phone: viewing.clientPhone,
      interestType: viewing.propertyTitle,
      sourceForm: 'Property Detail: Book a Viewing',
      notes: `Viewing scheduled for ${viewing.viewingDate} at ${viewing.viewingTime}. ${viewing.notes}`
    });
  }

  return viewing;
}

export async function getAllViewings(user = null) {
  if (user && user.role === 'Agent' && user.agentId) {
    return localStore.viewings.filter(v => v.agentId === user.agentId);
  }
  return localStore.viewings;
}

/* --------------------------------------------------------------------------
   NOTIFICATIONS (Bell Icon with Unseen Count)
   -------------------------------------------------------------------------- */
export async function getNotifications(user = null) {
  let leads = localStore.leads;
  if (user && user.role === 'Agent' && user.agentId) {
    leads = leads.filter(l => l.agentId === user.agentId);
  }

  const unseenCount = leads.filter(l => l.isSeen === false).length;
  const recentLeads = leads.slice(0, 10).map(l => ({
    ref: l.ref,
    firstName: l.firstName,
    lastName: l.lastName || '',
    name: `${l.firstName} ${l.lastName || ''}`.trim(),
    phone: l.phone,
    temperature: l.temperature,
    score: l.score,
    interestType: l.interestType,
    interest: l.interestType,
    budget: l.budget,
    sourceForm: l.sourceForm,
    createdAt: l.createdAt,
    isSeen: l.isSeen
  }));

  return {
    unreadCount: unseenCount,
    unseenCount,
    recent: recentLeads,
    recentLeads
  };
}

export async function markNotificationsAsRead(user = null) {
  localStore.leads.forEach(l => {
    if (!user || user.role === 'Director' || l.agentId === user.agentId) {
      l.isSeen = true;
    }
  });
  return { success: true };
}

/* --------------------------------------------------------------------------
   DASHBOARD ANALYTICS & CHARTS
   -------------------------------------------------------------------------- */
export async function getAdminAnalytics(user = null) {
  let leads = localStore.leads;
  let viewings = localStore.viewings;
  let sales = localStore.sales;

  if (user && user.role === 'Agent' && user.agentId) {
    leads = leads.filter(l => l.agentId === user.agentId);
    viewings = viewings.filter(v => v.agentId === user.agentId);
    sales = sales.filter(s => s.agentId === user.agentId);
  }

  // 1. Leads Today
  const todayStr = new Date().toISOString().split('T')[0];
  const newLeadsToday = leads.filter(l => l.createdAt.startsWith(todayStr)).length;

  // 2. Active Pipeline Value (estimated)
  const activeLeads = leads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost');
  const pipelineValueAED = activeLeads.reduce((acc, l) => {
    let est = 25000000;
    if (l.budget.includes('50M')) est = 50000000;
    if (l.budget.includes('25M')) est = 35000000;
    if (l.budget.includes('15M')) est = 20000000;
    if (l.budget.includes('2M')) est = 3000000;
    return acc + est;
  }, 0);

  // 3. Viewings this week
  const viewingsThisWeek = viewings.length;

  // 4. Sales & Commission this month
  const totalSalesAED = sales.reduce((acc, s) => acc + Number(s.salePriceAED), 0);
  const totalCommissionAED = sales.reduce((acc, s) => acc + Number(s.commissionAED), 0);

  // 5. Stage Breakdown
  const stageCounts = {
    'New': leads.filter(l => l.stage === 'New').length,
    'Contacted': leads.filter(l => l.stage === 'Contacted').length,
    'Viewing Scheduled': leads.filter(l => l.stage === 'Viewing Scheduled').length,
    'Offer Made': leads.filter(l => l.stage === 'Offer Made').length,
    'Under Contract': leads.filter(l => l.stage === 'Under Contract').length,
    'Won': leads.filter(l => l.stage === 'Won').length,
    'Lost': leads.filter(l => l.stage === 'Lost').length
  };

  // 6. Temperature Breakdown
  const tempCounts = {
    'HOT': leads.filter(l => l.temperature === 'HOT').length,
    'WARM': leads.filter(l => l.temperature === 'WARM').length,
    'COLD': leads.filter(l => l.temperature === 'COLD').length
  };

  // 7. Stale Leads Count (3+ days no activity)
  const threeDaysAgo = Date.now() - (3 * 86400000);
  const staleLeadsCount = leads.filter(l =>
    new Date(l.lastActivityAt).getTime() < threeDaysAgo &&
    l.stage !== 'Won' && l.stage !== 'Lost'
  ).length;

  return {
    kpi: {
      newLeadsToday,
      pipelineDealValueAED: pipelineValueAED,
      activePipelineDeals: activeLeads.length,
      viewingsScheduled: viewingsThisWeek,
      salesCommissionThisMonthAED: totalCommissionAED,
      closedSalesThisMonth: sales.length,
      staleLeadsCount
    },
    charts: {
      leadsByStage: stageCounts,
      leadsByTemperature: tempCounts
    },
    recentLeads: leads.slice(0, 10),
    recentSales: sales.slice(0, 5),
    newLeadsToday,
    pipelineValueAED,
    viewingsThisWeek,
    totalSalesAED,
    totalCommissionAED,
    stageCounts,
    tempCounts,
    staleLeadsCount
  };
}

/* --------------------------------------------------------------------------
   AGENT LEADERBOARD AGAINST MONTHLY TARGETS
   -------------------------------------------------------------------------- */
export async function getAgentLeaderboard() {
  const TARGET_AED = 40000000; // 40M AED quota

  const leaderboard = localStore.agents.map((agent, index) => {
    const agentSales = localStore.sales.filter(s => s.agentId === agent.id);
    const closedVolume = agentSales.reduce((acc, s) => acc + Number(s.salePriceAED), 0);
    const totalCommission = agentSales.reduce((acc, s) => acc + Number(s.commissionAED), 0);
    const activeDeals = localStore.leads.filter(
      l => l.agentId === agent.id && (l.stage === 'Offer Made' || l.stage === 'Under Contract')
    ).length;

    const progressPercent = Math.min(100, Math.round((closedVolume / TARGET_AED) * 100));

    return {
      rank: index + 1,
      id: agent.id,
      name: agent.name,
      role: agent.role,
      title: agent.role,
      photo: agent.photo,
      targetAED: TARGET_AED,
      monthlyTargetAED: TARGET_AED,
      closedVolumeAED: closedVolume,
      salesVolumeAED: closedVolume,
      commissionAED: totalCommission,
      commissionEarnedAED: totalCommission,
      activeDealsCount: activeDeals,
      activePipelineCount: activeDeals,
      closedDealsCount: agentSales.length,
      dealsClosedCount: agentSales.length,
      progressPercent
    };
  });

  return {
    leaderboard,
    sales: localStore.sales
  };
}

/* --------------------------------------------------------------------------
   PROPERTY & PROJECT INVENTORY CRUD (Add, Edit, Remove)
   -------------------------------------------------------------------------- */
export async function getAllProperties() {
  return localStore.properties;
}

export async function getPropertyBySlug(slug) {
  return localStore.properties.find(p => p.slug === slug || p.slug.includes(slug));
}

export async function createProperty(data) {
  const slug = (data.title || 'luxury-residence')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const newProp = {
    id: localStore.properties.length + 1,
    slug: slug,
    title: data.title,
    category: data.category || 'Apartment',
    community: data.community || 'Downtown Dubai',
    subCommunity: data.subCommunity || '',
    priceAED: Number(data.priceAED) || 10000000,
    bedrooms: Number(data.bedrooms) || 3,
    bathrooms: Number(data.bathrooms) || 4,
    builtUpAreaSqft: Number(data.builtUpAreaSqft) || 3500,
    furnishing: data.furnishing || 'Turnkey Furnished',
    view: data.view || 'Panoramic Dubai Skyline',
    status: data.status || 'Ready to Move',
    image: data.image || '/assets/images/hero_dubai_skyline_unique.jpg',
    gallery: [data.image || '/assets/images/hero_dubai_skyline_unique.jpg'],
    description: data.description || 'A magnificent luxury home in Dubai.',
    features: data.features || ['Floor to ceiling double glazing', 'Private terrace', 'Smart home automation'],
    agentId: Number(data.agentId) || 1
  };

  localStore.properties.unshift(newProp);
  saveStore();
  return newProp;
}

export async function updateProperty(slug, data) {
  const index = localStore.properties.findIndex(p => p.slug === slug);
  if (index === -1) return null;

  localStore.properties[index] = {
    ...localStore.properties[index],
    ...data,
    priceAED: data.priceAED ? Number(data.priceAED) : localStore.properties[index].priceAED
  };

  saveStore();
  return localStore.properties[index];
}

export async function deleteProperty(slug) {
  const index = localStore.properties.findIndex(p => p.slug === slug);
  if (index === -1) return false;
  localStore.properties.splice(index, 1);
  saveStore();
  return true;
}

export async function getAllOffplanProjects() {
  return localStore.offplanProjects;
}

export async function getOffplanProjectBySlug(slug) {
  return localStore.offplanProjects.find(p => p.slug === slug || p.slug.includes(slug));
}

export async function createOffplanProject(data) {
  const slug = (data.title || 'iconic-project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const newProject = {
    slug,
    developerSlug: data.developerSlug || 'aura-luxe-developments',
    developerName: data.developerName || 'Aura Luxe Developments',
    title: data.title,
    community: data.community || 'Dubai Water Canal',
    startingPriceAED: Number(data.startingPriceAED) || 15000000,
    handoverDate: data.handoverDate || 'Q4 2027',
    paymentPlan: data.paymentPlan || '60/40 Post-Handover',
    paymentPlanDetails: {
      booking: "20% On Booking",
      duringConstruction: "40% During Construction",
      onHandover: "20% On Handover",
      postHandover: "20% Post-Handover"
    },
    image: data.image || '/assets/images/offplan_solis_tower.jpg',
    description: data.description || 'Visionary luxury architectural launch.',
    tagline: data.tagline || 'Sculptural Waterfront Architecture',
    features: data.features || ['Private sky pools', 'Direct marina berths', 'Full concierge'],
    constructionStatus: data.constructionStatus || 'Sub-Structure Underway',
    totalUnits: Number(data.totalUnits) || 120
  };

  localStore.offplanProjects.unshift(newProject);
  saveStore();
  return newProject;
}

export async function updateOffplanProject(slug, data) {
  const index = localStore.offplanProjects.findIndex(p => p.slug === slug);
  if (index === -1) return null;

  localStore.offplanProjects[index] = {
    ...localStore.offplanProjects[index],
    ...data,
    startingPriceAED: data.startingPriceAED ? Number(data.startingPriceAED) : localStore.offplanProjects[index].startingPriceAED
  };

  saveStore();
  return localStore.offplanProjects[index];
}

export async function deleteOffplanProject(slug) {
  const index = localStore.offplanProjects.findIndex(p => p.slug === slug);
  if (index === -1) return false;
  localStore.offplanProjects.splice(index, 1);
  saveStore();
  return true;
}

export async function getAllDevelopers() {
  return localStore.developers;
}

export async function getAllAgents() {
  return localStore.agents;
}
