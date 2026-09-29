/* ==========================================================================
   PR REAL ESTATE - EXECUTIVE CRM & ADMIN PORTAL ENGINE
   ========================================================================== */

const API_BASE = 'http://localhost:3001/api';

// Format currency
const formatAED = (amount) => {
  if (amount == null || isNaN(amount)) return 'AED 0';
  return 'AED ' + Math.round(Number(amount)).toLocaleString('en-US');
};

/* --------------------------------------------------------------------------
   1. Staff Session Management
   -------------------------------------------------------------------------- */
export function getStaffSession() {
  try {
    const raw = localStorage.getItem('pr_staff_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStaffSession(user, token) {
  localStorage.setItem('pr_staff_session', JSON.stringify({ user, token }));
}

export function clearStaffSession() {
  localStorage.removeItem('pr_staff_session');
}

export function getAuthHeaders() {
  const session = getStaffSession();
  return {
    'Content-Type': 'application/json',
    'x-user-role': session?.user?.role || 'Director',
    'x-user-username': session?.user?.username || 'admin',
    'x-user-agent-id': session?.user?.agentId != null ? String(session.user.agentId) : '',
    'x-user-fullname': session?.user?.fullName || 'Jay'
  };
}

/* --------------------------------------------------------------------------
   2. Authentication (Director & Agents)
   -------------------------------------------------------------------------- */
export async function handleStaffLogin(e) {
  if (e) e.preventDefault();
  const errorEl = document.getElementById('adminLoginError');
  if (errorEl) errorEl.style.display = 'none';

  const username = document.getElementById('adminLoginUsername')?.value.trim();
  const password = document.getElementById('adminLoginPassword')?.value;

  if (!username || !password) {
    if (errorEl) {
      errorEl.textContent = 'Please enter both username and password.';
      errorEl.style.display = 'block';
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      if (errorEl) {
        errorEl.textContent = data.message || 'Invalid username or password.';
        errorEl.style.display = 'block';
      }
      return;
    }

    setStaffSession(data.user, data.token);
    window.prApp.showToast('Access Granted', `Welcome back, ${data.user.fullName}. Signed in as ${data.user.role}.`);
    startNotificationPolling();
    window.location.hash = '#/admin/dashboard';
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Server connection issue. Please check the API server.';
      errorEl.style.display = 'block';
    }
  }
}

export function fillDemoLogin(username, password) {
  const uInput = document.getElementById('adminLoginUsername');
  const pInput = document.getElementById('adminLoginPassword');
  if (uInput) uInput.value = username;
  if (pInput) pInput.value = password;
  handleStaffLogin();
}

export function handleStaffLogout() {
  clearStaffSession();
  stopNotificationPolling();
  const adminTopBar = document.getElementById('adminTopBar');
  if (adminTopBar) adminTopBar.style.display = 'none';
  window.prApp.showToast('Signed Out', 'You have securely signed out of the private CRM portal.');
  window.location.hash = '#/admin/login';
}

/* --------------------------------------------------------------------------
   3. 60-Second Live Bell Polling & Notifications
   -------------------------------------------------------------------------- */
let notifTimer = null;

export function startNotificationPolling() {
  if (notifTimer) clearInterval(notifTimer);
  pollAdminNotifications();
  // Refresh bell every minute (60,000ms)
  notifTimer = setInterval(pollAdminNotifications, 60000);
}

export function stopNotificationPolling() {
  if (notifTimer) {
    clearInterval(notifTimer);
    notifTimer = null;
  }
}

export async function pollAdminNotifications() {
  const session = getStaffSession();
  if (!session) return;

  try {
    const res = await fetch(`${API_BASE}/admin/notifications`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;

    const data = await res.json();
    const badge = document.getElementById('adminBellBadge');
    const notifList = document.getElementById('adminNotifList');

    if (badge) {
      if (data.unreadCount > 0) {
        badge.textContent = data.unreadCount > 99 ? '99+' : data.unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }

    if (notifList) {
      if (!data.recent || data.recent.length === 0) {
        notifList.innerHTML = `<li class="notif-item" style="color: #888; font-size: 0.75rem; text-align: center; padding: 1.5rem;">No new unread leads</li>`;
      } else {
        notifList.innerHTML = data.recent.map(item => `
          <li class="notif-item ${!item.isSeen ? 'unread' : ''}" onclick="window.prApp.handleNotificationClick('${item.ref}')">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
              <strong style="font-size: 0.78rem; color: var(--color-charcoal);">${escapeHtml(item.firstName)} ${escapeHtml(item.lastName || '')}</strong>
              <span class="badge-${(item.temperature || 'WARM').toLowerCase()}">${item.temperature || 'WARM'}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--color-warmgray); margin-bottom: 0.25rem;">
              ${escapeHtml(item.interestType || 'Prime Acquisition')} • Score: <strong>${item.score}/100</strong>
            </div>
            <div style="font-size: 0.65rem; color: #888; display: flex; justify-content: space-between;">
              <span>Source: ${escapeHtml(item.sourceForm || 'Website')}</span>
              <span>Ref: ${escapeHtml(item.ref)}</span>
            </div>
          </li>
        `).join('');
      }
    }
  } catch (err) {
    console.warn('[CRM Bell] Notification poll error:', err.message);
  }
}

export function toggleNotificationsDropdown() {
  const dropdown = document.getElementById('adminNotifDropdown');
  if (dropdown) dropdown.classList.toggle('open');
}

export async function markNotificationsRead() {
  try {
    await fetch(`${API_BASE}/admin/notifications/mark-read`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const badge = document.getElementById('adminBellBadge');
    if (badge) badge.style.display = 'none';
    const dropdown = document.getElementById('adminNotifDropdown');
    if (dropdown) dropdown.classList.remove('open');
    pollAdminNotifications();
  } catch (err) {
    console.warn(err);
  }
}

export function handleNotificationClick(leadRef) {
  const dropdown = document.getElementById('adminNotifDropdown');
  if (dropdown) dropdown.classList.remove('open');
  window.location.hash = `#/admin/lead/${leadRef}`;
}

/* --------------------------------------------------------------------------
   4. Dashboard Overview (KPIs, Charts, Hot Leads)
   -------------------------------------------------------------------------- */
export async function renderAdminDashboard() {
  const session = getStaffSession();
  if (!session) return;

  try {
    const res = await fetch(`${API_BASE}/admin/analytics`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;

    const json = await res.json();
    const data = json.data;

    // Update KPI numbers
    const kpiNewLeads = document.getElementById('kpiNewLeadsToday');
    const kpiTotalValue = document.getElementById('kpiTotalPipelineValue');
    const kpiActiveDeals = document.getElementById('kpiActiveDealsSub');
    const kpiViewings = document.getElementById('kpiViewingsWeek');
    const kpiSalesComm = document.getElementById('kpiSalesCommission');
    const kpiClosedDeals = document.getElementById('kpiClosedDealsSub');

    if (kpiNewLeads) kpiNewLeads.textContent = data.kpi.newLeadsToday;
    if (kpiTotalValue) kpiTotalValue.textContent = formatAED(data.kpi.pipelineDealValueAED);
    if (kpiActiveDeals) kpiActiveDeals.textContent = `${data.kpi.activePipelineDeals} Active Inquiries in Portfolio`;
    if (kpiViewings) kpiViewings.textContent = data.kpi.viewingsScheduled;
    if (kpiSalesComm) kpiSalesComm.textContent = formatAED(data.kpi.salesCommissionThisMonthAED);
    if (kpiClosedDeals) kpiClosedDeals.textContent = `${data.kpi.closedSalesThisMonth} Closed Transactions (2% Commission)`;

    // Render Stage Distribution Bars
    const stageDistEl = document.getElementById('dashboardStageDistribution');
    if (stageDistEl && data.charts.leadsByStage) {
      const stages = Object.entries(data.charts.leadsByStage);
      const maxCount = Math.max(...stages.map(s => s[1]), 1);

      stageDistEl.innerHTML = stages.map(([stage, count]) => {
        const pct = Math.round((count / maxCount) * 100);
        return `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-bottom: 0.35rem;">
              <span style="font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-charcoal);">${escapeHtml(stage)}</span>
              <strong>${count} leads</strong>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Temperature Breakdown
    const tempDistEl = document.getElementById('dashboardTempDistribution');
    if (tempDistEl && data.charts.leadsByTemperature) {
      const { HOT = 0, WARM = 0, COLD = 0 } = data.charts.leadsByTemperature;
      const total = (HOT + WARM + COLD) || 1;

      tempDistEl.innerHTML = `
        <div style="background-color: var(--color-offwhite); border-left: 3px solid #D32F2F; padding: 1rem 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="badge-hot">🔥 HOT LEADS (75–100 PTS)</span>
            <strong style="font-size: 1.1rem; color: #D32F2F;">${HOT}</strong>
          </div>
          <div style="font-size: 0.72rem; color: var(--color-warmgray); margin-bottom: 0.5rem;">
            Immediate cash buyers, top budgets & property-matched clients (${Math.round((HOT / total) * 100)}%).
          </div>
          <div class="progress-bar-bg"><div style="height: 100%; width: ${Math.round((HOT / total) * 100)}%; background-color: #D32F2F;"></div></div>
        </div>

        <div style="background-color: var(--color-offwhite); border-left: 3px solid #EF6C00; padding: 1rem 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="badge-warm">⚡ WARM LEADS (45–74 PTS)</span>
            <strong style="font-size: 1.1rem; color: #EF6C00;">${WARM}</strong>
          </div>
          <div style="font-size: 0.72rem; color: var(--color-warmgray); margin-bottom: 0.5rem;">
            Buyers with clear budgets ready to acquire within 1-3 months (${Math.round((WARM / total) * 100)}%).
          </div>
          <div class="progress-bar-bg"><div style="height: 100%; width: ${Math.round((WARM / total) * 100)}%; background-color: #EF6C00;"></div></div>
        </div>

        <div style="background-color: var(--color-offwhite); border-left: 3px solid #546E7A; padding: 1rem 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="badge-cold">❄ COLD LEADS (&lt;45 PTS)</span>
            <strong style="font-size: 1.1rem; color: #546E7A;">${COLD}</strong>
          </div>
          <div style="font-size: 0.72rem; color: var(--color-warmgray); margin-bottom: 0.5rem;">
            Early-stage exploratory inquiries and brochure downloads (${Math.round((COLD / total) * 100)}%).
          </div>
          <div class="progress-bar-bg"><div style="height: 100%; width: ${Math.round((COLD / total) * 100)}%; background-color: #546E7A;"></div></div>
        </div>
      `;
    }

    // Render Recent Hot Leads Table
    const hotLeadsBody = document.getElementById('dashboardHotLeadsBody');
    if (hotLeadsBody) {
      const hotLeads = (data.recentLeads || []).filter(l => l.temperature === 'HOT').slice(0, 6);
      if (hotLeads.length === 0) {
        hotLeadsBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #888; padding: 2rem;">No hot leads currently registered.</td></tr>`;
      } else {
        hotLeadsBody.innerHTML = hotLeads.map(l => {
          const cleanPhone = (l.phone || '').replace(/[^0-9]/g, '');
          return `
            <tr>
              <td><a href="#/admin/lead/${l.ref}" style="font-weight: 600; color: var(--color-gold); font-family: monospace;">${escapeHtml(l.ref)}</a></td>
              <td><strong>${escapeHtml(l.firstName)} ${escapeHtml(l.lastName || '')}</strong></td>
              <td><span class="score-pill high">${l.score}/100</span> <span class="badge-hot">HOT</span></td>
              <td>${escapeHtml(l.interestType || 'Dubai Prime')}</td>
              <td><strong>${escapeHtml(l.budget || 'Private')}</strong></td>
              <td><span style="font-size: 0.7rem; color: var(--color-warmgray);">${escapeHtml(l.sourceForm || 'Website')}</span></td>
              <td><span style="font-size: 0.68rem; text-transform: uppercase; font-weight: 600;">${escapeHtml(l.stage)}</span></td>
              <td>
                <div style="display: flex; gap: 0.4rem;">
                  <a href="tel:${l.phone}" class="action-btn-call" title="Call ${l.firstName}">📞 Call</a>
                  <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(l.firstName)},%20this%20is%20PR%20Real%20Estate." target="_blank" class="action-btn-whatsapp" title="WhatsApp VIP">💬 VIP</a>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.warn('[CRM Dashboard] Error loading analytics:', err.message);
  }
}

export function refreshAdminDashboard() {
  renderAdminDashboard();
  window.prApp.showToast('Dashboard Refreshed', 'Live CRM analytics updated successfully.');
}

/* --------------------------------------------------------------------------
   5. Interactive Kanban Pipeline Board (Drag & Drop)
   -------------------------------------------------------------------------- */
let cachedPipelineLeads = [];
let currentPipelineAgentFilter = 'all';

export async function renderAdminPipeline() {
  const session = getStaffSession();
  if (!session) return;

  try {
    const res = await fetch(`${API_BASE}/admin/leads`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;

    const json = await res.json();
    cachedPipelineLeads = json.data || [];
    renderKanbanColumns();
  } catch (err) {
    console.warn('[CRM Pipeline] Error loading leads:', err.message);
  }
}

export function filterPipelineByAgent(agentId) {
  currentPipelineAgentFilter = agentId;
  renderKanbanColumns();
}

function renderKanbanColumns() {
  const board = document.getElementById('kanbanBoard');
  if (!board) return;

  const STAGES = [
    { key: 'New', title: 'New Leads', icon: '📥' },
    { key: 'Contacted', title: 'Contacted', icon: '📞' },
    { key: 'Viewing Scheduled', title: 'Viewing Scheduled', icon: '📅' },
    { key: 'Offer Made', title: 'Offer Made', icon: '📝' },
    { key: 'Under Contract', title: 'Under Contract', icon: '⚖️' },
    { key: 'Won', title: 'Won (Closed)', icon: '🏆' },
    { key: 'Lost', title: 'Lost / Archive', icon: '📁' }
  ];

  let filtered = [...cachedPipelineLeads];
  if (currentPipelineAgentFilter !== 'all') {
    filtered = filtered.filter(l => String(l.agentId) === String(currentPipelineAgentFilter));
  }

  board.innerHTML = STAGES.map(stageObj => {
    const stageLeads = filtered.filter(l => (l.stage || '').toLowerCase() === stageObj.key.toLowerCase());
    return `
      <div class="kanban-column" data-stage="${stageObj.key}">
        <div class="kanban-header">
          <span class="kanban-title">
            <span>${stageObj.icon}</span> ${stageObj.title}
          </span>
          <span class="kanban-count">${stageLeads.length}</span>
        </div>
        <div class="kanban-dropzone"
             data-stage="${stageObj.key}"
             ondragover="window.prApp.onKanbanDragOver(event)"
             ondragleave="window.prApp.onKanbanDragLeave(event)"
             ondrop="window.prApp.onKanbanDrop(event, '${stageObj.key}')">
          ${stageLeads.map(lead => renderKanbanCard(lead)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderKanbanCard(lead) {
  const tempClass = `badge-${(lead.temperature || 'WARM').toLowerCase()}`;
  const isStale = (lead.daysAgo >= 3);

  return `
    <div class="kanban-card"
         draggable="true"
         data-ref="${lead.ref}"
         ondragstart="window.prApp.onKanbanDragStart(event)"
         onclick="window.location.hash = '#/admin/lead/${lead.ref}'">
      <div class="kanban-card-header">
        <h4 class="kanban-card-title">${escapeHtml(lead.firstName)} ${escapeHtml(lead.lastName || '')}</h4>
        <span class="${tempClass}">${lead.temperature || 'WARM'}</span>
      </div>

      <div class="kanban-card-meta">
        <div><strong>${escapeHtml(lead.interestType || 'Private Residence')}</strong></div>
        <div style="color: var(--color-gold); font-weight: 500;">${escapeHtml(lead.budget || 'Private Allocation')}</div>
        <div style="font-size: 0.65rem; color: #888; margin-top: 0.25rem;">Source: ${escapeHtml(lead.sourceForm || 'Website')}</div>
      </div>

      <div class="kanban-card-footer">
        <span class="score-pill ${lead.score >= 75 ? 'high' : ''}">Score: ${lead.score}/100</span>
        ${isStale ? '<span class="stale-warning" title="No activity for 3+ days">⚠️ 3d+ Inactive</span>' : ''}
      </div>
    </div>
  `;
}

// Drag & Drop Handlers
export function onKanbanDragStart(e) {
  const card = e.currentTarget;
  const ref = card.dataset.ref;
  e.dataTransfer.setData('text/plain', ref);
  card.classList.add('dragging');
}

export function onKanbanDragOver(e) {
  e.preventDefault();
  const dropzone = e.currentTarget;
  dropzone.classList.add('over');
}

export function onKanbanDragLeave(e) {
  const dropzone = e.currentTarget;
  dropzone.classList.remove('over');
}

export async function onKanbanDrop(e, targetStage) {
  e.preventDefault();
  const dropzone = e.currentTarget;
  dropzone.classList.remove('over');

  const ref = e.dataTransfer.getData('text/plain');
  if (!ref) return;

  const lead = cachedPipelineLeads.find(l => l.ref === ref);
  if (!lead) return;

  if (targetStage === 'Won') {
    // Open Deal Won Closing Modal
    openDealWonModal(ref, `${lead.firstName} ${lead.lastName || ''}`, lead.interestType);
    return;
  }

  // Update stage in backend
  try {
    const res = await fetch(`${API_BASE}/admin/leads/${ref}/stage`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stage: targetStage })
    });

    if (res.ok) {
      lead.stage = targetStage;
      renderKanbanColumns();
      window.prApp.showToast('Stage Updated', `Lead ${ref} moved to "${targetStage}".`);
    }
  } catch (err) {
    console.warn('[CRM Pipeline] Drop error:', err.message);
  }
}

/* --------------------------------------------------------------------------
   6. Leads Directory & Excel Export (CSV)
   -------------------------------------------------------------------------- */
let cachedLeadsList = [];

export async function renderAdminLeadsList() {
  const session = getStaffSession();
  if (!session) return;

  try {
    const res = await fetch(`${API_BASE}/admin/leads`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;

    const json = await res.json();
    cachedLeadsList = json.data || [];
    applyLeadFilters();
  } catch (err) {
    console.warn('[CRM Leads] Error loading directory:', err.message);
  }
}

export function applyLeadFilters() {
  const query = (document.getElementById('leadsSearchInput')?.value || '').toLowerCase().trim();
  const tempFilter = document.getElementById('leadsTempFilter')?.value || 'all';
  const stageFilter = document.getElementById('leadsStageFilter')?.value || 'all';
  const agentFilter = document.getElementById('leadsAgentFilter')?.value || 'all';

  let results = cachedLeadsList.filter(l => {
    // Search match
    if (query) {
      const matchName = `${l.firstName} ${l.lastName || ''}`.toLowerCase().includes(query);
      const matchPhone = (l.phone || '').toLowerCase().includes(query);
      const matchRef = (l.ref || '').toLowerCase().includes(query);
      const matchInterest = (l.interestType || '').toLowerCase().includes(query);
      const matchCommunity = (l.community || '').toLowerCase().includes(query);
      if (!matchName && !matchPhone && !matchRef && !matchInterest && !matchCommunity) return false;
    }

    // Temperature filter
    if (tempFilter !== 'all' && l.temperature !== tempFilter) return false;

    // Stage filter
    if (stageFilter !== 'all' && (l.stage || '').toLowerCase() !== stageFilter.toLowerCase()) return false;

    // Agent filter
    if (agentFilter !== 'all' && String(l.agentId) !== String(agentFilter)) return false;

    return true;
  });

  const tbody = document.getElementById('adminLeadsTableBody');
  if (!tbody) return;

  if (results.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #888; padding: 2.5rem;">No leads matching search criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = results.map(l => {
    const cleanPhone = (l.phone || '').replace(/[^0-9]/g, '');
    const tempClass = `badge-${(l.temperature || 'WARM').toLowerCase()}`;
    const agentName = getAgentNameById(l.agentId);

    return `
      <tr>
        <td>
          <a href="#/admin/lead/${l.ref}" style="font-family: monospace; font-weight: 600; color: var(--color-gold);">
            ${escapeHtml(l.ref)}
          </a>
        </td>
        <td>
          <strong>${escapeHtml(l.firstName)} ${escapeHtml(l.lastName || '')}</strong>
          <div style="font-size: 0.7rem; color: var(--color-warmgray);">${escapeHtml(l.interestType || 'Private Residence')}</div>
        </td>
        <td>
          <div>${escapeHtml(l.phone || '')}</div>
          <div style="display: flex; gap: 0.35rem; margin-top: 0.25rem;">
            <a href="tel:${l.phone}" style="font-size: 0.65rem; color: var(--color-gold);">📞 Call</a>
            <span style="color: #ccc;">•</span>
            <a href="https://wa.me/${cleanPhone}" target="_blank" style="font-size: 0.65rem; color: #25D366;">💬 WhatsApp</a>
          </div>
        </td>
        <td>
          <span class="score-pill ${l.score >= 75 ? 'high' : ''}">${l.score}/100</span>
          <span class="${tempClass}">${l.temperature}</span>
        </td>
        <td><span style="font-size: 0.72rem; color: #555;">${escapeHtml(l.sourceForm || 'Website')}</span></td>
        <td><strong>${escapeHtml(l.budget || 'Private')}</strong></td>
        <td><span style="font-size: 0.7rem; text-transform: uppercase; font-weight: 600; background: var(--color-offwhite); padding: 0.2rem 0.5rem; border: 1px solid var(--color-lightgray);">${escapeHtml(l.stage)}</span></td>
        <td><span style="font-size: 0.75rem;">${escapeHtml(agentName)}</span></td>
        <td style="text-align: right;">
          <a href="#/admin/lead/${l.ref}" class="btn btn-charcoal-outline" style="padding: 0.35rem 0.7rem; font-size: 0.65rem;">
            Manage Lead →
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

export function exportLeadsToExcel() {
  if (!cachedLeadsList || cachedLeadsList.length === 0) {
    window.prApp.showToast('No Data', 'No leads available to export.');
    return;
  }

  // Generate RFC 4180 CSV with UTF-8 Byte Order Mark (BOM) for native Excel opening
  const headers = [
    'Reference ID',
    'First Name',
    'Last Name',
    'Phone Number',
    'Lead Score (0-100)',
    'Temperature',
    'Deal Stage',
    'Acquisition Focus',
    'Budget',
    'Payment Method',
    'Buying Timeline',
    'Source Form',
    'Assigned Advisor',
    'Created Date'
  ];

  const rows = cachedLeadsList.map(l => [
    l.ref,
    l.firstName,
    l.lastName || '',
    l.phone,
    l.score,
    l.temperature,
    l.stage,
    l.interestType,
    l.budget,
    l.paymentMethod || 'Cash Buyer',
    l.buyingTimeline || 'Immediate',
    l.sourceForm || 'Website Registration',
    getAgentNameById(l.agentId),
    new Date(l.createdAt || Date.now()).toLocaleDateString('en-GB')
  ]);

  const escapeCSV = (val) => {
    const s = String(val == null ? '' : val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvContent = '\uFEFF' + [
    headers.map(escapeCSV).join(','),
    ...rows.map(r => r.map(escapeCSV).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PR_Real_Estate_Leads_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  window.prApp.showToast('Export Completed', `Successfully exported ${cachedLeadsList.length} buyer leads to Excel CSV.`);
}

/* --------------------------------------------------------------------------
   7. Single Lead Detail Page (Score Breakdown, Actions, Stage, Notes)
   -------------------------------------------------------------------------- */
export async function renderAdminLeadDetail(leadRef) {
  const container = document.getElementById('leadDetailContent');
  if (!container) return;

  if (!leadRef) {
    container.innerHTML = `<p style="padding: 2rem; color: #888;">No lead reference provided.</p>`;
    return;
  }

  container.innerHTML = `<div style="text-align: center; padding: 3rem; color: #888;">Loading lead details...</div>`;

  try {
    const res = await fetch(`${API_BASE}/admin/leads/${leadRef}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      container.innerHTML = `<div style="padding: 2rem; color: #C62828;">Lead not found or permission denied.</div>`;
      return;
    }

    const json = await res.json();
    const lead = json.data;
    const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
    const tempClass = `badge-${(lead.temperature || 'WARM').toLowerCase()}`;

    container.innerHTML = `
      <!-- Lead Header Card -->
      <div style="background-color: var(--color-white); border: 1px solid var(--color-lightgray); padding: 2rem 2.5rem; margin-bottom: 2rem; box-shadow: var(--shadow-soft);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.5rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
              <span class="admin-portal-badge">${lead.ref}</span>
              <span class="${tempClass}">${lead.temperature} LEAD</span>
              <span class="score-pill high" style="font-size: 0.75rem;">Score: ${lead.score}/100</span>
            </div>
            <h1 style="font-family: var(--font-heading); font-size: 2.4rem; color: var(--color-charcoal); margin: 0 0 0.25rem;">
              ${escapeHtml(lead.firstName)} ${escapeHtml(lead.lastName || '')}
            </h1>
            <p style="font-size: 0.85rem; color: var(--color-warmgray); margin: 0;">
              Acquisition Focus: <strong>${escapeHtml(lead.interestType || 'Prime Residences')}</strong> • Community: <strong>${escapeHtml(lead.community || 'Dubai Prime')}</strong>
            </p>
          </div>

          <!-- Direct Call, WhatsApp & Schedule Buttons -->
          <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
            <a href="tel:${lead.phone}" class="action-btn-call">
              <span>📞</span> Call Buyer
            </a>
            <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(lead.firstName)},%20this%20is%20PR%20Real%20Estate%20Advisory." target="_blank" class="action-btn-whatsapp">
              <span>💬</span> WhatsApp VIP
            </a>
            <button class="btn btn-gold-solid" style="padding: 0.65rem 1.15rem; font-size: 0.72rem;" onclick="window.prApp.openAdminBookViewingModal('${lead.ref}', '${escapeHtml(lead.firstName)} ${escapeHtml(lead.lastName || '')}', '${lead.phone}')">
              📅 Book Viewing
            </button>
          </div>
        </div>
      </div>

      <!-- Two-Column Profile & Notes Layout -->
      <div class="lead-detail-layout">
        <!-- Left: Profile & Stage Controls -->
        <div class="lead-profile-card">
          <span class="section-tag" style="margin-bottom: 0.25rem;">CLIENT FILE</span>
          <h3 style="font-family: var(--font-heading); font-size: 1.6rem; color: var(--color-charcoal); margin-bottom: 1.5rem;">
            Profile & Stage Management
          </h3>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; font-size: 0.85rem;">
            <div>
              <label style="font-size: 0.65rem; text-transform: uppercase; color: var(--color-warmgray); letter-spacing: 0.1em; display: block; margin-bottom: 0.2rem;">Direct Phone</label>
              <strong><a href="tel:${lead.phone}" style="color: var(--color-charcoal);">${escapeHtml(lead.phone)}</a></strong>
            </div>

            <div>
              <label style="font-size: 0.65rem; text-transform: uppercase; color: var(--color-warmgray); letter-spacing: 0.1em; display: block; margin-bottom: 0.2rem;">Budget Target</label>
              <strong style="color: var(--color-gold); font-size: 1rem;">${escapeHtml(lead.budget || 'Private')}</strong>
            </div>

            <div>
              <label style="font-size: 0.65rem; text-transform: uppercase; color: var(--color-warmgray); letter-spacing: 0.1em; display: block; margin-bottom: 0.2rem;">Payment Method</label>
              <span>${escapeHtml(lead.paymentMethod || 'Cash Buyer (Liquid Funds)')}</span>
            </div>

            <div>
              <label style="font-size: 0.65rem; text-transform: uppercase; color: var(--color-warmgray); letter-spacing: 0.1em; display: block; margin-bottom: 0.2rem;">Timeline</label>
              <span>${escapeHtml(lead.buyingTimeline || 'Immediate (30 Days)')}</span>
            </div>

            <div style="grid-column: span 2;">
              <label style="font-size: 0.65rem; text-transform: uppercase; color: var(--color-warmgray); letter-spacing: 0.1em; display: block; margin-bottom: 0.2rem;">Origin / Source Form</label>
              <span style="background: var(--color-offwhite); padding: 0.25rem 0.6rem; border: 1px solid var(--color-lightgray); font-size: 0.75rem; font-weight: 500;">
                📍 ${escapeHtml(lead.sourceForm || 'Website Registration')}
              </span>
            </div>
          </div>

          <!-- Scoring Breakdown Criteria -->
          <div style="background-color: var(--color-offwhite); border: 1px solid var(--color-lightgray); padding: 1.25rem; margin-bottom: 2rem;">
            <div style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--color-warmgray); margin-bottom: 0.5rem; font-weight: 600;">
              Lead Scoring Algorithm (Score: ${lead.score}/100):
            </div>
            <ul style="font-size: 0.78rem; color: #444; line-height: 1.8; padding-left: 1.2rem; margin: 0;">
              <li>Phone number verified: <strong style="color: #2E7D32;">+20 pts</strong></li>
              <li>Liquid funds / Cash buyer: <strong style="color: #2E7D32;">+25 pts</strong></li>
              <li>Immediate / &lt;1 month timeline: <strong style="color: #2E7D32;">+20 pts</strong></li>
              <li>High-tier budget (AED 15M+): <strong style="color: #2E7D32;">+15 to +20 pts</strong></li>
              <li>Specific named residence interest: <strong style="color: #2E7D32;">+15 pts</strong></li>
            </ul>
          </div>

          <!-- Pipeline Stage Changer -->
          <div class="form-group">
            <label style="font-weight: 600;">Pipeline Stage</label>
            <select class="form-select" onchange="window.prApp.handleLeadStageChange('${lead.ref}', this.value)">
              ${['New', 'Contacted', 'Viewing Scheduled', 'Offer Made', 'Under Contract', 'Won', 'Lost'].map(st => `
                <option value="${st}" ${lead.stage === st ? 'selected' : ''}>${st === 'Won' ? '🏆 Won (Close Deal & 2% Commission)' : st}</option>
              `).join('')}
            </select>
            <small style="color: var(--color-warmgray); font-size: 0.7rem; display: block; margin-top: 0.35rem;">
              Selecting "Won" triggers deal closing price and automatic 2% commission calculation.
            </small>
          </div>

          <!-- Agent Assignment -->
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 600;">Assigned Private Advisor</label>
            <select class="form-select" onchange="window.prApp.handleLeadAgentChange('${lead.ref}', this.value)">
              <option value="1" ${lead.agentId === 1 ? 'selected' : ''}>Tariq Al-Mansoor (Senior Advisor)</option>
              <option value="2" ${lead.agentId === 2 ? 'selected' : ''}>Victoria Sterling (Managing Partner)</option>
              <option value="3" ${lead.agentId === 3 ? 'selected' : ''}>Alexander Vance (Investment Advisor)</option>
            </select>
          </div>
        </div>

        <!-- Right: Advisory Notes History & Add Note -->
        <div class="lead-timeline-card">
          <span class="section-tag" style="margin-bottom: 0.25rem;">CONFIDENTIAL AUDIT</span>
          <h3 style="font-family: var(--font-heading); font-size: 1.6rem; color: var(--color-charcoal); margin-bottom: 1.5rem;">
            Advisory Notes & Timeline
          </h3>

          <!-- Add Note Form -->
          <form onsubmit="window.prApp.handleAddNoteSubmit(event, '${lead.ref}')" style="margin-bottom: 2rem;">
            <div class="form-group">
              <label>Log Private Note / Viewing Feedback</label>
              <textarea name="noteText" class="form-textarea" rows="3" placeholder="Enter confidential interaction notes, client preferences, or offer details..." required></textarea>
            </div>
            <button type="submit" class="btn btn-charcoal-solid" style="font-size: 0.72rem; padding: 0.65rem 1.25rem;">
              + Append Note
            </button>
          </form>

          <!-- Notes History List -->
          <div id="leadNotesTimeline">
            ${(lead.notes || []).length === 0 ? `
              <div style="color: #888; font-size: 0.8rem; text-align: center; padding: 2rem; background: var(--color-offwhite);">
                No notes logged yet. Be the first advisor to record an update.
              </div>
            ` : lead.notes.map(n => `
              <div class="note-bubble">
                <div class="note-header">
                  <span><strong>${escapeHtml(n.authorName || 'Advisor')}</strong></span>
                  <span>${new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--color-charcoal); line-height: 1.5;">
                  ${escapeHtml(n.noteText)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="padding: 2rem; color: #C62828;">Error rendering lead detail: ${err.message}</div>`;
  }
}

export async function handleLeadStageChange(ref, newStage) {
  if (newStage === 'Won') {
    const lead = cachedPipelineLeads.find(l => l.ref === ref) || cachedLeadsList.find(l => l.ref === ref);
    openDealWonModal(ref, lead ? `${lead.firstName} ${lead.lastName || ''}` : 'Buyer', lead?.interestType || 'Prime Residence');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/leads/${ref}/stage`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stage: newStage })
    });
    if (res.ok) {
      window.prApp.showToast('Stage Updated', `Lead moved to "${newStage}".`);
    }
  } catch (err) {
    console.warn(err);
  }
}

export async function handleLeadAgentChange(ref, agentId) {
  try {
    const res = await fetch(`${API_BASE}/admin/leads/${ref}/assign`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ agentId: Number(agentId) })
    });
    if (res.ok) {
      const agentName = getAgentNameById(agentId);
      window.prApp.showToast('Reassigned', `Lead reassigned to ${agentName}.`);
    }
  } catch (err) {
    console.warn(err);
  }
}

export async function handleAddNoteSubmit(e, ref) {
  e.preventDefault();
  const form = e.target;
  const textarea = form.elements['noteText'];
  const noteText = textarea.value.trim();
  if (!noteText) return;

  try {
    const res = await fetch(`${API_BASE}/admin/leads/${ref}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ noteText })
    });

    if (res.ok) {
      window.prApp.showToast('Note Appended', 'Advisory note recorded to confidential audit file.');
      form.reset();
      renderAdminLeadDetail(ref);
    }
  } catch (err) {
    console.warn(err);
  }
}

/* --------------------------------------------------------------------------
   8. Deal Won Modal & 2% Commission Calculation Flow
   -------------------------------------------------------------------------- */
export function openDealWonModal(leadRef, buyerName, propertyTitle) {
  const modal = document.getElementById('dealWonModal');
  if (!modal) return;

  const refInp = document.getElementById('dealWonLeadRef');
  const buyerInp = document.getElementById('dealWonBuyerName');
  const propInp = document.getElementById('dealWonPropertyTitle');
  const priceInp = document.getElementById('dealWonSalePrice');
  const dateInp = document.getElementById('dealWonClosingDate');

  if (refInp) refInp.value = leadRef || '';
  if (buyerInp) buyerInp.value = buyerName || '';
  if (propInp) propInp.value = propertyTitle || '';
  if (dateInp) dateInp.value = new Date().toISOString().slice(0, 10);
  if (priceInp) {
    priceInp.value = '';
    calculateLiveCommission(0);
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function calculateLiveCommission(price) {
  const p = Number(price) || 0;
  const commDisplay = document.getElementById('dealWonCommissionDisplay');
  const dldDisplay = document.getElementById('dealWonDldDisplay');

  // 2% Brokerage Commission
  const commAED = Math.round(p * 0.02);
  // 4% DLD Fee
  const dldAED = Math.round(p * 0.04);

  if (commDisplay) commDisplay.textContent = formatAED(commAED);
  if (dldDisplay) dldDisplay.textContent = formatAED(dldAED);
}

export async function handleDealWonSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const leadRef = document.getElementById('dealWonLeadRef')?.value;
  const buyerName = document.getElementById('dealWonBuyerName')?.value;
  const propertyTitle = document.getElementById('dealWonPropertyTitle')?.value;
  const salePriceAED = Number(document.getElementById('dealWonSalePrice')?.value);
  const sellerName = document.getElementById('dealWonSellerName')?.value;
  const closingDate = document.getElementById('dealWonClosingDate')?.value;

  if (!salePriceAED || salePriceAED <= 0) {
    window.prApp.showToast('Validation Error', 'Please enter a valid closing sale price.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/deals/complete-won`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        leadRef,
        buyerName,
        propertyTitle,
        salePriceAED,
        sellerName,
        closingDate
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      window.prApp.showToast('Notice', json.message || 'Error completing deal.');
      return;
    }

    window.prApp.closeModal('dealWonModal');
    window.prApp.showToast(
      '🏆 Transaction Closed!',
      `Sale Registered: AED ${salePriceAED.toLocaleString()} • 2% Commission: AED ${json.commissionAED.toLocaleString()} • Property marked as Sold.`
    );

    // Refresh pipeline, leads, and dashboard
    renderAdminPipeline();
    renderAdminDashboard();
  } catch (err) {
    window.prApp.showToast('Error', err.message);
  }
}

/* --------------------------------------------------------------------------
   9. Private Viewings Schedule View
   -------------------------------------------------------------------------- */
export async function renderAdminViewings() {
  const tbody = document.getElementById('adminViewingsTableBody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/admin/viewings`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;

    const json = await res.json();
    const viewings = json.data || [];

    if (viewings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #888; padding: 2.5rem;">No scheduled viewings.</td></tr>`;
      return;
    }

    tbody.innerHTML = viewings.map(v => {
      const isPast = new Date(v.viewingDate) < new Date();
      return `
        <tr>
          <td><strong style="font-family: monospace; color: var(--color-gold);">${escapeHtml(v.ref)}</strong></td>
          <td>
            <strong>${escapeHtml(v.viewingDate)}</strong>
            <div style="font-size: 0.72rem; color: var(--color-warmgray);">${escapeHtml(v.viewingTime || '11:00 AM')}</div>
          </td>
          <td><strong>${escapeHtml(v.propertyTitle || 'Prime Residence')}</strong></td>
          <td>${escapeHtml(v.clientName)}</td>
          <td><a href="tel:${v.clientPhone}" style="color: var(--color-charcoal); font-size: 0.8rem;">${escapeHtml(v.clientPhone)}</a></td>
          <td>${escapeHtml(getAgentNameById(v.agentId))}</td>
          <td>
            <span style="font-size: 0.65rem; text-transform: uppercase; font-weight: 600; padding: 0.2rem 0.5rem; background: ${v.status === 'Completed' ? '#E8F5E9' : '#FFF8E1'}; color: ${v.status === 'Completed' ? '#2E7D32' : '#F57F17'};">
              ${escapeHtml(v.status || 'Scheduled')}
            </span>
          </td>
          <td style="font-size: 0.78rem; color: var(--color-warmgray); max-width: 250px;">${escapeHtml(v.notes || '—')}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.warn(err);
  }
}

export function openAdminBookViewingModal(leadRef, clientName, clientPhone) {
  const modal = document.getElementById('adminBookViewingModal');
  if (!modal) return;

  const refInp = document.getElementById('bookViewingLeadRef');
  const nameInp = document.getElementById('bookViewingClientName');
  const phoneInp = document.getElementById('bookViewingClientPhone');
  const select = document.getElementById('bookViewingPropertySelect');
  const dateInp = document.getElementById('bookViewingDate');

  if (refInp) refInp.value = leadRef || '';
  if (nameInp) nameInp.value = clientName || '';
  if (phoneInp) phoneInp.value = clientPhone || '';
  if (dateInp) {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    dateInp.value = tmrw.toISOString().slice(0, 10);
  }

  // Populate properties in dropdown
  if (select && window.prApp?.getAllProperties) {
    const props = window.prApp.getAllProperties();
    select.innerHTML = props.map(p => `<option value="${p.id}" data-title="${escapeHtml(p.title)}">${escapeHtml(p.title)} (${p.community} - ${formatAED(p.priceAED)})</option>`).join('');
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export async function handleAdminScheduleViewingSubmit(e) {
  e.preventDefault();
  const select = document.getElementById('bookViewingPropertySelect');
  const selectedOpt = select.options[select.selectedIndex];

  const payload = {
    propertyId: Number(select.value),
    propertyTitle: selectedOpt.dataset.title || selectedOpt.text,
    clientName: document.getElementById('bookViewingClientName')?.value,
    clientPhone: document.getElementById('bookViewingClientPhone')?.value,
    viewingDate: document.getElementById('bookViewingDate')?.value,
    viewingTime: document.getElementById('bookViewingTime')?.value,
    notes: document.getElementById('bookViewingNotes')?.value
  };

  try {
    const res = await fetch(`${API_BASE}/viewings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      window.prApp.closeModal('adminBookViewingModal');
      window.prApp.showToast('Viewing Confirmed', `Private viewing booked for ${payload.clientName} on ${payload.viewingDate}.`);
      renderAdminViewings();
    }
  } catch (err) {
    window.prApp.showToast('Error', err.message);
  }
}

/* --------------------------------------------------------------------------
   10. Leaderboard (Monthly Targets & Commission)
   -------------------------------------------------------------------------- */
export async function renderAdminLeaderboard() {
  const cardsContainer = document.getElementById('adminLeaderboardCards');
  const dealsBody = document.getElementById('adminClosedDealsTableBody');
  if (!cardsContainer) return;

  try {
    const res = await fetch(`${API_BASE}/admin/leaderboard`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;

    const json = await res.json();
    const data = json.data || {};
    const leaderboard = data.leaderboard || [];
    const sales = data.sales || [];

    // Render 3 Agent Performance Cards
    cardsContainer.innerHTML = leaderboard.map(agent => {
      const attainmentPct = Math.min(Math.round((agent.salesVolumeAED / agent.monthlyTargetAED) * 100), 100);
      return `
        <div style="background-color: var(--color-white); border: 1px solid var(--color-lightgray); border-top: 3px solid var(--color-gold); padding: 2rem; box-shadow: var(--shadow-soft);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div>
              <span class="section-tag" style="margin-bottom: 0.2rem;">RANK #${agent.rank}</span>
              <h3 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--color-charcoal); margin: 0 0 0.25rem;">
                ${escapeHtml(agent.name)}
              </h3>
              <p style="font-size: 0.72rem; color: var(--color-warmgray); margin: 0;">${escapeHtml(agent.title)}</p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.65rem; text-transform: uppercase; color: var(--color-warmgray);">Deals Won</span>
              <div style="font-size: 1.35rem; font-weight: 600; color: var(--color-gold);">${agent.dealsClosedCount}</div>
            </div>
          </div>

          <div style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.35rem;">
              <span>Target: ${formatAED(agent.monthlyTargetAED)}</span>
              <strong>${attainmentPct}%</strong>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${attainmentPct}%;"></div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--color-offwhite); padding-top: 1rem; display: flex; justify-content: space-between; font-size: 0.8rem;">
            <div>
              <span style="font-size: 0.65rem; color: var(--color-warmgray); text-transform: uppercase; display: block;">Closed Volume</span>
              <strong>${formatAED(agent.salesVolumeAED)}</strong>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.65rem; color: var(--color-warmgray); text-transform: uppercase; display: block;">2% Commission</span>
              <strong style="color: var(--color-gold);">${formatAED(agent.commissionEarnedAED)}</strong>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Render Closed Deals Table
    if (dealsBody) {
      if (sales.length === 0) {
        dealsBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #888; padding: 2rem;">No closed transactions yet this month.</td></tr>`;
      } else {
        dealsBody.innerHTML = sales.map(s => `
          <tr>
            <td><strong style="font-family: monospace; color: var(--color-gold);">${escapeHtml(s.dealRef)}</strong></td>
            <td><strong>${escapeHtml(s.propertyTitle)}</strong></td>
            <td>${escapeHtml(s.community || 'Dubai Prime')}</td>
            <td><strong>${formatAED(s.salePriceAED)}</strong></td>
            <td style="color: var(--color-gold); font-weight: 600;">${formatAED(s.commissionAED)}</td>
            <td>${escapeHtml(getAgentNameById(s.agentId))}</td>
            <td>${escapeHtml(s.closingDate)}</td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.warn(err);
  }
}

/* --------------------------------------------------------------------------
   11. Stale Leads (3+ Days Inactive)
   -------------------------------------------------------------------------- */
export async function renderAdminStaleLeads() {
  const tbody = document.getElementById('adminStaleLeadsTableBody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/admin/leads?staleOnly=true`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;

    const json = await res.json();
    const staleLeads = json.data || [];

    if (staleLeads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #2E7D32; padding: 2.5rem; font-weight: 500;">✓ Excellent! All leads have been actively serviced within the last 72 hours.</td></tr>`;
      return;
    }

    tbody.innerHTML = staleLeads.map(l => {
      const cleanPhone = (l.phone || '').replace(/[^0-9]/g, '');
      const tempClass = `badge-${(l.temperature || 'WARM').toLowerCase()}`;

      return `
        <tr>
          <td><a href="#/admin/lead/${l.ref}" style="font-family: monospace; font-weight: 600; color: var(--color-gold);">${escapeHtml(l.ref)}</a></td>
          <td><strong>${escapeHtml(l.firstName)} ${escapeHtml(l.lastName || '')}</strong></td>
          <td><span class="stale-warning">⚠️ ${l.daysAgo || 3} Days Inactive</span></td>
          <td><span class="score-pill high">${l.score}/100</span> <span class="${tempClass}">${l.temperature}</span></td>
          <td>${escapeHtml(l.interestType || 'Private Residence')}</td>
          <td><strong>${escapeHtml(l.budget || 'Private')}</strong></td>
          <td>${escapeHtml(getAgentNameById(l.agentId))}</td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
              <a href="tel:${l.phone}" class="action-btn-call">📞 Call Now</a>
              <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(l.firstName)},%20PR%20Real%20Estate%20checking%20in." target="_blank" class="action-btn-whatsapp">💬 VIP WhatsApp</a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.warn(err);
  }
}

/* --------------------------------------------------------------------------
   12. Inventory Management (Ready Properties & Off-Plan Projects CRUD)
   -------------------------------------------------------------------------- */
export function switchInventoryTab(tab) {
  const propsContainer = document.getElementById('inventoryPropsContainer');
  const offplanContainer = document.getElementById('inventoryOffplanContainer');
  const tabPropsBtn = document.getElementById('inventoryTabProps');
  const tabOffplanBtn = document.getElementById('inventoryTabOffplan');

  if (tab === 'props') {
    if (propsContainer) propsContainer.style.display = 'block';
    if (offplanContainer) offplanContainer.style.display = 'none';
    if (tabPropsBtn) {
      tabPropsBtn.className = 'btn btn-charcoal-outline';
      tabPropsBtn.style.color = '';
    }
    if (tabOffplanBtn) {
      tabOffplanBtn.className = 'btn btn-white-outline';
      tabOffplanBtn.style.color = 'var(--color-charcoal)';
    }
  } else {
    if (propsContainer) propsContainer.style.display = 'none';
    if (offplanContainer) offplanContainer.style.display = 'block';
    if (tabPropsBtn) {
      tabPropsBtn.className = 'btn btn-white-outline';
      tabPropsBtn.style.color = 'var(--color-charcoal)';
    }
    if (tabOffplanBtn) {
      tabOffplanBtn.className = 'btn btn-charcoal-outline';
      tabOffplanBtn.style.color = '';
    }
  }
}

export async function renderAdminInventory() {
  const session = getStaffSession();
  if (!session) return;

  try {
    const [propRes, offRes] = await Promise.all([
      fetch(`${API_BASE}/properties`),
      fetch(`${API_BASE}/offplan`)
    ]);

    const propsJson = await propRes.json();
    const offJson = await offRes.json();

    const props = propsJson.data || [];
    const offplan = offJson.data || [];

    // Counts
    const countProps = document.getElementById('invCountProps');
    const countOffplan = document.getElementById('invCountOffplan');
    if (countProps) countProps.textContent = props.length;
    if (countOffplan) countOffplan.textContent = offplan.length;

    // Render Properties Table
    const propsTbody = document.getElementById('inventoryPropsTableBody');
    if (propsTbody) {
      propsTbody.innerHTML = props.map(p => `
        <tr>
          <td>
            <strong>${escapeHtml(p.title)}</strong>
            <div style="font-size: 0.7rem; color: var(--color-warmgray);">${escapeHtml(p.slug)}</div>
          </td>
          <td>${escapeHtml(p.community)}</td>
          <td><span style="font-size: 0.75rem; text-transform: uppercase;">${escapeHtml(p.category)}</span></td>
          <td><strong>${formatAED(p.priceAED)}</strong></td>
          <td>${p.bedrooms} Beds / ${p.builtUpAreaSqft ? p.builtUpAreaSqft.toLocaleString() : '—'} sqft</td>
          <td>
            <span style="font-size: 0.65rem; text-transform: uppercase; font-weight: 600; padding: 0.2rem 0.5rem; background: ${p.status === 'Sold' ? '#FFEBEE' : '#E8F5E9'}; color: ${p.status === 'Sold' ? '#C62828' : '#2E7D32'};">
              ${escapeHtml(p.status)}
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-charcoal-outline" style="padding: 0.35rem 0.75rem; font-size: 0.65rem;" onclick="window.prApp.openEditPropertyModal('${p.slug}')">Edit</button>
              <button class="btn btn-charcoal-outline" style="padding: 0.35rem 0.75rem; font-size: 0.65rem; color: #D32F2F;" onclick="window.prApp.deleteProperty('${p.slug}')">Remove</button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    // Render Offplan Table
    const offTbody = document.getElementById('inventoryOffplanTableBody');
    if (offTbody) {
      offTbody.innerHTML = offplan.map(proj => `
        <tr>
          <td>
            <strong>${escapeHtml(proj.title)}</strong>
            <div style="font-size: 0.7rem; color: var(--color-warmgray);">${escapeHtml(proj.slug)}</div>
          </td>
          <td>${escapeHtml(proj.developer)}</td>
          <td>${escapeHtml(proj.location || proj.community)}</td>
          <td><strong>${formatAED(proj.startingPriceAED)}</strong></td>
          <td>${escapeHtml(proj.handoverYear || 'Q4 2027')}</td>
          <td style="font-size: 0.75rem; max-width: 200px;">${escapeHtml(proj.paymentPlan || '70/30')}</td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-charcoal-outline" style="padding: 0.35rem 0.75rem; font-size: 0.65rem;" onclick="window.prApp.openEditProjectModal('${proj.slug}')">Edit</button>
              <button class="btn btn-charcoal-outline" style="padding: 0.35rem 0.75rem; font-size: 0.65rem; color: #D32F2F;" onclick="window.prApp.deleteProject('${proj.slug}')">Remove</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.warn(err);
  }
}

// Property CRUD Modals
let activeEditingPropertySlug = null;

export function openAddPropertyModal() {
  activeEditingPropertySlug = null;
  document.getElementById('adminPropertyForm')?.reset();
  const heading = document.getElementById('adminPropModalHeading');
  if (heading) heading.textContent = 'Add Ready Property';
  const slugInp = document.getElementById('propFormOriginalSlug');
  if (slugInp) slugInp.value = '';
  window.prApp.openModal('adminPropertyModal');
}

export async function openEditPropertyModal(slug) {
  activeEditingPropertySlug = slug;
  const res = await fetch(`${API_BASE}/properties`);
  const json = await res.json();
  const prop = (json.data || []).find(p => p.slug === slug);
  if (!prop) return;

  const heading = document.getElementById('adminPropModalHeading');
  if (heading) heading.textContent = 'Edit Ready Property';

  document.getElementById('propFormOriginalSlug').value = prop.slug;
  document.getElementById('propFormTitle').value = prop.title || '';
  document.getElementById('propFormCommunity').value = prop.community || 'Palm Jumeirah';
  document.getElementById('propFormCategory').value = prop.category || 'Penthouse';
  document.getElementById('propFormPrice').value = prop.priceAED || 10000000;
  document.getElementById('propFormStatus').value = prop.status || 'Ready to Move';
  document.getElementById('propFormBeds').value = prop.bedrooms || 3;
  document.getElementById('propFormBaths').value = prop.bathrooms || 4;
  document.getElementById('propFormSqft').value = prop.builtUpAreaSqft || 3000;
  document.getElementById('propFormView').value = prop.view || '';
  document.getElementById('propFormDesc').value = prop.description || '';

  window.prApp.openModal('adminPropertyModal');
}

export async function handleSaveProperty(e) {
  e.preventDefault();
  const form = e.target;
  const originalSlug = document.getElementById('propFormOriginalSlug').value;

  const payload = {
    title: document.getElementById('propFormTitle').value,
    community: document.getElementById('propFormCommunity').value,
    category: document.getElementById('propFormCategory').value,
    priceAED: Number(document.getElementById('propFormPrice').value),
    status: document.getElementById('propFormStatus').value,
    bedrooms: Number(document.getElementById('propFormBeds').value),
    bathrooms: Number(document.getElementById('propFormBaths').value),
    builtUpAreaSqft: Number(document.getElementById('propFormSqft').value),
    view: document.getElementById('propFormView').value,
    description: document.getElementById('propFormDesc').value
  };

  try {
    const isEdit = Boolean(originalSlug);
    const url = isEdit ? `${API_BASE}/admin/properties/${originalSlug}` : `${API_BASE}/admin/properties`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      window.prApp.closeModal('adminPropertyModal');
      window.prApp.showToast('Inventory Updated', `Property ${payload.title} saved successfully.`);
      renderAdminInventory();
    }
  } catch (err) {
    window.prApp.showToast('Error', err.message);
  }
}

export async function deleteProperty(slug) {
  if (!confirm(`Are you sure you want to remove this property (${slug}) from the inventory portfolio?`)) return;

  try {
    const res = await fetch(`${API_BASE}/admin/properties/${slug}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (res.ok) {
      window.prApp.showToast('Property Removed', `Property ${slug} removed from catalog.`);
      renderAdminInventory();
    }
  } catch (err) {
    window.prApp.showToast('Error', err.message);
  }
}

// Project CRUD Modals
let activeEditingProjectSlug = null;

export function openAddProjectModal() {
  activeEditingProjectSlug = null;
  document.getElementById('adminProjectForm')?.reset();
  const heading = document.getElementById('adminProjModalHeading');
  if (heading) heading.textContent = 'Add Off-Plan Project';
  const slugInp = document.getElementById('projFormOriginalSlug');
  if (slugInp) slugInp.value = '';
  window.prApp.openModal('adminProjectModal');
}

export async function openEditProjectModal(slug) {
  activeEditingProjectSlug = slug;
  const res = await fetch(`${API_BASE}/offplan`);
  const json = await res.json();
  const proj = (json.data || []).find(p => p.slug === slug);
  if (!proj) return;

  const heading = document.getElementById('adminProjModalHeading');
  if (heading) heading.textContent = 'Edit Off-Plan Project';

  document.getElementById('projFormOriginalSlug').value = proj.slug;
  document.getElementById('projFormTitle').value = proj.title || '';
  document.getElementById('projFormDeveloper').value = proj.developer || '';
  document.getElementById('projFormLocation').value = proj.location || proj.community || '';
  document.getElementById('projFormStartingPrice').value = proj.startingPriceAED || 4000000;
  document.getElementById('projFormHandover').value = proj.handoverYear || 'Q4 2027';
  document.getElementById('projFormPaymentPlan').value = proj.paymentPlan || '70/30';
  document.getElementById('projFormDesc').value = proj.description || '';

  window.prApp.openModal('adminProjectModal');
}

export async function handleSaveProject(e) {
  e.preventDefault();
  const originalSlug = document.getElementById('projFormOriginalSlug').value;

  const payload = {
    title: document.getElementById('projFormTitle').value,
    developer: document.getElementById('projFormDeveloper').value,
    location: document.getElementById('projFormLocation').value,
    startingPriceAED: Number(document.getElementById('projFormStartingPrice').value),
    handoverYear: document.getElementById('projFormHandover').value,
    paymentPlan: document.getElementById('projFormPaymentPlan').value,
    description: document.getElementById('projFormDesc').value
  };

  try {
    const isEdit = Boolean(originalSlug);
    const url = isEdit ? `${API_BASE}/admin/offplan/${originalSlug}` : `${API_BASE}/admin/offplan`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      window.prApp.closeModal('adminProjectModal');
      window.prApp.showToast('Project Saved', `Off-plan project ${payload.title} saved to portfolio.`);
      renderAdminInventory();
    }
  } catch (err) {
    window.prApp.showToast('Error', err.message);
  }
}

export async function deleteProject(slug) {
  if (!confirm(`Are you sure you want to remove the off-plan project (${slug}) from the active master portfolio?`)) return;

  try {
    const res = await fetch(`${API_BASE}/admin/offplan/${slug}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (res.ok) {
      window.prApp.showToast('Project Removed', `Project ${slug} removed from active developments.`);
      renderAdminInventory();
    }
  } catch (err) {
    window.prApp.showToast('Error', err.message);
  }
}

/* --------------------------------------------------------------------------
   13. Utilities
   -------------------------------------------------------------------------- */
function getAgentNameById(id) {
  if (id === 1) return 'Tariq Al-Mansoor';
  if (id === 2) return 'Victoria Sterling';
  if (id === 3) return 'Alexander Vance';
  return 'Jay (Director)';
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
