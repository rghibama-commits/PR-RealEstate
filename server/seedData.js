// Comprehensive Seed Data for PR Real Estate
// 5 Developers, 6 Off-Plan Projects, 15 Ready Properties, 3 Agents, 4 Staff Accounts, 40 Leads, 10 Viewings, 5 Sales

export function calculateLeadScore(lead) {
  let score = 0;

  // 1. Phone number (+15 pts if present & valid)
  if (lead.phone && lead.phone.replace(/[^0-9]/g, '').length >= 7) {
    score += 15;
  }

  // 2. Payment method: Cash buyer = +25, Mortgage = +15, Undecided = +10
  const pay = (lead.paymentMethod || lead.interestType || '').toLowerCase();
  if (pay.includes('cash') || pay.includes('wire') || pay.includes('liquid') || pay.includes('ready funds')) {
    score += 25;
  } else if (pay.includes('mortgage') || pay.includes('finance') || pay.includes('bank')) {
    score += 15;
  } else {
    score += 10;
  }

  // 3. Buying timeline: Immediate/Within 1 Month = +25, 1-3 Months = +18, 3-6 Months = +10
  const timeline = (lead.buyingTimeline || lead.timeline || '').toLowerCase();
  if (timeline.includes('immediate') || timeline.includes('14 days') || timeline.includes('soon') || timeline.includes('1 month') || timeline.includes('asap')) {
    score += 25;
  } else if (timeline.includes('1-3') || timeline.includes('quarter') || timeline.includes('viewing')) {
    score += 18;
  } else if (timeline.includes('3-6')) {
    score += 10;
  } else {
    score += 10;
  }

  // 4. Budget size: 50M+ = +25, 25M-50M = +20, 15M-25M = +15, Under 15M = +10
  const budget = (lead.budget || lead.budgetAED || '').toLowerCase();
  if (budget.includes('50m') || budget.includes('100m') || budget.includes('75m') || budget.includes('80m') || budget.includes('89m') || budget.includes('68m')) {
    score += 25;
  } else if (budget.includes('25m') || budget.includes('30m') || budget.includes('34m') || budget.includes('45m') || budget.includes('48m')) {
    score += 20;
  } else if (budget.includes('15m') || budget.includes('18m') || budget.includes('22m') || budget.includes('19m')) {
    score += 15;
  } else {
    score += 10;
  }

  // 5. Interest in specific property or development: +10 pts
  const interest = (lead.interestType || '').toLowerCase();
  if (interest.includes('penthouse') || interest.includes('villa') || interest.includes('mansion') || interest.includes('solitaire') || interest.includes('aura') || interest.includes('crestline') || interest.includes('boulevard') || interest.includes('duplex') || interest.includes('serenity')) {
    score += 10;
  }

  // 6. Name completeness bonus: +5 pts
  if (lead.firstName && lead.lastName) {
    score += 5;
  }

  // Bound score 0-100
  score = Math.min(100, Math.max(0, score));

  // Temperature classification
  let temperature = 'WARM';
  if (score >= 75) {
    temperature = 'HOT';
  } else if (score < 45) {
    temperature = 'COLD';
  }

  return { score, temperature };
}

export const sampleDevelopers = [
  {
    slug: "aura-luxe-developments",
    name: "Aura Luxe Developments",
    country: "United Arab Emirates",
    headquarters: "DIFC Gate Precinct, Dubai",
    establishedYear: 2014,
    description: "Pioneers of biophilic high-rise architecture and waterfront residences along Dubai Water Canal and Downtown.",
    logoInitials: "ALD",
    totalProjects: 12
  },
  {
    slug: "crestline-properties-group",
    name: "Crestline Properties Group",
    country: "United Arab Emirates",
    headquarters: "Dubai Harbour Marina Tower, Dubai",
    establishedYear: 2011,
    description: "Curators of maritime luxury living, private superyacht berths, and iconic shoreline penthouses.",
    logoInitials: "CPG",
    totalProjects: 15
  },
  {
    slug: "solitaire-living-holdings",
    name: "Solitaire Living Holdings",
    country: "United Arab Emirates",
    headquarters: "Palm Jumeirah Crescent, Dubai",
    establishedYear: 2016,
    description: "Ultra-prime bespoke developer renowned for private cantilevered sky mansions and beachfront estates.",
    logoInitials: "SLH",
    totalProjects: 9
  },
  {
    slug: "elysian-bay-developments",
    name: "Elysian Bay Developments",
    country: "United Arab Emirates",
    headquarters: "Business Bay Marina Walk, Dubai",
    establishedYear: 2018,
    description: "Modernist architectural visionaries bringing minimalist Italian finishes and private lagoon villas to Dubai.",
    logoInitials: "EBD",
    totalProjects: 8
  },
  {
    slug: "mirage-heights-international",
    name: "Mirage Heights International",
    country: "United Arab Emirates",
    headquarters: "Emaar Square, Downtown Dubai",
    establishedYear: 2012,
    description: "Specialists in golf sanctuary estates and urban resort sanctuaries across Dubai Hills and JVC.",
    logoInitials: "MHI",
    totalProjects: 14
  }
];

