const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔄 Initializing database...');

    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255),
        department VARCHAR(255),
        designation VARCHAR(255),
        join_date DATE,
        office_start_time TIME DEFAULT '09:00:00',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        date DATE NOT NULL,
        login_time TIME,
        logout_time TIME,
        status VARCHAR(50) DEFAULT 'Absent',
        is_late BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_balance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        annual_leave INTEGER DEFAULT 20,
        medical_leave INTEGER DEFAULT 10,
        casual_leave INTEGER DEFAULT 5,
        used_annual INTEGER DEFAULT 0,
        used_medical INTEGER DEFAULT 0,
        used_casual INTEGER DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS salary (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        basic_salary DECIMAL(10, 2),
        net_salary DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        title VARCHAR(255),
        description TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        month VARCHAR(50),
        score DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        type VARCHAR(50),
        start_date DATE,
        end_date DATE,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tables created successfully');

    // Create test users
    const hashedPasswordHR = await bcrypt.hash('password123', 10);
    const hashedPasswordEmp = await bcrypt.hash('password123', 10);

    // Check if HR user exists
    const hrExists = await client.query('SELECT * FROM users WHERE email = $1', ['hr@dayflow.com']);
    if (hrExists.rows.length === 0) {
      const hrUser = await client.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
        ['hr@dayflow.com', hashedPasswordHR, 'HR']
      );
      
      await client.query(
        'INSERT INTO employees (user_id, name, department, designation, join_date) VALUES ($1, $2, $3, $4, $5)',
        [hrUser.rows[0].id, 'HR Manager', 'Human Resources', 'HR Manager', new Date().toISOString().split('T')[0]]
      );
      console.log('✅ HR user created: hr@dayflow.com / password123');
    } else {
      console.log('⚠️  HR user already exists');
    }

    // Check if Employee user exists
    const empExists = await client.query('SELECT * FROM users WHERE email = $1', ['emp@dayflow.com']);
    if (empExists.rows.length === 0) {
      const empUser = await client.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
        ['emp@dayflow.com', hashedPasswordEmp, 'Employee']
      );
      
      const empResult = await client.query(
        'INSERT INTO employees (user_id, name, department, designation, join_date) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [empUser.rows[0].id, 'John Doe', 'Engineering', 'Software Engineer', new Date().toISOString().split('T')[0]]
      );

      // Initialize leave balance for employee
      await client.query(
        'INSERT INTO leave_balance (employee_id) VALUES ($1)',
        [empResult.rows[0].id]
      );

      // Initialize salary for employee
      await client.query(
        'INSERT INTO salary (employee_id, basic_salary, net_salary) VALUES ($1, $2, $3)',
        [empResult.rows[0].id, 50000, 50000]
      );

      console.log('✅ Employee user created: emp@dayflow.com / password123');
    } else {
      console.log('⚠️  Employee user already exists');
    }

    console.log('\n🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();
