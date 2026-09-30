import {
  sampleDevelopers,
  sampleOffplanProjects,
  sampleProperties,
  sampleAgents
} from './data/publicData.js';

import * as adminEngine from './admin.js';

/* ==========================================================================
   PR REAL ESTATE - LUXURY MULTI-PAGE SPA APPLICATION
   ========================================================================== */

const API_BASE = '/api';
const THANK_YOU_MESSAGE = "Thank you. A PR Real Estate advisor will contact you within 24 hours.";
let lastSubmitTimestamp = 0;

function checkCooldown() {
  const now = Date.now();
  if (now - lastSubmitTimestamp < 3000) {
    showToast('Notice', 'Please wait a moment before sending another request.');
    return false;
  }
  lastSubmitTimestamp = now;
  return true;
}

// State
let allProperties = [...sampleProperties];
let allOffplan = [...sampleOffplanProjects];
let allDevelopers = [...sampleDevelopers];
let allAgents = [...sampleAgents];

let activePropertyFilter = {
  community: 'all',
  category: 'all',
  bedrooms: 'all',
  price: 'all'
};

// Currency Formatter
const formatAED = (amount) => {
  return 'AED ' + Math.round(amount).toLocaleString('en-US');
};

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initRouter();
  loadDataFromBackend();
  initMortgageCalculator();
  checkNeonStatus();
  if (adminEngine.getStaffSession()) {
    adminEngine.startNotificationPolling();
  }
  // Smooth luxury preloader dismissal
  setTimeout(hideLoader, 550);
});

// Keyboard accessibility for elements with role="button" (WCAG 2.2 AA)
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.getAttribute('role') === 'button') {
    e.preventDefault();
    e.target.click();
  }
});

/* --------------------------------------------------------------------------
   1. Data Layer: Fetch from Express API (with Fallback to Seed Data)
   -------------------------------------------------------------------------- */
async function loadDataFromBackend() {
  try {
    const [propRes, offRes, devRes, agentRes] = await Promise.allSettled([
      fetch(`${API_BASE}/properties`),
      fetch(`${API_BASE}/offplan`),
      fetch(`${API_BASE}/developers`),
      fetch(`${API_BASE}/agents`)
    ]);

    if (propRes.status === 'fulfilled' && propRes.value.ok) {
      const json = await propRes.value.json();
      if (json.data && json.data.length > 0) allProperties = json.data;
    }

    if (offRes.status === 'fulfilled' && offRes.value.ok) {
      const json = await offRes.value.json();
      if (json.data && json.data.length > 0) allOffplan = json.data;
    }

    if (devRes.status === 'fulfilled' && devRes.value.ok) {
      const json = await devRes.value.json();
      if (json.data && json.data.length > 0) allDevelopers = json.data;
    }

    if (agentRes.status === 'fulfilled' && agentRes.value.ok) {
      const json = await agentRes.value.json();
      if (json.data && json.data.length > 0) allAgents = json.data;
    }
  } catch (err) {
    console.warn('[PR App] Using pre-loaded seed dataset:', err.message);
  }

  // Refresh current view with loaded data
  handleRoute();
  hideLoader();
}

/* --------------------------------------------------------------------------
   2. Preloader & SEO Metadata Manager (Google Discovery & Admin Masking)
   -------------------------------------------------------------------------- */
function hideLoader() {
  const loader = document.getElementById('luxuryLoader');
  if (loader && !loader.classList.contains('fade-out')) {
    loader.classList.add('fade-out');
    setTimeout(() => {
      if (loader) loader.style.display = 'none';
    }, 650);
  }
}

function updateSeoMeta(title, description, isPrivate = false) {
  if (title) document.title = title;

  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    document.head.appendChild(descMeta);
  }
  if (description) descMeta.setAttribute('content', description);

  let robotsMeta = document.getElementById('metaRobots') || document.querySelector('meta[name="robots"]');
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta');
    robotsMeta.id = 'metaRobots';
    robotsMeta.setAttribute('name', 'robots');
    document.head.appendChild(robotsMeta);
  }

  let googlebotMeta = document.querySelector('meta[name="googlebot"]');
  if (!googlebotMeta) {
    googlebotMeta = document.createElement('meta');
    googlebotMeta.setAttribute('name', 'googlebot');
    document.head.appendChild(googlebotMeta);
  }

  if (isPrivate) {
    // Strictly block Google & search engine crawlers from indexing internal CRM & admin screens
    robotsMeta.setAttribute('content', 'noindex, nofollow, noarchive, nosnippet');
    googlebotMeta.setAttribute('content', 'noindex, nofollow');
  } else {
    // Public luxury pages discoverable and optimized for Google search results
    robotsMeta.setAttribute('content', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    googlebotMeta.setAttribute('content', 'index, follow');
  }
}

function show404Page(customMessage) {
  showPage('page-404');
  const navbar = document.getElementById('mainNavbar');
  const adminTopBar = document.getElementById('adminTopBar');
  if (adminTopBar) adminTopBar.style.display = 'none';
  if (navbar) {
    navbar.style.display = 'block';
    navbar.classList.add('navbar-light-theme');
  }

  const narrative = document.querySelector('#page-404 .error-narrative');
  if (narrative) {
    narrative.textContent = customMessage ||
      'The private portfolio dossier, property listing, or portal page you requested is either confidential, archived, or does not exist at this address.';
  }

  updateSeoMeta(
    'Residence or Page Not Found | PR Real Estate Dubai',
    'The requested property, project, or portal page could not be located in our catalog.',
    false
  );
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --------------------------------------------------------------------------
   3. Client-Side Router
   -------------------------------------------------------------------------- */
function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('popstate', handleRoute);
  handleRoute();
}