export const sampleOffplanProjects = [
  {
    slug: "aura-canal-tower",
    developerSlug: "aura-luxe-developments",
    developerName: "Aura Luxe Developments",
    title: "Aura Canal Tower",
    community: "Dubai Water Canal",
    startingPriceAED: 18500000,
    handoverDate: "Q4 2027",
    paymentPlan: "60/40 Post-Handover",
    paymentPlanDetails: {
      booking: "20% On Booking",
      duringConstruction: "40% Across 7 Milestones",
      onHandover: "20% Handover (Q4 2027)",
      postHandover: "20% Over 24 Months Post-Handover"
    },
    image: "/assets/images/offplan_solis_tower.jpg",
    description: "A visionary vertical community rising beside the Dubai Canal. Biophilic glass facades envelop cascading sky gardens, private plunge pools, and direct yacht berths.",
    tagline: "Biophilic Sculptural Architecture Along the Waterfront Promenade",
    features: [
      "Direct yacht mooring berths at canal promenade",
      "Sky lounge with private resident dining",
      "Private terraced pools on every residence floor",
      "Biophilic air purification & double-glazed thermal acoustics",
      "24/7 dedicated white-glove lifestyle concierge"
    ],
    constructionStatus: "Foundation Completed (32% Progress)",
    totalUnits: 140
  },
  {
    slug: "the-crestline-collection",
    developerSlug: "crestline-properties-group",
    developerName: "Crestline Properties Group",
    title: "The Crestline Collection",
    community: "Dubai Harbour",
    startingPriceAED: 22800000,
    handoverDate: "Q2 2028",
    paymentPlan: "70/30 Construction Linked",
    paymentPlanDetails: {
      booking: "20% Initial Deposit",
      duringConstruction: "50% Linked to Construction Milestones",
      onHandover: "30% 100% Completion & Key Handover"
    },
    image: "/assets/images/crestline_harbour.jpg",
    description: "Positioned at the epicenter of Dubai's maritime district. The Crestline Collection delivers curvilinear glass architecture, private superyacht berths, and 360-degree sunset panoramas.",
    tagline: "Superyacht Marina Living with Dramatic Sunset Skylines",
    features: [
      "Private superyacht club membership included",
      "Signature beach club & infinity lagoon on 14th floor",
      "Private sommelier wine cellar & tasting lounge",
      "Dedicated helipad access & chauffeured Rolls-Royce fleet",
      "Smart biometric security and private elevator foyers"
    ],
    constructionStatus: "Sub-Structure Underway (18% Progress)",
    totalUnits: 96
  },
  {
    slug: "solitaire-sky-residences",
    developerSlug: "solitaire-living-holdings",
    developerName: "Solitaire Living Holdings",
    title: "Solitaire Sky Residences",
    community: "Downtown Dubai",
    startingPriceAED: 28000000,
    handoverDate: "Q1 2028",
    paymentPlan: "50/50 On Handover",
    paymentPlanDetails: {
      booking: "20% Down Payment",
      duringConstruction: "30% Linked to Structural Progress",
      onHandover: "50% On Handover in Q1 2028"
    },
    image: "/assets/images/hero_dubai_skyline_unique.jpg",
    description: "An exclusive architectural masterpiece facing Burj Khalifa and Dubai Opera. Designed by world-renowned Milanese architects with ceiling heights up to 6 meters.",
    tagline: "Uncompromised Skyline Majesty in the Cultural Core of Dubai",
    features: [
      "Front-row unobstructed views of Burj Khalifa fountain shows",
      "Triple-height grand entrance lobby with water cascades",
      "Private wellness retreat including cryogenic chamber",
      "Resident Michelin-partner private dining salon",
      "Subterranean 8-car climate-controlled showroom garages"
    ],
    constructionStatus: "Ground Shoring & Piling (22% Progress)",
    totalUnits: 64
  },
  {
    slug: "elysian-waters-pavilion",
    developerSlug: "elysian-bay-developments",
    developerName: "Elysian Bay Developments",
    title: "Elysian Waters Pavilion",
    community: "Palm Jumeirah",
    startingPriceAED: 39500000,
    handoverDate: "Q3 2027",
    paymentPlan: "60/40 Construction",
    paymentPlanDetails: {
      booking: "25% Reservation & SPA Registration",
      duringConstruction: "35% In 5 Construction Stages",
      onHandover: "40% Handover & Title Deed Issuance"
    },
    image: "/assets/images/palm_beachfront_estate.jpg",
    description: "Limited collection of 28 imperial beachfront sky mansions along the Palm Jumeirah Crescent with private crystal beach access.",
    tagline: "Beachfront Sanctuaries on the World's Most Famous Frond",
    features: [
      "Private 150-foot powder sand beach reserve",
      "Cantilevered saltwater infinity lap pools",
      "Custom Calacatta Borghini Italian marble bathrooms",
      "Sub-Zero and Poliform custom kitchen suites",
      "Private yacht tender service to DIFC & Marina"
    ],
    constructionStatus: "Superstructure Level 8 (45% Progress)",
    totalUnits: 28
  },
  {
    slug: "mirage-terraces-golf-villas",
    developerSlug: "mirage-heights-international",
    developerName: "Mirage Heights International",
    title: "Mirage Terraces Golf Estates",
    community: "Dubai Hills Estate",
    startingPriceAED: 14800000,
    handoverDate: "Q4 2026",
    paymentPlan: "80/20 Post-Handover",
    paymentPlanDetails: {
      booking: "15% Down Payment",
      duringConstruction: "45% Construction Linked",
      onHandover: "20% Handover (Q4 2026)",
      postHandover: "20% 18 Months Post-Handover"
    },
    image: "/assets/images/emirates_hills_villa.jpg",
    description: "Stepped modernist golf residences framing the 18-hole championship fairway with tranquil water features and private gardens.",
    tagline: "Parkland Opulence Framed by Downtown Skyline Views",
    features: [
      "Direct buggy access to Championship Clubhouse",
      "Private sunken fire pits and rooftop observation deck",
      "Smart geothermal cooling & solar glass integration",
      "Separate staff quarters and security command station",
      "Private temperature-controlled lap pool"
    ],
    constructionStatus: "Final Facade & Interior Fitout (78% Progress)",
    totalUnits: 52
  },
  {
    slug: "the-botanica-suites",
    developerSlug: "mirage-heights-international",
    developerName: "Mirage Heights International",
    title: "The Botanica Suites",
    community: "Jumeirah Village Circle",
    startingPriceAED: 2450000,
    handoverDate: "Q2 2027",
    paymentPlan: "70/30 Flexible Investor Plan",
    paymentPlanDetails: {
      booking: "10% Down Payment",
      duringConstruction: "50% 1% Monthly Over 50 Months",
      onHandover: "10% Handover Q2 2027",
      postHandover: "30% Over 30 Months Post-Handover"
    },
    image: "/assets/images/dubai_marina_twilight.jpg",
    description: "Boutique high-yield residential investment in JVC Prime, featuring lush landscaped sky terraces, smart technology, and high rental return projections.",
    tagline: "High-Yield Urban Sanctuary with 9.2% Projected Gross Returns",
    features: [
      "Projected 9.2% net rental yield for investors",
      "Rooftop infinity swimming pool & open-air cinema",
      "Full smart home keyless automation",
      "Dedicated co-working executive business lounge",
      "Comprehensive 5-year developer warranty"
    ],
    constructionStatus: "Basement Excavation (15% Progress)",
    totalUnits: 180
  }
];

