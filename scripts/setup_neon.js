import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import {
  sampleDevelopers,
  sampleOffplanProjects,
  sampleProperties,
  sampleAgents,
  sampleStaffLogins,
  sampleLeads,
  sampleViewings,
  sampleSales,
  sampleNotes
} from '../server/seedData.js';

async function runSetup() {
  const dbUrl = process.env.DATABASE_URL?.trim();

  console.log('================================================================');
  console.log(' PR REAL ESTATE - NEON DATABASE INITIALIZER & SEEDER');
  console.log('================================================================\n');

  if (!dbUrl || dbUrl.includes('YOUR_PASSWORD_HERE') || !dbUrl.startsWith('postgres')) {
    console.error('❌ ERROR: No valid Neon DATABASE_URL found in .env');
    console.error('Please open .env in the project root and paste your connection link:');
    console.error('DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require\n');
    process.exit(1);
  }

  console.log('🔗 Connecting to Neon PostgreSQL at:');
  try {
    const parsed = new URL(dbUrl);
    console.log(`   Host: ${parsed.host}`);
    console.log(`   User: ${parsed.username}`);
    console.log(`   Database: ${parsed.pathname.replace('/', '')}\n`);
  } catch {
    console.log('   (Using configured DATABASE_URL)\n');
  }

  try {
    const sql = neon(dbUrl);
    const testRes = await sql`SELECT NOW() as current_time;`;
    console.log(`✅ Connection established! Server timestamp: ${testRes[0].current_time}\n`);

    console.log('🏗️  Creating database tables...');

    // 1. Developers
    await sql`
      CREATE TABLE IF NOT EXISTS developers (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL,
        country VARCHAR(100) DEFAULT 'United Arab Emirates',
        headquarters VARCHAR(150),
        established_year INT,
        description TEXT,
        logo_initials VARCHAR(10),
        total_projects INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Off-Plan Projects
    await sql`
      CREATE TABLE IF NOT EXISTS offplan_projects (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        developer_slug VARCHAR(100),
        developer_name VARCHAR(150),
        title VARCHAR(200) NOT NULL,
        community VARCHAR(100) NOT NULL,
        starting_price_aed BIGINT NOT NULL,
        handover_date VARCHAR(50) NOT NULL,
        payment_plan VARCHAR(100) NOT NULL,
        payment_plan_details JSONB,
        image VARCHAR(255),
        description TEXT,
        tagline VARCHAR(255),
        features JSONB,
        construction_status VARCHAR(100),
        total_units INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. Properties (15 Ready residences)
    await sql`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(200) NOT NULL,
        category VARCHAR(50) NOT NULL,
        community VARCHAR(100) NOT NULL,
        sub_community VARCHAR(100),
        price_aed BIGINT NOT NULL,
        bedrooms INT NOT NULL,
        bathrooms INT NOT NULL,
        built_up_area_sqft INT NOT NULL,
        furnishing VARCHAR(100),
        property_view VARCHAR(150),
        status VARCHAR(50) DEFAULT 'Ready to Move',
        image VARCHAR(255),
        gallery JSONB,
        description TEXT,
        features JSONB,
        agent_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Agents (3 licensed agents)
    await sql`
      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(150) NOT NULL,
        rera_number VARCHAR(50),
        phone VARCHAR(50),
        email VARCHAR(100),
        languages VARCHAR(150),
        photo VARCHAR(255),
        transactions_count INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 5. Staff Logins
    await sql`
      CREATE TABLE IF NOT EXISTS staff_logins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 6. Buyer Leads (40 sample leads)
    await sql`
      CREATE TABLE IF NOT EXISTS buyer_leads (
        id SERIAL PRIMARY KEY,
        reference_code VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        interest_type VARCHAR(100),
        preferred_community VARCHAR(100),
        budget_aed VARCHAR(100),
        source VARCHAR(100),
        status VARCHAR(50) DEFAULT 'New',
        assigned_agent_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 7. Viewings (10 viewings)
    await sql`
      CREATE TABLE IF NOT EXISTS viewings (
        id SERIAL PRIMARY KEY,
        reference_code VARCHAR(50) UNIQUE NOT NULL,
        property_id INT,
        property_title VARCHAR(200),
        client_name VARCHAR(150) NOT NULL,
        client_phone VARCHAR(50) NOT NULL,
        viewing_date DATE NOT NULL,
        viewing_time VARCHAR(50) NOT NULL,
        agent_id INT,
        status VARCHAR(50) DEFAULT 'Scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 8. Completed Sales (5 sales)
    await sql`
      CREATE TABLE IF NOT EXISTS completed_sales (
        id SERIAL PRIMARY KEY,
        deal_reference VARCHAR(50) UNIQUE NOT NULL,
        property_title VARCHAR(200) NOT NULL,
        community VARCHAR(100) NOT NULL,
        sale_price_aed BIGINT NOT NULL,
        buyer_name VARCHAR(150) NOT NULL,
        seller_name VARCHAR(150) NOT NULL,
        agent_id INT,
        closing_date DATE NOT NULL,
        dld_transfer_fee_aed BIGINT NOT NULL,
        commission_aed BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 9. Notes
    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        lead_id INT,
        agent_id INT,
        author_name VARCHAR(100),
        note_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('✅ Tables created successfully!\n');

    console.log('📦 Seeding sample data...');

    // Seed developers (5)
    for (const d of sampleDevelopers) {
      await sql`
        INSERT INTO developers (slug, name, country, headquarters, established_year, description, logo_initials, total_projects)
        VALUES (${d.slug}, ${d.name}, ${d.country}, ${d.headquarters}, ${d.establishedYear}, ${d.description}, ${d.logoInitials}, ${d.totalProjects})
        ON CONFLICT (slug) DO NOTHING;
      `;
    }
    console.log(`   ✓ 5 Developers seeded`);

    // Seed offplan projects (6)
    for (const p of sampleOffplanProjects) {
      await sql`
        INSERT INTO offplan_projects (slug, developer_slug, developer_name, title, community, starting_price_aed, handover_date, payment_plan, payment_plan_details, image, description, tagline, features, construction_status, total_units)
        VALUES (${p.slug}, ${p.developerSlug}, ${p.developerName}, ${p.title}, ${p.community}, ${p.startingPriceAED}, ${p.handoverDate}, ${p.paymentPlan}, ${JSON.stringify(p.paymentPlanDetails)}, ${p.image}, ${p.description}, ${p.tagline}, ${JSON.stringify(p.features)}, ${p.constructionStatus}, ${p.totalUnits})
        ON CONFLICT (slug) DO NOTHING;
      `;
    }
    console.log(`   ✓ 6 Off-Plan Projects seeded`);

    // Seed properties (15)
    for (const pr of sampleProperties) {
      await sql`
        INSERT INTO properties (slug, title, category, community, sub_community, price_aed, bedrooms, bathrooms, built_up_area_sqft, furnishing, property_view, status, image, gallery, description, features, agent_id)
        VALUES (${pr.slug}, ${pr.title}, ${pr.category}, ${pr.community}, ${pr.subCommunity}, ${pr.priceAED}, ${pr.bedrooms}, ${pr.bathrooms}, ${pr.builtUpAreaSqft}, ${pr.furnishing}, ${pr.view}, ${pr.status}, ${pr.image}, ${JSON.stringify(pr.gallery)}, ${pr.description}, ${JSON.stringify(pr.features)}, ${pr.agentId})
        ON CONFLICT (slug) DO NOTHING;
      `;
    }
    console.log(`   ✓ 15 Ready Properties seeded (Dubai Marina, Downtown, Palm Jumeirah, Business Bay, Dubai Hills, JVC)`);

    // Seed agents (3)
    for (const a of sampleAgents) {
      await sql`
        INSERT INTO agents (id, name, role, rera_number, phone, email, languages, photo, transactions_count)
        VALUES (${a.id}, ${a.name}, ${a.role}, ${a.reraNumber}, ${a.phone}, ${a.email}, ${a.languages}, ${a.photo}, ${a.transactionsCount})
        ON CONFLICT (id) DO NOTHING;
      `;
    }
    console.log(`   ✓ 3 Licensed Agents seeded`);

    // Seed staff logins (3)
    for (const s of sampleStaffLogins) {
      await sql`
        INSERT INTO staff_logins (id, username, email, password_hash, full_name, role)
        VALUES (${s.id}, ${s.username}, ${s.email}, ${s.passwordHash}, ${s.fullName}, ${s.role})
        ON CONFLICT (id) DO NOTHING;
      `;
    }
    console.log(`   ✓ 3 Staff Logins seeded`);

    // Seed leads (40)
    for (const l of sampleLeads) {
      await sql`
        INSERT INTO buyer_leads (reference_code, first_name, last_name, phone, interest_type, preferred_community, budget_aed, source, status, assigned_agent_id)
        VALUES (${l.ref}, ${l.firstName}, ${l.lastName}, ${l.phone}, ${l.interestType}, ${l.community}, ${l.budget}, ${l.source}, ${l.status}, ${l.agentId})
        ON CONFLICT (reference_code) DO NOTHING;
      `;
    }
    console.log(`   ✓ 40 Buyer Leads seeded`);

    // Seed viewings (10)
    for (const v of sampleViewings) {
      await sql`
        INSERT INTO viewings (reference_code, property_id, property_title, client_name, client_phone, viewing_date, viewing_time, agent_id, status, notes)
        VALUES (${v.ref}, ${v.propertyId}, ${v.propertyTitle}, ${v.clientName}, ${v.clientPhone}, ${v.viewingDate}, ${v.viewingTime}, ${v.agentId}, ${v.status}, ${v.notes})
        ON CONFLICT (reference_code) DO NOTHING;
      `;
    }
    console.log(`   ✓ 10 Viewings seeded`);

    // Seed sales (5)
    for (const s of sampleSales) {
      await sql`
        INSERT INTO completed_sales (deal_reference, property_title, community, sale_price_aed, buyer_name, seller_name, agent_id, closing_date, dld_transfer_fee_aed, commission_aed)
        VALUES (${s.dealRef}, ${s.propertyTitle}, ${s.community}, ${s.salePriceAED}, ${s.buyerName}, ${s.sellerName}, ${s.agentId}, ${s.closingDate}, ${s.dldTransferFeeAED}, ${s.commissionAED})
        ON CONFLICT (deal_reference) DO NOTHING;
      `;
    }
    console.log(`   ✓ 5 Completed Sales seeded`);

    // Seed notes
    for (const n of sampleNotes) {
      await sql`
        INSERT INTO notes (lead_id, agent_id, author_name, note_text)
        VALUES (${n.leadId}, ${n.agentId}, ${n.authorName}, ${n.noteText});
      `;
    }
    console.log(`   ✓ Consultation notes seeded\n`);

    console.log('================================================================');
    console.log(' 🎉 NEON DATABASE INITIALIZATION COMPLETED SUCCESSFULLY!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Database initialization error:', err);
    process.exit(1);
  }
}

runSetup();
