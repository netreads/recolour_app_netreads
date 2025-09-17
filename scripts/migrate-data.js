#!/usr/bin/env node

/**
 * Data Migration Script: SQLite to PostgreSQL
 * 
 * This script helps migrate existing data from SQLite (dev.db) to PostgreSQL via Prisma.
 * Run this after setting up your Neon database and running the Prisma migrations.
 */

const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');

// Initialize clients
const sqliteDb = new Database('./dev.db');
const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Starting data migration from SQLite to PostgreSQL...\n');

  try {
    // Migrate Users
    console.log('📝 Migrating users...');
    const users = sqliteDb.prepare('SELECT * FROM user').all();
    console.log(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      try {
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: Boolean(user.emailVerified),
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
        });
        console.log(`✅ Migrated user: ${user.email}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  User ${user.email} already exists, skipping...`);
        } else {
          console.error(`❌ Error migrating user ${user.email}:`, error.message);
        }
      }
    }

    // Migrate Sessions
    console.log('\n📝 Migrating sessions...');
    const sessions = sqliteDb.prepare('SELECT * FROM session').all();
    console.log(`Found ${sessions.length} sessions to migrate`);
    
    for (const session of sessions) {
      try {
        await prisma.session.create({
          data: {
            id: session.id,
            userId: session.userId,
            expiresAt: new Date(session.expiresAt),
            token: session.token,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
          },
        });
        console.log(`✅ Migrated session: ${session.id}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Session ${session.id} already exists, skipping...`);
        } else {
          console.error(`❌ Error migrating session ${session.id}:`, error.message);
        }
      }
    }

    // Migrate Accounts
    console.log('\n📝 Migrating accounts...');
    const accounts = sqliteDb.prepare('SELECT * FROM account').all();
    console.log(`Found ${accounts.length} accounts to migrate`);
    
    for (const account of accounts) {
      try {
        await prisma.account.create({
          data: {
            id: account.id,
            userId: account.userId,
            accountId: account.accountId,
            providerId: account.providerId,
            accessToken: account.accessToken,
            refreshToken: account.refreshToken,
            idToken: account.idToken,
            accessTokenExpiresAt: account.accessTokenExpiresAt ? new Date(account.accessTokenExpiresAt) : null,
            refreshTokenExpiresAt: account.refreshTokenExpiresAt ? new Date(account.refreshTokenExpiresAt) : null,
            scope: account.scope,
            password: account.password,
            createdAt: new Date(account.createdAt),
            updatedAt: new Date(account.updatedAt),
          },
        });
        console.log(`✅ Migrated account: ${account.id}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Account ${account.id} already exists, skipping...`);
        } else {
          console.error(`❌ Error migrating account ${account.id}:`, error.message);
        }
      }
    }

    // Migrate Verifications
    console.log('\n📝 Migrating verifications...');
    const verifications = sqliteDb.prepare('SELECT * FROM verification').all();
    console.log(`Found ${verifications.length} verifications to migrate`);
    
    for (const verification of verifications) {
      try {
        await prisma.verification.create({
          data: {
            id: verification.id,
            identifier: verification.identifier,
            value: verification.value,
            expiresAt: new Date(verification.expiresAt),
            createdAt: new Date(verification.createdAt),
            updatedAt: new Date(verification.updatedAt),
          },
        });
        console.log(`✅ Migrated verification: ${verification.id}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Verification ${verification.id} already exists, skipping...`);
        } else {
          console.error(`❌ Error migrating verification ${verification.id}:`, error.message);
        }
      }
    }

    // Migrate Jobs
    console.log('\n📝 Migrating jobs...');
    const jobs = sqliteDb.prepare('SELECT * FROM jobs').all();
    console.log(`Found ${jobs.length} jobs to migrate`);
    
    for (const job of jobs) {
      try {
        // Convert status to uppercase
        const statusMap = {
          'pending': 'PENDING',
          'processing': 'PROCESSING',
          'done': 'DONE',
          'failed': 'FAILED'
        };
        
        await prisma.job.create({
          data: {
            id: job.id,
            userId: job.user_id,
            originalUrl: job.original_url,
            outputUrl: job.output_url,
            status: statusMap[job.status] || 'PENDING',
            createdAt: new Date(job.created_at),
          },
        });
        console.log(`✅ Migrated job: ${job.id}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Job ${job.id} already exists, skipping...`);
        } else {
          console.error(`❌ Error migrating job ${job.id}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Data migration completed successfully!');
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Sessions: ${sessions.length}`);
    console.log(`- Accounts: ${accounts.length}`);
    console.log(`- Verifications: ${verifications.length}`);
    console.log(`- Jobs: ${jobs.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    sqliteDb.close();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateData().catch(console.error);
}

module.exports = { migrateData };