export const sampleProperties = [
  {
    id: 1,
    slug: "the-solitaire-sky-penthouse",
    title: "The Solitaire Sky Penthouse",
    category: "Penthouse",
    community: "Palm Jumeirah",
    subCommunity: "Crescent West",
    priceAED: 48500000,
    bedrooms: 5,
    bathrooms: 6,
    builtUpAreaSqft: 11850,
    furnishing: "Bespoke Italian Furnished",
    view: "360° Open Arabian Gulf & Dubai Marina Skyline",
    status: "Ready to Move",
    image: "/assets/images/palm_penthouse.jpg",
    gallery: [
      "/assets/images/palm_penthouse.jpg",
      "/assets/images/hero_dubai_skyline_unique.jpg",
      "/assets/images/palm_beachfront_estate.jpg"
    ],
    description: "An extraordinary masterwork perched above Palm Jumeirah. Boasting double-height ceilings, travertine marble floors, a 30-meter private cantilevered infinity pool, and bespoke furnishings curated in Milan.",
    features: [
      "Private High-Speed Elevator with Direct Foyer Access",
      "Cantilevered Heated Infinity Pool Overlooking the Gulf",
      "Sub-Zero & Gaggenau Show and Prep Kitchens",
      "Private 6-Car Climate-Controlled Showcase Garage",
      "24/7 Dedicated White-Glove Concierge & Valet",
      "Smart Crestron Lighting and Climate Integration"
    ],
    agentId: 1
  },
  {
    id: 2,
    slug: "the-palm-serenity-beachfront-villa",
    title: "The Palm Serenity Beachfront Villa",
    category: "Villa",
    community: "Palm Jumeirah",
    subCommunity: "Frond G (Billionaire's Row)",
    priceAED: 89000000,
    bedrooms: 7,
    bathrooms: 9,
    builtUpAreaSqft: 19200,
    furnishing: "Turnkey Designer Furnished",
    view: "Direct Open Sea & Atlantis The Royal",
    status: "Ready to Move",
    image: "/assets/images/palm_beachfront_estate.jpg",
    gallery: [
      "/assets/images/palm_beachfront_estate.jpg",
      "/assets/images/palm_penthouse.jpg",
      "/assets/images/emirates_hills_villa.jpg"
    ],
    description: "An imperial beachfront sanctuary on the most coveted frond. Steps away from the calm waters of the Arabian Gulf, featuring seamless indoor-outdoor living and a private shaded beach cabana pavilion.",
    features: [
      "120-Foot Private Powder-White Sand Beach Access",
      "Olympic-Length Sunset Reflection Infinity Pool",
      "Separate Private Guest & Staff Quarters",
      "Custom Italian Calacatta Marble Throughout",
      "Deep-Water Mooring Capabilities for Tenders",
      "Private Cinema and Underground Wine Vault"
    ],
    agentId: 2
  },
  {
    id: 3,
    slug: "frond-vista-signature-mansion",
    title: "Frond Vista Signature Mansion",
    category: "Villa",
    community: "Palm Jumeirah",
    subCommunity: "Frond K",
    priceAED: 68000000,
    bedrooms: 6,
    bathrooms: 7,
    builtUpAreaSqft: 14500,
    furnishing: "Fully Furnished by Minotti",
    view: "Sunset Marina Skyline & Gulf",
    status: "Ready to Move",
    image: "/assets/images/emirates_hills_villa.jpg",
    gallery: [
      "/assets/images/emirates_hills_villa.jpg",
      "/assets/images/palm_beachfront_estate.jpg"
    ],
    description: "Impeccable contemporary architecture featuring double-height glass facades, floating marble staircases, and lush private tropical landscaping.",
    features: [
      "Private Beachfront with Custom Decking",
      "Private Gym and Finnish Steam Spa",
      "Automated Floor-to-Ceiling Schüco Glass Panes",
      "Show Kitchen with Marble Island & Chef Scullery",
      "Private Rooftop Sky Lounge with Jacuzzi"
    ],
    agentId: 2
  },
  {
    id: 4,
    slug: "the-grand-boulevard-residence",
    title: "The Grand Boulevard Duplex",
    category: "Duplex",
    community: "Downtown Dubai",
    subCommunity: "Sheikh Mohammed bin Rashid Blvd",
    priceAED: 34500000,
    bedrooms: 4,
    bathrooms: 5,
    builtUpAreaSqft: 7800,
    furnishing: "Furnished by Armani Casa",
    view: "Full Unobstructed Burj Khalifa & Fountain",
    status: "Ready to Move",
    image: "/assets/images/hero_dubai_skyline_unique.jpg",
    gallery: [
      "/assets/images/hero_dubai_skyline_unique.jpg",
      "/assets/images/hero_dubai_skyline.jpg"
    ],
    description: "Elevated high above the glittering boulevard, this duplex residence commands the most iconic skyline vista in the Middle East with 360-degree glass exposures and a rooftop star observatory.",
    features: [
      "Unrivaled Front-Row Vistas of Burj Khalifa",
      "Duplex Architectural Layout with 24-Foot Ceilings",
      "Private Butler Pantry & Wine Tasting Chamber",
      "Integrated Bang & Olufsen Acoustic System",
      "Direct Private Access to Luxury Fashion Avenue"
    ],
    agentId: 3
  },
  {
    id: 5,
    slug: "opera-district-designer-suite",
    title: "Opera District Designer Suite",
    category: "Apartment",
    community: "Downtown Dubai",
    subCommunity: "Opera Grand District",
    priceAED: 6900000,
    bedrooms: 2,
    bathrooms: 3,
    builtUpAreaSqft: 2150,
    furnishing: "Designer Semi-Furnished",
    view: "Dubai Opera Plaza & Skyline",
    status: "Ready to Move",
    image: "/assets/images/hero_dubai_skyline.jpg",
    gallery: [
      "/assets/images/hero_dubai_skyline.jpg",
      "/assets/images/hero_dubai_skyline_unique.jpg"
    ],
    description: "Sleek metropolitan sanctuary within walking distance of Dubai Opera. Features warm oak timber joinery, floor-to-ceiling double glazing, and a generous terrace.",
    features: [
      "Walking distance to Dubai Opera and Burj Lake",
      "Infinity lap pool overlooking Downtown skyline",
      "Concierge and valet parking service",
      "High rental yield potential of 7.4% gross",
      "State-of-the-art TechnoGym fitness suite"
    ],
    agentId: 3
  },
  {
    id: 6,
    slug: "burj-crown-corner-duplex",
    title: "Burj Crown Corner Duplex",
    category: "Penthouse",
    community: "Downtown Dubai",
    subCommunity: "Burj Crown Tower",
    priceAED: 16800000,
    bedrooms: 3,
    bathrooms: 4,
    builtUpAreaSqft: 4200,
    furnishing: "Fully Furnished",
    view: "Panoramic Downtown Skyline",
    status: "Ready to Move",
    image: "/assets/images/offplan_solis_tower.jpg",
    gallery: [
      "/assets/images/offplan_solis_tower.jpg",
      "/assets/images/hero_dubai_skyline.jpg"
    ],
    description: "Corner sky duplex featuring double-height glass atrium, private terrace plunge pool, and bespoke architectural wood paneling.",
    features: [
      "Private terrace plunge pool",
      "Dual Master Suites with Walk-in Dressing Salons",
      "Smart automated lighting and climate zones",
      "Dedicated resident business lounge access",
      "Three private underground parking bays"
    ],
    agentId: 3
  },
  {
    id: 7,
    slug: "one-marina-waterfront-duplex",
    title: "One Marina Waterfront Duplex",
    category: "Duplex",
    community: "Dubai Marina",
    subCommunity: "Marina Promenade",
    priceAED: 15200000,
    bedrooms: 4,
    bathrooms: 5,
    builtUpAreaSqft: 5600,
    furnishing: "Luxury Modern Furnished",
    view: "Yacht Marina Canal & Sea",
    status: "Ready to Move",
    image: "/assets/images/dubai_marina_twilight.jpg",
    gallery: [
      "/assets/images/dubai_marina_twilight.jpg",
      "/assets/images/crestline_harbour.jpg"
    ],
    description: "Stunning waterfront duplex directly framing luxury superyachts. Features wrap-around sun terraces, open-plan entertaining layout, and private boat dock coordination.",
    features: [
      "Direct boardwalk access to Marina restaurants",
      "Wrap-around sun deck with outdoor barbecue kitchen",
      "Custom German Poggenpohl kitchen appliances",
      "Floor-to-ceiling acoustic glass",
      "High gross rental yield of 8.1%"
    ],
    agentId: 1
  },
  {
    id: 8,
    slug: "marina-promenade-sky-suite",
    title: "Marina Promenade Sky Suite",
    category: "Apartment",
    community: "Dubai Marina",
    subCommunity: "Marina Quays",
    priceAED: 3850000,
    bedrooms: 2,
    bathrooms: 2,
    builtUpAreaSqft: 1750,
    furnishing: "Fully Furnished",
    view: "Full Marina Canal View",
    status: "Ready to Move",
    image: "/assets/images/crestline_harbour.jpg",
    gallery: [
      "/assets/images/crestline_harbour.jpg",
      "/assets/images/dubai_marina_twilight.jpg"
    ],
    description: "Turnkey luxury apartment bathed in natural light with uninterrupted views of the sparkling marina waterway and cruising yachts.",
    features: [
      "Turnkey furnished ready for immediate rental or occupancy",
      "Spacious covered terrace overlooking the waterway",
      "Infinity pool deck, squash courts, and steam room",
      "5-minute stroll to JBR The Beach",
      "Covered reserved parking bay"
    ],
    agentId: 1
  },
  {
    id: 9,
    slug: "the-marina-horizon-penthouse",
    title: "The Marina Horizon Penthouse",
    category: "Penthouse",
    community: "Dubai Marina",
    subCommunity: "Marina Pinnacle High Floors",
    priceAED: 26000000,
    bedrooms: 5,
    bathrooms: 6,
    builtUpAreaSqft: 8900,
    furnishing: "Bespoke Designer Furnished",
    view: "Full Sea, Ain Dubai & Marina Canal",
    status: "Ready to Move",
    image: "/assets/images/palm_penthouse.jpg",
    gallery: [
      "/assets/images/palm_penthouse.jpg",
      "/assets/images/dubai_marina_twilight.jpg"
    ],
    description: "A full-floor sky penthouse commanding 360-degree vistas of Ain Dubai, Palm Jumeirah, and the Arabian Gulf with an expansive private terrace.",
    features: [
      "Full private floor with keycard-accessed elevator",
      "Rooftop heated private swimming pool",
      "Dedicated maid's and driver's quarters",
      "Custom temperature-controlled wine room",
      "Four allocated private parking spaces"
    ],
    agentId: 1
  },
  {
    id: 10,
    slug: "canal-view-executive-residence",
    title: "Canal View Executive Residence",
    category: "Apartment",
    community: "Business Bay",
    subCommunity: "Marasi Drive Canal",
    priceAED: 3450000,
    bedrooms: 2,
    bathrooms: 3,
    builtUpAreaSqft: 1950,
    furnishing: "Contemporary Furnished",
    view: "Dubai Canal & Skyline",
    status: "Ready to Move",
    image: "/assets/images/offplan_solis_tower.jpg",
    gallery: [
      "/assets/images/offplan_solis_tower.jpg",
      "/assets/images/hero_dubai_skyline.jpg"
    ],
    description: "An elegant contemporary home perched right on the Dubai Water Canal promenade with floor-to-ceiling glass and seamless access to Downtown.",
    features: [
      "Direct promenade access for running and cycling",
      "Rooftop infinity swimming pool and gym",
      "5 minutes drive to DIFC Gate Avenue",
      "Strong historical rental yield of 8.5%",
      "Private balcony with canal water view"
    ],
    agentId: 3
  },
  {
    id: 11,
    slug: "the-opus-line-sky-penthouse",
    title: "The Opus Line Sky Penthouse",
    category: "Penthouse",
    community: "Business Bay",
    subCommunity: "Burj Khalifa District Border",
    priceAED: 19500000,
    bedrooms: 4,
    bathrooms: 5,
    builtUpAreaSqft: 6200,
    furnishing: "Turnkey Furnished by Zaha Studio",
    view: "Dubai Canal and Burj Khalifa",
    status: "Ready to Move",
    image: "/assets/images/hero_dubai_skyline_unique.jpg",
    gallery: [
      "/assets/images/hero_dubai_skyline_unique.jpg",
      "/assets/images/palm_penthouse.jpg"
    ],
    description: "Architectural tour-de-force showcasing organic curved walls, bespoke sculptural furniture, and private glass sky bridge overlooking the city.",
    features: [
      "Sculptural architectural interior design",
      "Private sky terrace with heated plunge spa",
      "Direct Michelin-star room service and concierge",
      "Triple automated climate and acoustics systems",
      "Private 3-car secure garage"
    ],
    agentId: 3
  },
  {
    id: 12,
    slug: "fairway-modernist-mansion",
    title: "Fairway Modernist Mansion",
    category: "Villa",
    community: "Dubai Hills Estate",
    subCommunity: "Dubai Hills Grove",
    priceAED: 45000000,
    bedrooms: 6,
    bathrooms: 7,
    builtUpAreaSqft: 15100,
    furnishing: "Custom Interior Finished",
    view: "18-Hole Championship Golf Course",
    status: "Ready to Move",
    image: "/assets/images/emirates_hills_villa.jpg",
    gallery: [
      "/assets/images/emirates_hills_villa.jpg",
      "/assets/images/palm_beachfront_estate.jpg"
    ],
    description: "Commanding modernist estate set directly on the golf fairway with sleek travertine facades, reflecting water gardens, and expansive entertaining lounges.",
    features: [
      "Direct panoramic golf course frontage",
      "Basement car gallery and private movie theatre",
      "Elevator connecting all three expansive levels",
      "Separate butler prep kitchen and staff suite",
      "Zero-edge heated swimming pool and sunken lounge"
    ],
    agentId: 2
  },
  {
    id: 13,
    slug: "park-ridge-luxury-villa",
    title: "Park Ridge Contemporary Villa",
    category: "Villa",
    community: "Dubai Hills Estate",
    subCommunity: "Maple Fairway Enclave",
    priceAED: 14200000,
    bedrooms: 4,
    bathrooms: 5,
    builtUpAreaSqft: 6800,
    furnishing: "Semi-Furnished",
    view: "Green Park and Skyline View",
    status: "Ready to Move",
    image: "/assets/images/palm_beachfront_estate.jpg",
    gallery: [
      "/assets/images/palm_beachfront_estate.jpg",
      "/assets/images/emirates_hills_villa.jpg"
    ],
    description: "Bright and family-oriented contemporary villa bordered by lush green parks, championship tennis courts, and Dubai Hills Mall.",
    features: [
      "Private landscaped garden with barbecue pavilion",
      "Modern open-concept Italian kitchen",
      "Minutes to King's College Hospital & Dubai Hills Mall",
      "Private 2-car garage with EV charger installed",
      "Spacious ensuite bedrooms with built-in dressing rooms"
    ],
    agentId: 2
  },
  {
    id: 14,
    slug: "belgravia-serene-townhouse",
    title: "Belgravia Serene Townhouse",
    category: "Townhouse",
    community: "JVC (Jumeirah Village Circle)",
    subCommunity: "District 14",
    priceAED: 3250000,
    bedrooms: 4,
    bathrooms: 4,
    builtUpAreaSqft: 3850,
    furnishing: "Fully Furnished",
    view: "Community Park & Tree-Lined Street",
    status: "Ready to Move",
    image: "/assets/images/crestline_harbour.jpg",
    gallery: [
      "/assets/images/crestline_harbour.jpg",
      "/assets/images/dubai_marina_twilight.jpg"
    ],
    description: "Exceptional modern townhouse featuring double-height ceiling over the main living salon, private rooftop terrace with outdoor pergola, and immaculate finishes.",
    features: [
      "Private rooftop garden terrace with outdoor lounge",
      "Smart lock and video doorbell integration",
      "Private 2-car covered parking",
      "High rental return exceeding 8.8% gross",
      "Steps from circle mall and neighbourhood community park"
    ],
    agentId: 1
  },
  {
    id: 15,
    slug: "lorangerie-garden-duplex",
    title: "L'Orangerie Garden Duplex",
    category: "Duplex",
    community: "JVC (Jumeirah Village Circle)",
    subCommunity: "District 11",
    priceAED: 2150000,
    bedrooms: 3,
    bathrooms: 3,
    builtUpAreaSqft: 2750,
    furnishing: "Turnkey Furnished",
    view: "Private Landscaped Courtyard",
    status: "Ready to Move",
    image: "/assets/images/dubai_marina_twilight.jpg",
    gallery: [
      "/assets/images/dubai_marina_twilight.jpg",
      "/assets/images/offplan_solis_tower.jpg"
    ],
    description: "Charming split-level residence featuring a private ground-level garden terrace, European kitchen appliances, and low service fees.",
    features: [
      "Private 650 sq.ft gated garden courtyard",
      "Modern duplex layout with master suite upstairs",
      "Low service charges maximizing investor yields",
      "Resort-style communal swimming pool and gymnasium",
      "Ideal turnkey investment or tranquil primary home"
    ],
    agentId: 1
  }
];

