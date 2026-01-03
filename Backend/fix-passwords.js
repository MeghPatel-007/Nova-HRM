const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixPasswords() {
  const client = await pool.connect();

  try {
    console.log('🔄 Checking and fixing user passwords...\n');

    // Check current users
    const users = await client.query('SELECT id, email, role FROM users');
    console.log('Current users in database:');
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    console.log();

    // Update passwords
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('🔄 Updating passwords...\n');

    // Update HR user
    const hrResult = await client.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING email, role',
      [hashedPassword, 'hr@dayflow.com']
    );
    if (hrResult.rows.length > 0) {
      console.log(`✅ Updated HR user: ${hrResult.rows[0].email}`);
    }

    // Update Employee user
    const empResult = await client.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING email, role',
      [hashedPassword, 'emp@dayflow.com']
    );
    if (empResult.rows.length > 0) {
      console.log(`✅ Updated Employee user: ${empResult.rows[0].email}`);
    }

    console.log('\n🎉 Password update complete!');
    console.log('\nTest credentials:');
    console.log('HR:       hr@dayflow.com / password123');
    console.log('Employee: emp@dayflow.com / password123');

  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixPasswords();
