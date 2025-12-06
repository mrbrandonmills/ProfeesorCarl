#!/usr/bin/env node

/**
 * Database Migration Script
 * Applies the lesson-plan-schema.sql to Neon Postgres database
 *
 * Usage: node scripts/migrate-schema.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  // Get database URL from environment
  const databaseUrl = process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: POSTGRES_URL or POSTGRES_DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  console.log('📊 Database:', databaseUrl.split('@')[1]?.split('/')[0] || 'unknown');

  // Read the schema SQL file
  const schemaPath = path.join(__dirname, '../supabase/lesson-plan-schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Error: Schema file not found at:', schemaPath);
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  console.log('📄 Loaded schema file:', schemaPath);
  console.log('📝 SQL statements:', schemaSql.split(';').filter(s => s.trim()).length, '\n');

  // Connect to database
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Neon requires SSL
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    console.log('🏗️  Executing schema SQL...');
    await client.query(schemaSql);
    console.log('✅ Schema applied successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📋 Tables in database:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Database is ready for Professor Carl lesson plan system.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run migration
runMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