export const sampleAgents = [
  {
    id: 1,
    name: "Tariq Al-Mansoor",
    role: "Managing Director - Private Client Advisory",
    reraNumber: "RERA-28491",
    phone: "+971 4 829 9001",
    email: "tariq.mansoor@pr-realestate.ae",
    languages: "Arabic, English, French",
    photo: "/assets/images/palm_penthouse.jpg",
    transactionsCount: 142
  },
  {
    id: 2,
    name: "Victoria Sterling",
    role: "Associate Director - Palm & Waterfront Estates",
    reraNumber: "RERA-39102",
    phone: "+971 4 829 9002",
    email: "victoria.sterling@pr-realestate.ae",
    languages: "English, German, Russian",
    photo: "/assets/images/palm_beachfront_estate.jpg",
    transactionsCount: 118
  },
  {
    id: 3,
    name: "Alexander Vance",
    role: "Senior Partner - Penthouses & Capital Investments",
    reraNumber: "RERA-45820",
    phone: "+971 4 829 9003",
    email: "alexander.vance@pr-realestate.ae",
    languages: "English, Mandarin, Italian",
    photo: "/assets/images/hero_dubai_skyline_unique.jpg",
    transactionsCount: 96
  }
];

export const sampleStaffLogins = [
  {
    id: 1,
    username: "admin",
    email: "jay.director@pr-realestate.ae",
    password: "admin",
    passwordHash: "pbkdf2$admin$secret",
    fullName: "Jay Director (Executive)",
    role: "Director",
    agentId: null
  },
  {
    id: 2,
    username: "tariq.mansoor",
    email: "tariq.mansoor@pr-realestate.ae",
    password: "agent123",
    passwordHash: "pbkdf2$agent123",
    fullName: "Tariq Al-Mansoor",
    role: "Agent",
    agentId: 1
  },
  {
    id: 3,
    username: "victoria.sterling",
    email: "victoria.sterling@pr-realestate.ae",
    password: "agent123",
    passwordHash: "pbkdf2$agent123",
    fullName: "Victoria Sterling",
    role: "Agent",
    agentId: 2
  },
  {
    id: 4,
    username: "alexander.vance",
    email: "alexander.vance@pr-realestate.ae",
    password: "agent123",
    passwordHash: "pbkdf2$agent123",
    fullName: "Alexander Vance",
    role: "Agent",
    agentId: 3
  }
];

