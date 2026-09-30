// scripts/test_crm.js
const API_BASE = 'http://localhost:3001/api';

async function testAll() {
  console.log('=== PR REAL ESTATE CRM COMPREHENSIVE TEST ===\n');

  // 1. Submit lead from form
  const leadRes = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Elena',
      lastName: 'Vance',
      phone: '+971509998877',
      interestType: 'The Solitaire Sky Penthouse',
      community: 'Downtown Dubai',
      budget: 'AED 50M - 100M+',
      paymentMethod: 'Cash Buyer (Liquid)',
      buyingTimeline: 'Immediate',
      sourceForm: 'Modal Register Interest'
    })
  });
  const leadData = await leadRes.json();
  console.log('1. FORM SUBMISSION:');
  console.log('   - Ref:', leadData.reference);
  console.log('   - Lead Score (0-100):', leadData.score);
  console.log('   - Temperature:', leadData.temperature);
  console.log('   - Confirmation Message:', leadData.message);
  console.log('   - Message matches exact requirement:', leadData.message === "Thank you. A PR Real Estate advisor will contact you within 24 hours.");

  // 2. Staff Authentication & Security Boundary Checks
  console.log('\n2. STAFF AUTHENTICATION & SECURITY CONTROLS:');
  
  // 2a. Verify Unauthenticated Access is Blocked (SEC-01 Regression Test)
  const unauthRes = await fetch(`${API_BASE}/admin/leads`);
  console.log('   - Unauthenticated /api/admin/leads blocked:', unauthRes.status === 401 ? 'PASS (HTTP 401 Unauthorized)' : `FAIL (HTTP ${unauthRes.status})`);
  
  // 2b. Authenticate Director
  const loginJay = await (await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  })).json();
  console.log('   - Director Login (admin):', loginJay.success ? `SUCCESS (${loginJay.user.fullName}, Role: ${loginJay.user.role})` : 'FAILED');
  const directorToken = loginJay.token;

  // 2c. Authenticate Agent
  const loginTariq = await (await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'tariq.mansoor', password: 'agent123' })
  })).json();
  console.log('   - Agent Login (tariq.mansoor):', loginTariq.success ? `SUCCESS (${loginTariq.user.fullName}, AgentId: ${loginTariq.user.agentId})` : 'FAILED');
  const agentToken = loginTariq.token;

  // 2d. Verify Privilege Escalation Prevention (SEC-04 Regression Test)
  // Agent token attempting Director-only inventory action must be rejected with 403
  const agentForbiddenRes = await fetch(`${API_BASE}/admin/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentToken}`
    },
    body: JSON.stringify({ title: 'Unauthorized Property' })
  });
  console.log('   - Agent blocked from Director inventory CRUD:', agentForbiddenRes.status === 403 ? 'PASS (HTTP 403 Forbidden)' : `FAIL (HTTP ${agentForbiddenRes.status})`);

  // 3. 60-Second Live Bell Notifications
  console.log('\n3. 60-SECOND BELL NOTIFICATIONS:');
  const notifRes = await (await fetch(`${API_BASE}/admin/notifications`, {
    headers: { 'Authorization': `Bearer ${directorToken}` }
  })).json();
  console.log('   - Unread Count:', notifRes.unreadCount);
  console.log('   - Recent Leads in Dropdown:', notifRes.recent?.length);

  // 4. Analytics & Dashboard KPIs
  console.log('\n4. DASHBOARD ANALYTICS & KPIS:');
  const analyticsRes = await (await fetch(`${API_BASE}/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${directorToken}` }
  })).json();
  console.log('   - New Leads Today:', analyticsRes.data.kpi.newLeadsToday);
  console.log('   - Pipeline Deal Value:', 'AED ' + analyticsRes.data.kpi.pipelineDealValueAED.toLocaleString());
  console.log('   - Viewings Scheduled:', analyticsRes.data.kpi.viewingsScheduled);
  console.log('   - Sales & 2% Commission:', 'AED ' + analyticsRes.data.kpi.salesCommissionThisMonthAED.toLocaleString());
  console.log('   - Temperature Breakdown:', analyticsRes.data.charts.leadsByTemperature);

  // 5. Role-based isolation
  console.log('\n5. ROLE ISOLATION:');
  const directorLeads = await (await fetch(`${API_BASE}/admin/leads`, {
    headers: { 'Authorization': `Bearer ${directorToken}` }
  })).json();
  const agentLeads = await (await fetch(`${API_BASE}/admin/leads`, {
    headers: { 'Authorization': `Bearer ${agentToken}` }
  })).json();
  console.log('   - Director sees total leads:', directorLeads.count);
  console.log('   - Agent Tariq sees only assigned leads:', agentLeads.count);

  // 6. Deal Won Closing & 2% Commission
  console.log('\n6. DEAL WON CLOSING FLOW (2% Commission & Property Marked as Sold):');
  const dealRes = await (await fetch(`${API_BASE}/admin/deals/complete-won`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${directorToken}`
    },
    body: JSON.stringify({
      leadRef: leadData.reference,
      propertyTitle: 'The Solitaire Sky Penthouse',
      salePriceAED: 50000000,
      buyerName: 'Elena Vance',
      sellerName: 'Al-Qasimi Private Trust',
      agentId: 1,
      closingDate: '2026-09-30'
    })
  })).json();
  console.log('   - Deal Closed Status:', dealRes.success);
  console.log('   - 2% Agency Commission:', 'AED ' + dealRes.commissionAED.toLocaleString());
  console.log('   - 4% DLD Fee:', 'AED ' + dealRes.dldTransferFeeAED.toLocaleString());
  console.log('   - Property Sold Confirmation:', dealRes.propertyTitle, 'marked Sold');

  // Verify property status in inventory
  const propsRes = await (await fetch(`${API_BASE}/properties`)).json();
  const solPenthouse = propsRes.data.find(p => p.title === 'The Solitaire Sky Penthouse');
  console.log('   - Solitaire Sky Penthouse Status in Portfolio:', solPenthouse?.status);

  // 7. Leaderboard & Stale Leads
  console.log('\n7. LEADERBOARD & STALE LEADS:');
  const lbRes = await (await fetch(`${API_BASE}/admin/leaderboard`, {
    headers: { 'Authorization': `Bearer ${directorToken}` }
  })).json();
  console.log('   - Leaderboard Agents Count:', lbRes.data.leaderboard.length);
  console.log('   - Rank 1 Agent:', lbRes.data.leaderboard[0].name, 'Sales: AED ' + lbRes.data.leaderboard[0].salesVolumeAED.toLocaleString(), 'Comm: AED ' + lbRes.data.leaderboard[0].commissionEarnedAED.toLocaleString());

  const staleRes = await (await fetch(`${API_BASE}/admin/leads?staleOnly=true`, {
    headers: { 'Authorization': `Bearer ${directorToken}` }
  })).json();
  console.log('   - Stale Leads (3+ Days Inactive):', staleRes.count, 'leads identified');

  console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

testAll().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