function handleRoute() {
  const rawHash = window.location.hash.slice(1) || '/';
  const cleanPath = rawHash.startsWith('/') ? rawHash : '/' + rawHash;
  const segments = cleanPath.split('/').filter(Boolean);
  const rootSegment = segments[0] || '';
  const param = segments[1] || '';

  // Hide all page views
  document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));

  const navbar = document.getElementById('mainNavbar');
  const adminTopBar = document.getElementById('adminTopBar');

  // Handle Admin Portal Routes (Private Staff Portal - Strictly Hidden from Google)
  if (rootSegment === 'admin') {
    updateSeoMeta(
      'Private Staff Portal | PR Real Estate Executive CRM',
      'Confidential internal real estate management console.',
      true
    );

    const adminSub = param || 'dashboard';
    const adminRef = segments[2] || '';

    if (adminSub === 'login') {
      showPage('page-admin-login');
      if (navbar) navbar.style.display = 'none';
      if (adminTopBar) adminTopBar.style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const session = adminEngine.getStaffSession();
    if (!session) {
      window.location.hash = '#/admin/login';
      return;
    }

    // Authenticated admin view
    if (navbar) navbar.style.display = 'none';
    if (adminTopBar) {
      adminTopBar.style.display = 'block';
      const uName = document.getElementById('adminUserName');
      const uRole = document.getElementById('adminUserRole');
      const invLi = document.getElementById('adminNavInventoryLi');

      if (uName) uName.textContent = session.user?.fullName?.split(' ')[0] || session.user?.username || 'Jay';
      if (uRole) uRole.textContent = session.user?.role || 'Director';

      // Only Director can see Inventory tab
      if (invLi) {
        invLi.style.display = (session.user?.role === 'Director') ? 'inline-block' : 'none';
      }
    }

    // Highlight active admin tab
    document.querySelectorAll('.admin-nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.adminRoute === adminSub);
    });

    if (adminSub === 'dashboard') {
      showPage('page-admin-dashboard');
      adminEngine.renderAdminDashboard();
    } else if (adminSub === 'pipeline') {
      showPage('page-admin-pipeline');
      adminEngine.renderAdminPipeline();
    } else if (adminSub === 'leads') {
      showPage('page-admin-leads');
      adminEngine.renderAdminLeadsList();
    } else if (adminSub === 'lead') {
      showPage('page-admin-lead-detail');
      adminEngine.renderAdminLeadDetail(adminRef);
    } else if (adminSub === 'viewings') {
      showPage('page-admin-viewings');
      adminEngine.renderAdminViewings();
    } else if (adminSub === 'leaderboard') {
      showPage('page-admin-leaderboard');
      adminEngine.renderAdminLeaderboard();
    } else if (adminSub === 'stale') {
      showPage('page-admin-stale');
      adminEngine.renderAdminStaleLeads();
    } else if (adminSub === 'inventory') {
      showPage('page-admin-inventory');
      adminEngine.renderAdminInventory();
    } else {
      showPage('page-admin-dashboard');
      adminEngine.renderAdminDashboard();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // PUBLIC WEBSITE ROUTES (Indexable by Google)
  if (adminTopBar) adminTopBar.style.display = 'none';
  if (navbar) navbar.style.display = 'block';

  // Update active state in nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    const route = link.dataset.route;
    if (route === rootSegment || (route === '' && rootSegment === '')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Handle public views
  if (!rootSegment) {
    // HOME PAGE
    showPage('page-home');
    navbar.classList.remove('navbar-light-theme');
    renderHomePage();
    updateSeoMeta(
      'PR Real Estate | Dubai Prime Ready & Off-Plan Residences (AED)',
      "Exclusive portfolio of prime ready homes, waterfront villas, sky penthouses, and iconic off-plan developments across Dubai's most coveted communities. Prices in AED.",
      false
    );
  } else if (rootSegment === 'properties') {
    if (param) {
      // SINGLE PROPERTY DETAIL VIEW
      const prop = allProperties.find(p => p.slug === param || p.slug.includes(param));
      if (prop) {
        showPage('page-property-detail');
        navbar.classList.add('navbar-light-theme');
        renderPropertyDetail(param);
        updateSeoMeta(
          `${prop.title} | Luxury Residence Dubai | PR Real Estate`,
          `Explore ${prop.title} in ${prop.community}, Dubai. Offered at ${formatAED(prop.priceAED)}. Private viewings arranged discreetly.`,
          false
        );
      } else {
        show404Page(`Residence "${param}" could not be located in our private catalog.`);
      }
    } else {
      // PROPERTIES LIST
      showPage('page-properties');
      navbar.classList.add('navbar-light-theme');
      renderPropertiesList();
      updateSeoMeta(
        'Prime Dubai Residences for Sale | Waterfront & Golf Mansions | PR Real Estate',
        'Explore luxury penthouses, villas, and apartments for sale in Dubai Marina, Palm Jumeirah, Downtown, and Emirates Hills with realistic AED prices.',
        false
      );
    }
  } else if (rootSegment === 'offplan') {
    if (param) {
      // SINGLE PROJECT DETAIL VIEW
      const project = allOffplan.find(p => p.slug === param || p.slug.includes(param));
      if (project) {
        showPage('page-project-detail');
        navbar.classList.add('navbar-light-theme');
        renderProjectDetail(param);
        updateSeoMeta(
          `${project.title} by ${project.developerName} | Dubai Off-Plan | PR Real Estate`,
          `${project.title} in ${project.community}, Dubai. Starting from ${formatAED(project.startingPriceAED)} with ${project.paymentPlan}. Handover ${project.handoverDate}.`,
          false
        );
      } else {
        show404Page(`Project "${param}" could not be located in our off-plan catalog.`);
      }
    } else {
      // OFFPLAN LIST
      showPage('page-offplan');
      navbar.classList.add('navbar-light-theme');
      renderOffplanList();
      updateSeoMeta(
        'Exclusive Dubai Off-Plan Projects | Prime Architectural Towers | PR Real Estate',
        'Invest in premier off-plan launches across Dubai with flexible developer payment plans, capital appreciation potential, and Golden Visa eligibility.',
        false
      );
    }
  } else if (rootSegment === 'mortgage-calculator') {
    showPage('page-mortgage');
    navbar.classList.add('navbar-light-theme');
    updateMortgagePage();
    updateSeoMeta(
      'Dubai Luxury Mortgage Calculator | AED Property Financing | PR Real Estate',
      'Calculate mortgage repayments, DLD transfer fees, and monthly installments for Dubai prime residential properties.',
      false
    );
  } else if (rootSegment === 'sell') {
    showPage('page-sell');
    navbar.classList.add('navbar-light-theme');
    updateSeoMeta(
      'Sell Your Dubai Luxury Property | Confidential Private Brokerage | PR Real Estate',
      'Entrust your prime residence to Dubai’s premier private client real estate advisory with access to verified international cash buyers.',
      false
    );
  } else if (rootSegment === 'about') {
    showPage('page-about');
    navbar.classList.add('navbar-light-theme');
    renderAboutPage();
    updateSeoMeta(
      'About PR Real Estate | Dubai Ultra-Prime Real Estate Advisory',
      'Learn about PR Real Estate: bespoke representation, discreet advisory, and exceptional service across Dubai prime real estate.',
      false
    );
  } else if (rootSegment === 'contact') {
    showPage('page-contact');
    navbar.classList.add('navbar-light-theme');
    updateSeoMeta(
      'Contact PR Real Estate | Private Client Concierge Desk DIFC Dubai',
      'Connect confidentially with our licensed private wealth property advisors located in Gate Precinct 4, DIFC, Dubai.',
      false
    );
  } else if (rootSegment === '404') {
    show404Page();
  } else {
    // Unrecognized route -> 404 Luxury Page
    show404Page(`The requested page "${rawHash}" does not exist in our private catalog.`);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPage(pageId) {
  const el = document.getElementById(pageId);
  if (el) el.classList.add('active');
}

/* --------------------------------------------------------------------------
   3. Navbar Scroll Behavior
   -------------------------------------------------------------------------- */
function initNavbarScroll() {
  const navbar = document.getElementById('mainNavbar');
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const overlay = document.getElementById('mobileMenuOverlay');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }
}

function closeMobileMenu() {
  const overlay = document.getElementById('mobileMenuOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* --------------------------------------------------------------------------
   4. Home Page Rendering
   -------------------------------------------------------------------------- */
function renderHomePage() {
  // Render 3 featured properties
  const featGrid = document.getElementById('homeFeaturedProperties');
  if (featGrid) {
    const top3 = allProperties.slice(0, 3);
    featGrid.innerHTML = top3.map(p => createPropertyCardHTML(p)).join('');
  }

  // Render 3 featured off-plan projects
  const offGrid = document.getElementById('homeFeaturedOffplan');
  if (offGrid) {
    const top3Off = allOffplan.slice(0, 3);
    offGrid.innerHTML = top3Off.map(p => createOffplanCardHTML(p)).join('');
  }

  // Render Popular Communities
  const commGrid = document.getElementById('homeCommunitiesGrid');
  if (commGrid) {
    const popularCommunities = [
      { name: "Palm Jumeirah", tag: "Beachfront Sanctuaries", yield: "7.8% Gross", img: "/assets/images/palm_beachfront_estate.jpg", price: "From AED 18M" },
      { name: "Downtown Dubai", tag: "Skyline & Opera District", yield: "7.2% Gross", img: "/assets/images/hero_dubai_skyline_unique.jpg", price: "From AED 6.9M" },
      { name: "Dubai Marina", tag: "Yacht Harbour & Canal", yield: "8.4% Gross", img: "/assets/images/dubai_marina_twilight.jpg", price: "From AED 3.8M" },
      { name: "Dubai Hills Estate", tag: "Championship Golf Parkland", yield: "6.5% Gross", img: "/assets/images/emirates_hills_villa.jpg", price: "From AED 14M" },
      { name: "Business Bay", tag: "Waterfront Commercial & Living", yield: "8.5% Gross", img: "/assets/images/offplan_solis_tower.jpg", price: "From AED 3.4M" },
      { name: "JVC (Jumeirah Village Circle)", tag: "High-Yield Urban Haven", yield: "9.2% Gross", img: "/assets/images/crestline_harbour.jpg", price: "From AED 2.1M" }
    ];

    commGrid.innerHTML = popularCommunities.map(c => `
      <div class="community-card" onclick="window.prApp.searchByCommunity('${c.name}')" role="button" tabindex="0">
        <img src="${c.img}" alt="${c.name} Dubai" class="community-card-bg" loading="lazy">
        <div class="community-card-overlay">
          <span class="community-card-tag">${c.tag}</span>
          <h3 class="community-card-title">${c.name}</h3>
          <div class="community-card-meta">
            <span>Est. Yield: ${c.yield}</span>
            <span>${c.price}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function handleHeroSearch(e) {
  e.preventDefault();
  const community = document.getElementById('heroCommunity')?.value || 'all';
  const category = document.getElementById('heroCategory')?.value || 'all';
  const bedrooms = document.getElementById('heroBedrooms')?.value || 'all';
  const budget = document.getElementById('heroBudget')?.value || 'all';

  activePropertyFilter = {
    community,
    category,
    bedrooms,
    price: budget
  };

  window.location.hash = '#/properties';
}

function searchByCommunity(communityName) {
  activePropertyFilter.community = communityName;
  window.location.hash = '#/properties';
}

/* --------------------------------------------------------------------------
   5. Properties List Page & Dynamic Filters
   -------------------------------------------------------------------------- */
function renderPropertiesList() {
  // Sync filter dropdown values
  const commSelect = document.getElementById('propFilterCommunity');
  const catSelect = document.getElementById('propFilterCategory');
  const bedSelect = document.getElementById('propFilterBeds');
  const priceSelect = document.getElementById('propFilterPrice');

  if (commSelect) commSelect.value = activePropertyFilter.community;
  if (catSelect) catSelect.value = activePropertyFilter.category;
  if (bedSelect) bedSelect.value = activePropertyFilter.bedrooms;
  if (priceSelect) priceSelect.value = activePropertyFilter.price;

  const filtered = allProperties.filter(p => {
    if (activePropertyFilter.community !== 'all' && !p.community.toLowerCase().includes(activePropertyFilter.community.toLowerCase())) {
      return false;
    }
    if (activePropertyFilter.category !== 'all' && p.category.toLowerCase() !== activePropertyFilter.category.toLowerCase()) {
      return false;
    }
    if (activePropertyFilter.bedrooms !== 'all' && p.bedrooms < Number(activePropertyFilter.bedrooms)) {
      return false;
    }
    if (activePropertyFilter.price === 'under10m' && p.priceAED >= 10000000) return false;
    if (activePropertyFilter.price === '10m-30m' && (p.priceAED < 10000000 || p.priceAED > 30000000)) return false;
    if (activePropertyFilter.price === 'above30m' && p.priceAED <= 30000000) return false;
    if (!isNaN(Number(activePropertyFilter.price)) && Number(activePropertyFilter.price) > 0 && p.priceAED > Number(activePropertyFilter.price)) {
      return false;
    }
    return true;
  });

  const countDisplay = document.getElementById('propertiesListCount');
  if (countDisplay) {
    countDisplay.textContent = `${filtered.length} Residence${filtered.length === 1 ? '' : 's'}`;
  }

  const grid = document.getElementById('propertiesListGrid');
  if (grid) {
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <h3 style="font-family: var(--font-heading); font-size: 2rem; color: var(--color-charcoal); margin-bottom: 0.5rem;">No Residences Matched Criteria</h3>
          <p style="color: var(--color-warmgray); margin-bottom: 1.5rem;">Adjust your filter selection to discover available prime properties.</p>
          <button class="btn btn-gold-solid" onclick="window.prApp.resetPropertyFilters()">Reset Filters</button>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(p => createPropertyCardHTML(p)).join('');
    }
  }
}

function applyPropertyFilters() {
  activePropertyFilter.community = document.getElementById('propFilterCommunity')?.value || 'all';
  activePropertyFilter.category = document.getElementById('propFilterCategory')?.value || 'all';
  activePropertyFilter.bedrooms = document.getElementById('propFilterBeds')?.value || 'all';
  activePropertyFilter.price = document.getElementById('propFilterPrice')?.value || 'all';
  renderPropertiesList();
}

function resetPropertyFilters() {
  activePropertyFilter = { community: 'all', category: 'all', bedrooms: 'all', price: 'all' };
  renderPropertiesList();
}

function createPropertyCardHTML(p) {
  return `
    <article class="property-card" onclick="window.location.hash='#/properties/${p.slug}'" role="button" tabindex="0">
      <div class="property-card-image-box">
        <img src="${p.image}" alt="${p.title}" class="property-card-image" loading="lazy">
        <span class="property-badge">${p.status}</span>
        <span class="property-category-badge">${p.category}</span>
      </div>
      <div class="property-card-details">
        <div class="property-card-gold-line"></div>
        <h3 class="property-card-title">${p.title}</h3>
        <div class="property-card-meta">
          <span>${p.community} • ${p.builtUpAreaSqft.toLocaleString()} SQ. FT</span>
          <span class="property-card-price">${formatAED(p.priceAED)}</span>
        </div>
        <div class="property-specs-pills">
          <div class="property-spec-item">
            <span>${p.bedrooms}</span> BEDS
          </div>
          <div class="property-spec-item">
            <span>${p.bathrooms}</span> BATHS
          </div>
          <div class="property-spec-item" style="margin-left: auto; color: var(--color-gold);">
            EXPLORE →
          </div>
        </div>
      </div>
    </article>
  `;
}

/* --------------------------------------------------------------------------
   6. Single Property Detail View
   -------------------------------------------------------------------------- */
function renderPropertyDetail(slug) {
  const container = document.getElementById('propertyDetailContainer');
  if (!container) return;

  const prop = allProperties.find(p => p.slug === slug || p.slug.includes(slug));

  if (!prop) {
    container.innerHTML = `
      <div style="text-align: center; padding: 6rem 1rem;">
        <h2 class="section-heading">Residence Not Found</h2>
        <p style="margin-bottom: 2rem;">The requested property is no longer active in our private catalog.</p>
        <a href="#/properties" class="btn btn-charcoal-solid">Return to Properties</a>
      </div>
    `;
    return;
  }

  const agent = allAgents.find(a => a.id === prop.agentId) || allAgents[0];
  const gallery = (prop.gallery && prop.gallery.length > 0) ? prop.gallery : [prop.image, prop.image];

  container.innerHTML = `
    <!-- Header -->
    <div class="prop-detail-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.5rem;">
        <div>
          <span class="section-tag">${prop.category.toUpperCase()} • ${prop.community.toUpperCase()}</span>
          <h1 class="section-heading" style="margin-bottom: 0.25rem;">${prop.title}</h1>
          <p style="color: var(--color-warmgray); font-size: 0.95rem;">${prop.subCommunity ? prop.subCommunity + ', ' : ''}${prop.community}, Dubai, UAE</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-gold); display: block;">ACQUISITION PRICE</span>
          <div style="font-family: var(--font-heading); font-size: 2.8rem; color: var(--color-charcoal); line-height: 1;">${formatAED(prop.priceAED)}</div>
        </div>
      </div>
    </div>

    <!-- Gallery Grid -->
    <div class="prop-detail-gallery">
      <img src="${gallery[0] || prop.image}" alt="${prop.title}" class="gallery-main-img">
      <div class="gallery-sub-grid">
        <img src="${gallery[1] || prop.image}" alt="${prop.title} View" class="gallery-sub-img">
        <img src="${gallery[2] || gallery[0] || prop.image}" alt="${prop.title} Interior" class="gallery-sub-img">
      </div>
    </div>

    <!-- Content & Forms Layout -->
    <div class="prop-detail-layout">
      <div>
        <div class="specs-strip">
          <div class="spec-cell">
            <h4>${prop.bedrooms} Beds</h4>
            <p>Bedrooms</p>
          </div>
          <div class="spec-cell">
            <h4>${prop.bathrooms} Baths</h4>
            <p>Bathrooms</p>
          </div>
          <div class="spec-cell">
            <h4>${prop.builtUpAreaSqft.toLocaleString()}</h4>
            <p>Built-Up Area (SQ.FT)</p>
          </div>
          <div class="spec-cell">
            <h4>${prop.status}</h4>
            <p>Status</p>
          </div>
        </div>

        <div style="margin: 2.5rem 0;">
          <span class="section-tag">ARCHITECTURAL NARRATIVE</span>
          <h3 style="font-family: var(--font-heading); font-size: 1.85rem; color: var(--color-charcoal); margin-bottom: 1rem;">
            About This Residence
          </h3>
          <p style="font-size: 1.05rem; line-height: 1.8; color: var(--color-charcoal); margin-bottom: 1.25rem;">
            ${prop.description}
          </p>
          <p style="font-size: 0.95rem; color: var(--color-warmgray); line-height: 1.7;">
            <strong>View Orientation:</strong> ${prop.view || 'Panoramic Dubai Skyline'}<br>
            <strong>Interior Specification:</strong> ${prop.furnishing || 'Turnkey Furnished'}<br>
            <strong>Title Deed:</strong> Freehold Title Deed Issued & Verified
          </p>
        </div>

        <div style="margin: 3rem 0;">
          <span class="section-tag">BESPOKE AMENITIES</span>
          <h3 style="font-family: var(--font-heading); font-size: 1.85rem; color: var(--color-charcoal); margin-bottom: 1rem;">
            Signature Features
          </h3>
          <ul class="prop-features-list">
            ${(prop.features || []).map(f => `<li class="prop-feature-item">${f}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Right Action Sidebar (Agent & Forms) -->
      <div>
        <div class="detail-sidebar-card">
          <!-- Licensed Senior Broker Strip -->
          <div class="agent-profile-strip">
            <img src="${agent.photo}" alt="${agent.name}" class="agent-avatar">
            <div>
              <h4 style="font-family: var(--font-heading); font-size: 1.35rem; color: var(--color-charcoal);">${agent.name}</h4>
              <p style="font-size: 0.7rem; color: var(--color-gold); letter-spacing: 0.1em; text-transform: uppercase;">${agent.role}</p>
              <p style="font-size: 0.72rem; color: var(--color-warmgray); margin-top: 0.15rem;">${agent.reraNumber} • ${agent.phone}</p>
            </div>
          </div>

          <!-- Dual Tabs for Book a Viewing & Enquire -->
          <div style="display: flex; border-bottom: 1px solid var(--color-lightgray); margin-bottom: 1.5rem;">
            <button id="tabBtnViewing" class="filter-tab active" style="flex: 1; padding: 0.75rem 0;" onclick="window.prApp.switchDetailTab('viewing')">
              Book a Viewing
            </button>
            <button id="tabBtnEnquire" class="filter-tab" style="flex: 1; padding: 0.75rem 0;" onclick="window.prApp.switchDetailTab('enquire')">
              Enquire
            </button>
          </div>

          <!-- Tab Content: Book a Viewing -->
          <form id="viewingForm" onsubmit="window.prApp.handleViewingSubmit(event, '${prop.id || prop.slug}', '${prop.title}')">
            <input type="text" name="honeypot" class="form-honeypot" tabindex="-1" autocomplete="off">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" name="clientName" class="form-input" placeholder="e.g. Lord Harrison Thorne" required>
            </div>
            <div class="form-group">
              <label>Phone / WhatsApp</label>
              <input type="tel" name="clientPhone" class="form-input" placeholder="+971 50 123 4567" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Preferred Date</label>
                <input type="date" name="viewingDate" class="form-input" required min="${new Date().toISOString().split('T')[0]}">
              </div>
              <div class="form-group">
                <label>Preferred Time</label>
                <select name="viewingTime" class="form-select">
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:30 PM">04:30 PM (Sunset)</option>
                  <option value="06:00 PM">06:00 PM</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Special Requests (Chauffeur, Private Aircraft Transfer)</label>
              <textarea name="notes" class="form-textarea" rows="2" placeholder="Private security or viewing confidentiality instructions..."></textarea>
            </div>
            <button type="submit" class="btn btn-gold-solid" style="width: 100%; margin-top: 0.5rem;">
              Confirm Private Viewing
            </button>
          </form>

          <!-- Tab Content: Enquire Form (hidden by default) -->
          <form id="enquireForm" style="display: none;" onsubmit="window.prApp.handleFormSubmit(event, 'Enquire: ${prop.title}')">
            <input type="text" name="honeypot" class="form-honeypot" tabindex="-1" autocomplete="off">
            <input type="hidden" name="interestType" value="Property Enquiry: ${prop.title}">
            <input type="hidden" name="community" value="${prop.community}">
            <div class="form-group">
              <label>Your Name</label>
              <input type="text" name="firstName" class="form-input" placeholder="e.g. Elena Rostova" required>
            </div>
            <div class="form-group">
              <label>Phone / WhatsApp</label>
              <input type="tel" name="phone" class="form-input" placeholder="+971 50 000 0000" required>
            </div>
            <div class="form-group">
              <label>Questions / Offer Details</label>
              <textarea name="notes" class="form-textarea" rows="3" placeholder="Inquire about payment terms, furnishings, or rental projections..."></textarea>
            </div>
            <button type="submit" class="btn btn-charcoal-solid" style="width: 100%;">
              Send Residence Inquiry
            </button>
          </form>

          <div style="margin-top: 1.5rem; text-align: center;">
            <button class="btn btn-charcoal-outline" style="width: 100%; font-size: 0.68rem;" onclick="window.prApp.downloadPropertyDossier('${prop.title}', '${prop.priceFormatted || formatAED(prop.priceAED)}')">
              Download Residence Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function switchDetailTab(tab) {
  const vForm = document.getElementById('viewingForm');
  const eForm = document.getElementById('enquireForm');
  const vBtn = document.getElementById('tabBtnViewing');
  const eBtn = document.getElementById('tabBtnEnquire');

  if (tab === 'viewing') {
    vForm.style.display = 'block';
    eForm.style.display = 'none';
    vBtn.classList.add('active');
    eBtn.classList.remove('active');
  } else {
    vForm.style.display = 'none';
    eForm.style.display = 'block';
    vBtn.classList.remove('active');
    eBtn.classList.add('active');
  }
}

/* --------------------------------------------------------------------------
   7. Off-Plan Projects List & Detail
   -------------------------------------------------------------------------- */
function renderOffplanList() {
  const grid = document.getElementById('offplanListGrid');
  if (!grid) return;
  grid.innerHTML = allOffplan.map(p => createOffplanCardHTML(p)).join('');
}

function createOffplanCardHTML(p) {
  return `
    <article class="offplan-card" onclick="window.location.hash='#/offplan/${p.slug}'" role="button" tabindex="0">
      <div class="offplan-card-img-wrap">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <span class="property-badge">${p.handoverDate}</span>
      </div>
      <div class="offplan-card-body">
        <span class="section-tag" style="margin-bottom: 0.35rem;">${p.developerName.toUpperCase()}</span>
        <h3 class="property-card-title">${p.title}</h3>
        <p style="font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-warmgray); margin-bottom: 1rem;">
          ${p.community} • ${p.paymentPlan}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-lightgray); padding-top: 1rem;">
          <div>
            <span style="font-size: 0.65rem; color: var(--color-warmgray); text-transform: uppercase; display: block;">STARTING FROM</span>
            <span style="font-family: var(--font-heading); font-size: 1.45rem; color: var(--color-charcoal);">${formatAED(p.startingPriceAED)}</span>
          </div>
          <span style="font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--color-gold);">
            VIEW PROJECT →
          </span>
        </div>
      </div>
    </article>
  `;
}

function renderProjectDetail(slug) {
  const container = document.getElementById('projectDetailContainer');
  if (!container) return;

  const project = allOffplan.find(p => p.slug === slug || p.slug.includes(slug));

  if (!project) {
    container.innerHTML = `
      <div style="text-align: center; padding: 6rem 1rem;">
        <h2 class="section-heading">Project Not Found</h2>
        <a href="#/offplan" class="btn btn-charcoal-solid">Return to Off-Plan</a>
      </div>
    `;
    return;
  }

  const pPlan = project.paymentPlanDetails || {
    booking: "20% Down Payment",
    duringConstruction: "40% During Construction",
    onHandover: "20% Handover",
    postHandover: "20% Post-Handover"
  };

  container.innerHTML = `
    <div class="prop-detail-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span class="section-tag">${project.developerName.toUpperCase()} • ${project.community.toUpperCase()}</span>
          <h1 class="section-heading" style="margin-bottom: 0.25rem;">${project.title}</h1>
          <p style="color: var(--color-warmgray); font-size: 0.95rem;">${project.tagline}</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-gold); display: block;">ENTRY PRICING</span>
          <div style="font-family: var(--font-heading); font-size: 2.8rem; color: var(--color-charcoal); line-height: 1;">From ${formatAED(project.startingPriceAED)}</div>
        </div>
      </div>
    </div>

    <!-- Hero Image Banner -->
    <div style="position: relative; width: 100%; height: 500px; overflow: hidden; margin-bottom: 3.5rem; box-shadow: var(--shadow-card);">
      <img src="${project.image}" alt="${project.title}" style="width: 100%; height: 100%; object-fit: cover;">
      <div style="position: absolute; bottom: 1.5rem; left: 1.5rem; background: rgba(26,26,26,0.85); backdrop-filter: blur(8px); padding: 0.85rem 1.5rem; color: var(--color-white); border-left: 2px solid var(--color-gold);">
        <span style="font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-gold);">CONSTRUCTION STATUS</span>
        <div style="font-family: var(--font-body); font-size: 0.88rem; font-weight: 500;">${project.constructionStatus}</div>
      </div>
    </div>

    <!-- Details and Form Layout -->
    <div class="prop-detail-layout">
      <div>
        <!-- Payment Plan Milestones -->
        <div style="margin-bottom: 3rem;">
          <span class="section-tag">INVESTOR PAYMENT STRUCTURE</span>
          <h3 style="font-family: var(--font-heading); font-size: 2rem; color: var(--color-charcoal); margin-bottom: 0.5rem;">
            Payment Plan & Key Milestones
          </h3>
          <p style="color: var(--color-warmgray); margin-bottom: 1.5rem;">
            Estimated Handover Date: <strong>${project.handoverDate}</strong> • Schedule: <strong>${project.paymentPlan}</strong>
          </p>

          <div class="offplan-milestone-grid">
            <div class="milestone-box">
              <div class="milestone-percent">${pPlan.booking.split(' ')[0] || '20%'}</div>
              <div class="milestone-desc">On Booking & Reservation</div>
            </div>
            <div class="milestone-box">
              <div class="milestone-percent">${pPlan.duringConstruction.split(' ')[0] || '40%'}</div>
              <div class="milestone-desc">During Construction</div>
            </div>
            <div class="milestone-box">
              <div class="milestone-percent">${pPlan.onHandover.split(' ')[0] || '20%'}</div>
              <div class="milestone-desc">On Handover (${project.handoverDate})</div>
            </div>
            <div class="milestone-box">
              <div class="milestone-percent">${pPlan.postHandover ? pPlan.postHandover.split(' ')[0] : '20%'}</div>
              <div class="milestone-desc">Post-Handover / Title Deed</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 3rem;">
          <span class="section-tag">ARCHITECTURAL DESIGN</span>
          <h3 style="font-family: var(--font-heading); font-size: 1.85rem; color: var(--color-charcoal); margin-bottom: 1rem;">
            Masterpiece Overview
          </h3>
          <p style="font-size: 1.05rem; line-height: 1.8; color: var(--color-charcoal); margin-bottom: 1.5rem;">
            ${project.description}
          </p>
          <ul class="prop-features-list">
            ${(project.features || []).map(f => `<li class="prop-feature-item">${f}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Right Column: Download Brochure & Investor Dossier Form -->
      <div>
        <div class="detail-sidebar-card">
          <span class="section-tag" style="margin-bottom: 0.5rem;">INSTANT INVESTOR DOSSIER</span>
          <h3 style="font-family: var(--font-heading); font-size: 1.85rem; color: var(--color-charcoal); margin-bottom: 0.75rem;">
            Download Brochure
          </h3>
          <p style="font-size: 0.85rem; color: var(--color-warmgray); margin-bottom: 1.5rem; line-height: 1.6;">
            Access floor plans, unit allocations, and construction milestone schedules directly.
          </p>

          <form onsubmit="window.prApp.handleBrochureDownloadSubmit(event, '${project.title}', '${project.slug}')">
            <input type="text" name="honeypot" class="form-honeypot" tabindex="-1" autocomplete="off">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" name="clientName" class="form-input" placeholder="e.g. Marcus Chen" required>
            </div>
            <div class="form-group">
              <label>Phone / WhatsApp</label>
              <input type="tel" name="clientPhone" class="form-input" placeholder="+971 50 123 4567" required>
            </div>
            <div class="form-group">
              <label>Target Unit Size</label>
              <select name="unitSize" class="form-select">
                <option value="2 Bedroom Waterfront Suite">2 Bedroom Waterfront Suite</option>
                <option value="3 Bedroom Sky Duplex">3 Bedroom Sky Duplex</option>
                <option value="4+ Bedroom Penthouse / Villa">4+ Bedroom Penthouse / Villa</option>
                <option value="Whole Floor Private Floor Allocation">Whole Floor Private Floor Allocation</option>
              </select>
            </div>
            <button type="submit" class="btn btn-gold-solid" style="width: 100%; margin-top: 1rem;">
              Download Official Project Dossier
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   8. Mortgage Calculator Logic (with Upfront Costs)
   -------------------------------------------------------------------------- */
function initMortgageCalculator() {
  const pPrice = document.getElementById('pCalcPriceRange');
  const pDown = document.getElementById('pCalcDownRange');
  const pYears = document.getElementById('pCalcYearsRange');
  const pRate = document.getElementById('pCalcRateRange');

  if (pPrice) pPrice.addEventListener('input', updateMortgagePage);
  if (pDown) pDown.addEventListener('input', updateMortgagePage);
  if (pYears) pYears.addEventListener('input', updateMortgagePage);
  if (pRate) pRate.addEventListener('input', updateMortgagePage);
}

function updateMortgagePage() {
  const pPriceEl = document.getElementById('pCalcPriceRange');
  if (!pPriceEl) return;

  const price = parseFloat(pPriceEl.value) || 25000000;
  const downPercent = parseFloat(document.getElementById('pCalcDownRange')?.value || 25);
  const years = parseFloat(document.getElementById('pCalcYearsRange')?.value || 25);
  const rate = parseFloat(document.getElementById('pCalcRateRange')?.value || 4.25);

  const downAED = (price * downPercent) / 100;
  const loanPrincipal = price - downAED;
  const monthlyRate = (rate / 100) / 12;
  const totalMonths = years * 12;

  let monthlyPayment = 0;
  if (monthlyRate > 0) {
    monthlyPayment = (loanPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
                     (Math.pow(1 + monthlyRate, totalMonths) - 1);
  } else {
    monthlyPayment = loanPrincipal / totalMonths;
  }

  // Statutory & Upfront Costs
  const dldFee = price * 0.04;
  const dldAdmin = 580;
  const agencyFee = price * 0.021; // 2% + 5% VAT
  const mortgageRegFee = (loanPrincipal * 0.0025) + 290;
  const bankValuation = 3150;
  const trusteeFee = 4200;

  const totalUpfrontFees = dldFee + dldAdmin + agencyFee + mortgageRegFee + bankValuation + trusteeFee;
  const totalCashRequired = downAED + totalUpfrontFees;

  // DOM Updates
  document.getElementById('pCalcPriceDisplay').textContent = formatAED(price);
  document.getElementById('pCalcDownDisplay').textContent = `${downPercent}% (${formatAED(downAED)})`;
  document.getElementById('pCalcYearsDisplay').textContent = `${years} Year${years === 1 ? '' : 's'}`;
  document.getElementById('pCalcRateDisplay').textContent = `${rate.toFixed(2)}%`;

  document.getElementById('pCalcMonthlyResult').textContent = formatAED(monthlyPayment);
  document.getElementById('pCalcLoanPrincipal').textContent = formatAED(loanPrincipal);
  document.getElementById('pCalcDownTotal').textContent = formatAED(downAED);
  document.getElementById('pCalcUpfrontFees').textContent = formatAED(totalUpfrontFees);
  document.getElementById('pCalcTotalCashRequired').textContent = formatAED(totalCashRequired);

  // Upfront Table
  document.getElementById('tblDLDFee').textContent = formatAED(dldFee);
  document.getElementById('tblAgencyFee').textContent = formatAED(agencyFee);
  document.getElementById('tblMortgageRegFee').textContent = formatAED(mortgageRegFee);
  document.getElementById('tblTotalUpfront').textContent = formatAED(totalUpfrontFees);
}

function setPPrice(val) {
  const el = document.getElementById('pCalcPriceRange');
  if (el) {
    el.value = val;
    updateMortgagePage();
  }
}

function setPDown(val) {
  const el = document.getElementById('pCalcDownRange');
  if (el) {
    el.value = val;
    updateMortgagePage();
  }
}

/* --------------------------------------------------------------------------
   9. About Page Rendering
   -------------------------------------------------------------------------- */
function renderAboutPage() {
  const grid = document.getElementById('aboutAgentsGrid');
  if (!grid) return;

  grid.innerHTML = allAgents.map(a => `
    <div style="background-color: var(--color-white); border: 1px solid var(--color-lightgray); padding: 2.5rem; text-align: center; box-shadow: var(--shadow-soft);">
      <img src="${a.photo}" alt="${a.name}" style="width: 110px; height: 110px; border-radius: 50%; object-fit: cover; margin: 0 auto 1.5rem; border: 2px solid var(--color-gold);">
      <h3 style="font-family: var(--font-heading); font-size: 1.75rem; color: var(--color-charcoal); margin-bottom: 0.25rem;">${a.name}</h3>
      <p style="font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--color-gold); font-weight: 500; margin-bottom: 1rem;">${a.role}</p>
      <div style="font-size: 0.82rem; color: var(--color-warmgray); line-height: 1.8; margin-bottom: 1.5rem;">
        <strong>License:</strong> ${a.reraNumber}<br>
        <strong>Languages:</strong> ${a.languages}<br>
        <strong>Track Record:</strong> ${a.transactionsCount} Transactions
      </div>
      <button class="btn btn-charcoal-outline" style="width: 100%; font-size: 0.65rem;" onclick="window.prApp.openRegisterModal('Advisory with ${a.name}')">
        Consult with ${a.name.split(' ')[0]}
      </button>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   10. Form Submissions with Anti-Spam & Backend Storage
   -------------------------------------------------------------------------- */
async function handleFormSubmit(e, formSource = 'Website Registration') {
  e.preventDefault();
  if (!checkCooldown()) return;
  const form = e.target;
  const formData = new FormData(form);

  // Honeypot spam check
  const honeypot = formData.get('honeypot');
  if (honeypot && honeypot.trim() !== '') {
    showToast('Inquiry Received', THANK_YOU_MESSAGE);
    form.reset();
    return;
  }

  const payload = {
    firstName: formData.get('firstName') || formData.get('ownerName') || 'Client',
    lastName: formData.get('lastName') || '',
    phone: formData.get('phone') || '',
    interestType: formData.get('interestType') || 'General Portfolio Inquiry',
    community: formData.get('community') || 'All Prime Enclaves',
    budget: formData.get('budget') || 'AED 15M - 25M',
    sourceForm: formSource,
    notes: formData.get('notes') || ''
  };

  // Close modal if open
  closeModal('registerModal');

  try {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 429) {
      showToast('Notice', 'Please wait a moment before sending another request.');
      return;
    }

    showToast('Inquiry Received', THANK_YOU_MESSAGE);
    form.reset();
  } catch {
    showToast('Inquiry Received', THANK_YOU_MESSAGE);
    form.reset();
  }
}

async function handleViewingSubmit(e, propertyId, propertyTitle) {
  e.preventDefault();
  if (!checkCooldown()) return;
  const form = e.target;
  const formData = new FormData(form);

  const honeypot = formData.get('honeypot');
  if (honeypot && honeypot.trim() !== '') return;

  const payload = {
    propertyId,
    propertyTitle,
    clientName: formData.get('clientName') || 'Client',
    clientPhone: formData.get('clientPhone') || '',
    viewingDate: formData.get('viewingDate') || '',
    viewingTime: formData.get('viewingTime') || '',
    notes: formData.get('notes') || ''
  };

  try {
    const res = await fetch(`${API_BASE}/viewings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 429) {
      showToast('Notice', 'Please wait a moment before sending another request.');
      return;
    }

    showToast('Viewing Confirmed', THANK_YOU_MESSAGE);
    form.reset();
  } catch {
    showToast('Viewing Confirmed', THANK_YOU_MESSAGE);
    form.reset();
  }
}

async function handleCallbackSubmit(e) {
  e.preventDefault();
  if (!checkCooldown()) return;
  const form = e.target;
  const formData = new FormData(form);

  const honeypot = formData.get('honeypot');
  if (honeypot && honeypot.trim() !== '') return;

  closeModal('callbackModal');

  const payload = {
    name: formData.get('name') || 'Client',
    phone: formData.get('phone') || '',
    preferredTime: formData.get('preferredTime') || 'Immediate (Within 15 minutes)'
  };

  try {
    const res = await fetch(`${API_BASE}/call-me-back`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 429) {
      showToast('Notice', 'Please wait a moment before sending another request.');
      return;
    }

    showToast('Call Scheduled', THANK_YOU_MESSAGE);
    form.reset();
  } catch {
    showToast('Call Scheduled', THANK_YOU_MESSAGE);
    form.reset();
  }
}

async function handleBrochureDownloadSubmit(e, projectTitle, slug) {
  e.preventDefault();
  if (!checkCooldown()) return;
  const form = e.target;
  const formData = new FormData(form);

  const clientName = formData.get('clientName') || 'Client';
  const clientPhone = formData.get('clientPhone') || '';
  const unitSize = formData.get('unitSize') || '';

  // Trigger file download
  const dossierContent = `
=====================================================
PR REAL ESTATE | OFF-PLAN PROJECT DOSSIER
=====================================================
PROJECT: ${projectTitle}
LOCATION: Dubai Prime, United Arab Emirates
ALLOCATION FOCUS: ${unitSize}

REGISTERED CLIENT: ${clientName} (${clientPhone})
DATE: ${new Date().toLocaleDateString('en-GB')}

EXECUTIVE SUMMARY:
Full architectural blueprints, milestone disbursement schedule,
and developer escrow accounts have been generated for this acquisition.

DIRECT BROKERAGE CONTACT:
PR Real Estate LLC • Gate Precinct 4, DIFC, Dubai
Telephone: +971 4 829 9000
Reference ID: DOSSIER-${slug.toUpperCase()}
=====================================================
Confidential Document - For Authorized Recipient Only
  `.trim();

  const blob = new Blob([dossierContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PR_Real_Estate_${slug}_Dossier.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Inquiry Received', THANK_YOU_MESSAGE);

  // Log lead to backend
  try {
    await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: clientName,
        phone: clientPhone,
        interestType: `Brochure Download: ${projectTitle} (${unitSize})`,
        community: 'Off-Plan Development',
        budget: 'Investor Allocation',
        sourceForm: `Download Brochure: ${projectTitle}`
      })
    });
  } catch {
    // silent
  }

  form.reset();
}

function downloadPropertyDossier(title, price) {
  const content = `
=====================================================
PR REAL ESTATE | RESIDENCE SPECIFICATIONS
=====================================================
PROPERTY: ${title}
PRICING: ${price}
STATUS: Ready to Move • Title Deed Verified

ADVISORY OFFICE:
PR Real Estate LLC • DIFC Gate Precinct 4, Dubai
Direct Line: +971 4 829 9000
=====================================================
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PR_Residence_${title.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Dossier Downloaded', `Confidential summary for ${title} saved.`);
}

/* --------------------------------------------------------------------------
   11. Modals & Toast System
   -------------------------------------------------------------------------- */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function openCallbackModal() {
  openModal('callbackModal');
}

function openRegisterModal(source = 'Website Modal') {
  const heading = document.getElementById('regModalHeading');
  const sourceInp = document.getElementById('regModalSource');
  if (heading) heading.textContent = source.includes('Advisory') ? source : 'Register Interest';
  if (sourceInp) sourceInp.value = source;
  openModal('registerModal');
}

function openMortgageAdvisorModal() {
  openRegisterModal('Private Mortgage Bank Advisory');
}

function openNeonModal() {
  openModal('neonModal');
}

function showToast(title, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div style="color: var(--color-gold); font-size: 1.4rem;">✓</div>
    <div class="toast-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4800);
}

/* --------------------------------------------------------------------------
   12. Neon Database Connection Status
   -------------------------------------------------------------------------- */
async function checkNeonStatus() {
  const dot = document.getElementById('neonStatusDot');
  const text = document.getElementById('neonStatusText');
  const card = document.getElementById('neonModalStatusCard');

  try {
    const res = await fetch(`${API_BASE}/status`);
    const status = await res.json();

    if (status.connectedToNeon) {
      if (dot) dot.classList.add('connected');
      if (text) text.textContent = `Neon: Connected (${status.host})`;
      if (card) {
        card.innerHTML = `
          <div style="color: #2E7D32; font-weight: 600; margin-bottom: 0.5rem;">● Connected to Neon PostgreSQL</div>
          <div>Host: <code>${status.host}</code></div>
          <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #666;">
            Active Records in Neon: ${status.stats.properties} Properties, ${status.stats.offplanProjects} Projects, ${status.stats.developers} Developers, ${status.stats.leads} Leads.
          </div>
        `;
      }
    } else {
      if (dot) dot.classList.remove('connected');
      if (text) text.textContent = status.urlConfigured ? 'Neon: Connecting...' : 'Neon DB: Ready for Link';
      if (card) {
        card.innerHTML = `
          <div style="color: #FFA726; font-weight: 600; margin-bottom: 0.5rem;">⚡ Ready for Neon Database Link</div>
          <p style="color: #555; line-height: 1.5; margin-bottom: 0.5rem;">
            The app is currently using the integrated high-speed dataset (15 ready properties, 6 projects, 5 developers, 3 agents, 40 leads, 10 viewings, 5 sales).
          </p>
          <p style="font-size: 0.8rem; color: #777;">
            To connect your live Neon database, paste your link into <code>.env</code> and run <code>npm run db:setup</code>.
          </p>
        `;
      }
    }
  } catch {
    if (dot) dot.classList.remove('connected');
    if (text) text.textContent = 'Neon DB: Ready for Link';
  }
}

// Global exposure for inline onclick handlers & window access
window.prApp = {
  // Public UI Handlers
  closeMobileMenu,
  handleHeroSearch,
  searchByCommunity,
  applyPropertyFilters,
  resetPropertyFilters,
  switchDetailTab,
  setPPrice,
  setPDown,
  openCallbackModal,
  openRegisterModal,
  openMortgageAdvisorModal,
  openNeonModal,
  closeModal,
  openModal,
  showToast,
  handleFormSubmit,
  handleViewingSubmit,
  handleCallbackSubmit,
  handleBrochureDownloadSubmit,
  downloadPropertyDossier,
  hideLoader,
  show404Page,
  getAllProperties: () => allProperties,
  getAllOffplan: () => allOffplan,

  // Admin Portal & CRM Engine Handlers
  ...adminEngine
};
