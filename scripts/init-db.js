#!/usr/bin/env node

/**
 * Database initialization script for development
 * This script creates the local SQLite database and runs migrations
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
const migrationsDir = path.join(__dirname, '../migrations');

console.log('🗄️  Initializing database...');

// Create database if it doesn't exist
const db = new Database(dbPath);

// Read and run migrations
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

console.log(`📁 Found ${migrationFiles.length} migration files`);

for (const file of migrationFiles) {
  console.log(`🔄 Running migration: ${file}`);
  const migrationPath = path.join(migrationsDir, file);
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    db.exec(migrationSQL);
    console.log(`✅ Migration ${file} completed`);
  } catch (error) {
    console.error(`❌ Error running migration ${file}:`, error.message);
    process.exit(1);
  }
}

db.close();

console.log('🎉 Database initialization completed!');
console.log(`📍 Database location: ${path.resolve(dbPath)}`);