const rawLeadsData = [
  { ref: "PR-DXB-1001", firstName: "Lord Harrison", lastName: "Thorne", phone: "+44 7700 900142", interestType: "Beachfront Villa", community: "Palm Jumeirah", budget: "AED 50M - 100M+", paymentMethod: "Cash Buyer (Wire Ready)", buyingTimeline: "Immediate (14 Days)", sourceForm: "Hero Search / Inquiry", stage: "Viewing Scheduled", agentId: 2, daysAgo: 0, isSeen: false },
  { ref: "PR-DXB-1002", firstName: "Elena", lastName: "Rostova", phone: "+971 50 821 9901", interestType: "The Solitaire Sky Penthouse", community: "Downtown Dubai", budget: "AED 25M - 50M", paymentMethod: "Cash Buyer (Liquid)", buyingTimeline: "Within 1 Month", sourceForm: "Property Detail: Book a Viewing", stage: "Offer Made", agentId: 3, daysAgo: 1, isSeen: true },
  { ref: "PR-DXB-1003", firstName: "Marcus", lastName: "Chen", phone: "+65 9123 4567", interestType: "Aura Canal Tower", community: "Dubai Water Canal", budget: "AED 15M - 25M", paymentMethod: "Mortgage Pre-Approved", buyingTimeline: "1-3 Months", sourceForm: "Off-Plan: Download Brochure", stage: "Contacted", agentId: 1, daysAgo: 2, isSeen: true },
  { ref: "PR-DXB-1004", firstName: "Sophia", lastName: "Vanderberg", phone: "+41 79 123 4567", interestType: "Golf Fairway Estate", community: "Dubai Hills Estate", budget: "AED 25M - 50M", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Call Me Back Button", stage: "New", agentId: 2, daysAgo: 0, isSeen: false },
  { ref: "PR-DXB-1005", firstName: "David", lastName: "Rothschild", phone: "+33 6 1234 5678", interestType: "Sky Penthouse", community: "Palm Jumeirah", budget: "AED 50M - 100M+", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Modal Register Interest", stage: "Won", agentId: 1, daysAgo: 5, isSeen: true },
  { ref: "PR-DXB-1006", firstName: "Amira", lastName: "Al-Sabah", phone: "+965 9912 3456", interestType: "Palm Serenity Villa", community: "Palm Jumeirah", budget: "AED 50M - 100M+", paymentMethod: "Cash Buyer", buyingTimeline: "Within 1 Month", sourceForm: "Sell Valuation Form", stage: "Under Contract", agentId: 2, daysAgo: 1, isSeen: true },
  { ref: "PR-DXB-1007", firstName: "Jean-Paul", lastName: "Gault", phone: "+377 93 123456", interestType: "One Marina Duplex", community: "Dubai Marina", budget: "AED 15M - 25M", paymentMethod: "Cash Buyer", buyingTimeline: "1-3 Months", sourceForm: "Property Detail: Enquire", stage: "Viewing Scheduled", agentId: 1, daysAgo: 0, isSeen: false },
  { ref: "PR-DXB-1008", firstName: "Klaus", lastName: "Weber", phone: "+49 171 2345678", interestType: "The Crestline Collection", community: "Dubai Harbour", budget: "AED 15M - 25M", paymentMethod: "Mortgage", buyingTimeline: "1-3 Months", sourceForm: "Off-Plan: Download Brochure", stage: "Contacted", agentId: 3, daysAgo: 4, isSeen: true },
  { ref: "PR-DXB-1009", firstName: "Matteo", lastName: "Rossi", phone: "+39 335 1234567", interestType: "Opera District Suite", community: "Downtown Dubai", budget: "AED 5M - 15M", paymentMethod: "Mortgage", buyingTimeline: "3-6 Months", sourceForm: "Home In-Page Register", stage: "New", agentId: 3, daysAgo: 0, isSeen: false },
  { ref: "PR-DXB-1010", firstName: "Fahad", lastName: "Al-Kuwari", phone: "+974 5512 3456", interestType: "Fairway Modernist Mansion", community: "Dubai Hills Estate", budget: "AED 25M - 50M", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Call Me Back Button", stage: "Viewing Scheduled", agentId: 2, daysAgo: 1, isSeen: true },
  { ref: "PR-DXB-1011", firstName: "Julian", lastName: "Ashford", phone: "+44 7890 123456", interestType: "Canal View Executive", community: "Business Bay", budget: "AED 15M - 25M", paymentMethod: "Cash Buyer", buyingTimeline: "1-3 Months", sourceForm: "Property Detail: Enquire", stage: "Contacted", agentId: 1, daysAgo: 5, isSeen: true },
  { ref: "PR-DXB-1012", firstName: "Chloe", lastName: "Dupont", phone: "+33 6 9876 5432", interestType: "Belgravia Townhouse", community: "JVC (Jumeirah Village Circle)", budget: "AED 2M - 5M", paymentMethod: "Mortgage", buyingTimeline: "3-6 Months", sourceForm: "Home In-Page Register", stage: "New", agentId: 1, daysAgo: 0, isSeen: false },
  { ref: "PR-DXB-1013", firstName: "Maximilian", lastName: "Schreiber", phone: "+43 664 1234567", interestType: "Solitaire Sky Residences", community: "Downtown Dubai", budget: "AED 25M - 50M", paymentMethod: "Cash Buyer", buyingTimeline: "1-3 Months", sourceForm: "Off-Plan: Download Brochure", stage: "Offer Made", agentId: 3, daysAgo: 2, isSeen: true },
  { ref: "PR-DXB-1014", firstName: "Sultan", lastName: "Al-Ghanim", phone: "+968 9123 4567", interestType: "Frond Vista Signature", community: "Palm Jumeirah", budget: "AED 50M - 100M+", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Call Me Back Button", stage: "Viewing Scheduled", agentId: 2, daysAgo: 1, isSeen: true },
  { ref: "PR-DXB-1015", firstName: "Sebastian", lastName: "Moreau", phone: "+32 470 123456", interestType: "Canal View Residence", community: "Business Bay", budget: "AED 2M - 5M", paymentMethod: "Mortgage", buyingTimeline: "3-6 Months", sourceForm: "Mortgage Advisory Form", stage: "New", agentId: 3, daysAgo: 4, isSeen: true },
  { ref: "PR-DXB-1016", firstName: "Dmitri", lastName: "Volkov", phone: "+971 52 345 6789", interestType: "Marina Horizon Penthouse", community: "Dubai Marina", budget: "AED 25M - 50M", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Sell Valuation Form", stage: "Under Contract", agentId: 1, daysAgo: 1, isSeen: true },
  { ref: "PR-DXB-1017", firstName: "Lucas", lastName: "Silva", phone: "+55 11 98765 4321", interestType: "The Botanica Suites", community: "JVC (Jumeirah Village Circle)", budget: "AED 2M - 5M", paymentMethod: "Cash Buyer", buyingTimeline: "1-3 Months", sourceForm: "Off-Plan: Download Brochure", stage: "Contacted", agentId: 1, daysAgo: 6, isSeen: true },
  { ref: "PR-DXB-1018", firstName: "Fatima", lastName: "Al-Bader", phone: "+965 6612 3456", interestType: "Grand Boulevard Duplex", community: "Downtown Dubai", budget: "AED 25M - 50M", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Property Detail: Book a Viewing", stage: "Viewing Scheduled", agentId: 3, daysAgo: 0, isSeen: false },
  { ref: "PR-DXB-1019", firstName: "Arthur", lastName: "Pendleton", phone: "+1 212 555 0192", interestType: "Park Ridge Villa", community: "Dubai Hills Estate", budget: "AED 15M - 25M", paymentMethod: "Mortgage", buyingTimeline: "1-3 Months", sourceForm: "Off-Plan: Download Brochure", stage: "New", agentId: 2, daysAgo: 5, isSeen: true },
  { ref: "PR-DXB-1020", firstName: "Kenji", lastName: "Takahashi", phone: "+81 90 1234 5678", interestType: "Crestline Maritime Harbour", community: "Dubai Harbour", budget: "AED 25M - 50M", paymentMethod: "Cash Buyer", buyingTimeline: "1-3 Months", sourceForm: "Modal Register Interest", stage: "Contacted", agentId: 1, daysAgo: 2, isSeen: true },
  { ref: "PR-DXB-1021", firstName: "Sven", lastName: "Lindqvist", phone: "+46 70 123 4567", interestType: "The Solitaire Sky Penthouse", community: "Palm Jumeirah", budget: "AED 50M - 100M+", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Call Me Back Button", stage: "Offer Made", agentId: 1, daysAgo: 1, isSeen: true },
  { ref: "PR-DXB-1022", firstName: "Natasha", lastName: "Ivanova", phone: "+971 55 432 1098", interestType: "Park Ridge Contemporary", community: "Dubai Hills Estate", budget: "AED 15M - 25M", paymentMethod: "Cash Buyer", buyingTimeline: "1-3 Months", sourceForm: "Property Detail: Enquire", stage: "Contacted", agentId: 2, daysAgo: 4, isSeen: true },
  { ref: "PR-DXB-1023", firstName: "Nasser", lastName: "Al-Suwaidi", phone: "+971 50 111 2233", interestType: "Crestline Maritime Tower", community: "Dubai Harbour", budget: "AED 25M - 50M", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Sell Valuation Form", stage: "Offer Made", agentId: 3, daysAgo: 2, isSeen: true },
  { ref: "PR-DXB-1024", firstName: "William", lastName: "Harrington", phone: "+44 7711 223344", interestType: "Beachfront Villa", community: "Palm Jumeirah", budget: "AED 50M - 100M+", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Modal Register Interest", stage: "Won", agentId: 2, daysAgo: 7, isSeen: true },
  { ref: "PR-DXB-1025", firstName: "Isabelle", lastName: "Fontaine", phone: "+33 6 2233 4455", interestType: "Opera District Suite", community: "Downtown Dubai", budget: "AED 5M - 15M", paymentMethod: "Mortgage", buyingTimeline: "3-6 Months", sourceForm: "Off-Plan: Download Brochure", stage: "Contacted", agentId: 3, daysAgo: 3, isSeen: true },
  { ref: "PR-DXB-1026", firstName: "Christian", lastName: "Zimmermann", phone: "+49 172 3344556", interestType: "Canal View Residence", community: "Business Bay", budget: "AED 2M - 5M", paymentMethod: "Mortgage", buyingTimeline: "3-6 Months", sourceForm: "Hero Search / Inquiry", stage: "New", agentId: 1, daysAgo: 0, isSeen: false },
  { ref: "PR-DXB-1027", firstName: "Rashid", lastName: "Al-Maktoum", phone: "+971 50 999 8877", interestType: "Solitaire Sky Penthouse", community: "Palm Jumeirah", budget: "AED 50M - 100M+", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Property Detail: Book a Viewing", stage: "Viewing Scheduled", agentId: 1, daysAgo: 1, isSeen: true },
  { ref: "PR-DXB-1028", firstName: "Oliver", lastName: "Twistleton", phone: "+44 7822 334455", interestType: "L'Orangerie Duplex", community: "JVC (Jumeirah Village Circle)", budget: "AED 2M - 5M", paymentMethod: "Mortgage", buyingTimeline: "3-6 Months", sourceForm: "Call Me Back Button", stage: "New", agentId: 1, daysAgo: 6, isSeen: true },
  { ref: "PR-DXB-1029", firstName: "Giuseppe", lastName: "Lombardi", phone: "+39 340 1234567", interestType: "Aura Canal Tower", community: "Dubai Water Canal", budget: "AED 15M - 25M", paymentMethod: "Cash Buyer", buyingTimeline: "1-3 Months", sourceForm: "Off-Plan: Download Brochure", stage: "Contacted", agentId: 3, daysAgo: 2, isSeen: true },
  { ref: "PR-DXB-1030", firstName: "Olga", lastName: "Smirnova", phone: "+971 52 777 6655", interestType: "Marina Promenade Suite", community: "Dubai Marina", budget: "AED 2M - 5M", paymentMethod: "Cash Buyer", buyingTimeline: "Within 1 Month", sourceForm: "Home In-Page Register", stage: "Viewing Scheduled", agentId: 1, daysAgo: 1, isSeen: true },
  { ref: "PR-DXB-1031", firstName: "Charles", lastName: "Montgomery", phone: "+1 415 555 2671", interestType: "Fairway Modernist Mansion", community: "Dubai Hills Estate", budget: "AED 25M - 50M", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Property Detail: Enquire", stage: "Under Contract", agentId: 2, daysAgo: 2, isSeen: true },
  { ref: "PR-DXB-1032", firstName: "Maryam", lastName: "Al-Humaidi", phone: "+965 9777 8899", interestType: "Grand Boulevard Duplex", community: "Downtown Dubai", budget: "AED 25M - 50M", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Sell Valuation Form", stage: "New", agentId: 3, daysAgo: 0, isSeen: false },
  { ref: "PR-DXB-1033", firstName: "Henrik", lastName: "Nielsen", phone: "+45 20 12 34 56", interestType: "One Marina Duplex", community: "Dubai Marina", budget: "AED 15M - 25M", paymentMethod: "Cash Buyer", buyingTimeline: "1-3 Months", sourceForm: "Call Me Back Button", stage: "Contacted", agentId: 1, daysAgo: 4, isSeen: true },
  { ref: "PR-DXB-1034", firstName: "Tatiana", lastName: "Petrova", phone: "+971 54 888 9900", interestType: "Elysian Waters Pavilion", community: "Palm Jumeirah", budget: "AED 25M - 50M", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Off-Plan: Download Brochure", stage: "Viewing Scheduled", agentId: 2, daysAgo: 1, isSeen: true },
  { ref: "PR-DXB-1035", firstName: "George", lastName: "St. Clair", phone: "+44 7900 887766", interestType: "Park Ridge Villa", community: "Dubai Hills Estate", budget: "AED 15M - 25M", paymentMethod: "Mortgage", buyingTimeline: "1-3 Months", sourceForm: "Contact Page Message", stage: "New", agentId: 2, daysAgo: 5, isSeen: true },
  { ref: "PR-DXB-1036", firstName: "Waleed", lastName: "Al-Dosari", phone: "+966 50 123 4567", interestType: "The Opus Line Sky Penthouse", community: "Business Bay", budget: "AED 15M - 25M", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Property Detail: Enquire", stage: "Offer Made", agentId: 3, daysAgo: 2, isSeen: true },
  { ref: "PR-DXB-1037", firstName: "Victoria", lastName: "Romanova", phone: "+971 50 333 4411", interestType: "Palm Serenity Beachfront", community: "Palm Jumeirah", budget: "AED 50M - 100M+", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Call Me Back Button", stage: "Viewing Scheduled", agentId: 2, daysAgo: 0, isSeen: false },
  { ref: "PR-DXB-1038", firstName: "Anders", lastName: "Holm", phone: "+47 900 12 345", interestType: "Botanica High Yield", community: "JVC (Jumeirah Village Circle)", budget: "AED 2M - 5M", paymentMethod: "Mortgage", buyingTimeline: "3-6 Months", sourceForm: "Hero Search / Inquiry", stage: "New", agentId: 1, daysAgo: 0, isSeen: false },
  { ref: "PR-DXB-1039", firstName: "Bader", lastName: "Al-Otaibi", phone: "+966 55 987 6543", interestType: "Burj Crown Duplex", community: "Downtown Dubai", budget: "AED 15M - 25M", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Property Detail: Enquire", stage: "Under Contract", agentId: 3, daysAgo: 1, isSeen: true },
  { ref: "PR-DXB-1040", firstName: "Edward", lastName: "Beaumont", phone: "+44 7788 990011", interestType: "Frond Vista Signature", community: "Palm Jumeirah", budget: "AED 50M - 100M+", paymentMethod: "Cash Buyer", buyingTimeline: "Immediate", sourceForm: "Modal Register Interest", stage: "Won", agentId: 1, daysAgo: 8, isSeen: true }
];

export const sampleLeads = rawLeadsData.map(item => {
  const { score, temperature } = calculateLeadScore(item);
  const now = new Date();
  const createdDate = new Date(now.getTime() - (item.daysAgo * 86400000));
  const lastActiveDate = new Date(now.getTime() - (item.daysAgo * 86400000) + 1200000);

  return {
    ref: item.ref,
    firstName: item.firstName,
    lastName: item.lastName,
    phone: item.phone,
    interestType: item.interestType,
    community: item.community,
    budget: item.budget,
    paymentMethod: item.paymentMethod,
    buyingTimeline: item.buyingTimeline,
    sourceForm: item.sourceForm,
    stage: item.stage,
    score: score,
    temperature: temperature,
    agentId: item.agentId,
    createdAt: createdDate.toISOString(),
    lastActivityAt: lastActiveDate.toISOString(),
    isSeen: item.isSeen
  };
});

export const sampleViewings = [
  { ref: "VW-2026-01", propertyId: 1, propertyTitle: "The Solitaire Sky Penthouse", clientName: "Lord Harrison Thorne", clientPhone: "+44 7700 900142", viewingDate: "2026-10-02", viewingTime: "11:00 AM", agentId: 2, status: "Scheduled", notes: "Client arriving via private car from Emirates Palace." },
  { ref: "VW-2026-02", propertyId: 2, propertyTitle: "The Palm Serenity Beachfront Villa", clientName: "Amira Al-Sabah", clientPhone: "+965 9912 3456", viewingDate: "2026-10-03", viewingTime: "04:30 PM", agentId: 2, status: "Scheduled", notes: "Wants full tour of beach cabana and sunset view." },
  { ref: "VW-2026-03", propertyId: 4, propertyTitle: "The Grand Boulevard Duplex", clientName: "Elena Rostova", clientPhone: "+971 50 821 9901", viewingDate: "2026-09-30", viewingTime: "06:00 PM", agentId: 3, status: "Completed", notes: "Very positive response to Burj Khalifa direct view. Requested draft SPA." },
  { ref: "VW-2026-04", propertyId: 7, propertyTitle: "One Marina Waterfront Duplex", clientName: "Jean-Paul Gault", clientPhone: "+377 93 123456", viewingDate: "2026-10-04", viewingTime: "02:00 PM", agentId: 1, status: "Scheduled", notes: "Checking superyacht berth depth and marine access." },
  { ref: "VW-2026-05", propertyId: 12, propertyTitle: "Fairway Modernist Mansion", clientName: "Fahad Al-Kuwari", clientPhone: "+974 5512 3456", viewingDate: "2026-10-01", viewingTime: "10:30 AM", agentId: 2, status: "Scheduled", notes: "Focus on golf course frontage and cinema room." },
  { ref: "VW-2026-06", propertyId: 3, propertyTitle: "Frond Vista Signature Mansion", clientName: "Sultan Al-Ghanim", clientPhone: "+968 9123 4567", viewingDate: "2026-10-05", viewingTime: "05:00 PM", agentId: 2, status: "Scheduled", notes: "Interested in frond security and turnkey furniture package." },
  { ref: "VW-2026-07", propertyId: 6, propertyTitle: "Burj Crown Corner Duplex", clientName: "Fatima Al-Bader", clientPhone: "+965 6612 3456", viewingDate: "2026-10-02", viewingTime: "03:00 PM", agentId: 3, status: "Scheduled", notes: "Looking for family holiday residence with opera view." },
  { ref: "VW-2026-08", propertyId: 1, propertyTitle: "The Solitaire Sky Penthouse", clientName: "Sven Lindqvist", clientPhone: "+46 70 123 4567", viewingDate: "2026-10-06", viewingTime: "12:00 PM", agentId: 1, status: "Scheduled", notes: "Client transferring from Stockholm; reviewing tax residence." },
  { ref: "VW-2026-09", propertyId: 8, propertyTitle: "Marina Promenade Sky Suite", clientName: "Olga Smirnova", clientPhone: "+971 52 777 6655", viewingDate: "2026-09-28", viewingTime: "01:00 PM", agentId: 1, status: "Completed", notes: "Reviewed rental contracts and tenant history." },
  { ref: "VW-2026-10", propertyId: 13, propertyTitle: "Park Ridge Contemporary Villa", clientName: "Victoria Romanova", clientPhone: "+971 50 333 4411", viewingDate: "2026-10-07", viewingTime: "11:30 AM", agentId: 2, status: "Scheduled", notes: "Evaluating proximity to King's College Hospital and schools." }
];

export const sampleSales = [
  {
    dealRef: "SL-DXB-901",
    propertyTitle: "The Palm Crescent Signature Villa",
    community: "Palm Jumeirah",
    salePriceAED: 74500000,
    buyerName: "Lord Harrison Thorne",
    sellerName: "Al-Qasimi Private Trust",
    agentId: 2,
    closingDate: "2026-08-15",
    dldTransferFeeAED: 2980000,
    commissionAED: 1490000
  },
  {
    dealRef: "SL-DXB-902",
    propertyTitle: "Downtown Opera Penthouse Duplex",
    community: "Downtown Dubai",
    salePriceAED: 31200000,
    buyerName: "David Rothschild",
    sellerName: "Helios Capital Holdings",
    agentId: 3,
    closingDate: "2026-07-22",
    dldTransferFeeAED: 1248000,
    commissionAED: 624000
  },
  {
    dealRef: "SL-DXB-903",
    propertyTitle: "Dubai Hills Championship Fairway Villa",
    community: "Dubai Hills Estate",
    salePriceAED: 42000000,
    buyerName: "William Harrington",
    sellerName: "Vance Heritage Fund",
    agentId: 2,
    closingDate: "2026-06-10",
    dldTransferFeeAED: 1680000,
    commissionAED: 840000
  },
  {
    dealRef: "SL-DXB-904",
    propertyTitle: "One Marina Horizon Duplex",
    community: "Dubai Marina",
    salePriceAED: 14800000,
    buyerName: "Maximilian Schreiber",
    sellerName: "Solitaire Asset Management",
    agentId: 1,
    closingDate: "2026-05-18",
    dldTransferFeeAED: 592000,
    commissionAED: 296000
  },
  {
    dealRef: "SL-DXB-905",
    propertyTitle: "Canal Waterfront Executive Suite",
    community: "Business Bay",
    salePriceAED: 17500000,
    buyerName: "Edward Beaumont",
    sellerName: "Elysian Private Equity",
    agentId: 3,
    closingDate: "2026-04-05",
    dldTransferFeeAED: 700000,
    commissionAED: 350000
  }
];

export const sampleNotes = [
  { leadRef: "PR-DXB-1001", agentId: 2, authorName: "Victoria Sterling", noteText: "Met with client representative at Bulgari Yacht Club. Client seeking 5+ bedroom villa on Palm Jumeirah with 120ft private beach. Wire ready.", createdAt: "2026-09-28T14:30:00Z" },
  { leadRef: "PR-DXB-1002", agentId: 3, authorName: "Alexander Vance", noteText: "Conducted initial zoom presentation of Downtown penthouses. Client submitted formal offer at AED 46,000,000. Seller reviewing.", createdAt: "2026-09-29T10:15:00Z" },
  { leadRef: "PR-DXB-1005", agentId: 1, authorName: "Tariq Al-Mansoor", noteText: "Sale successfully closed and registered with Dubai Land Department. 2% broker commission disbursed.", createdAt: "2026-09-25T16:00:00Z" }
];
