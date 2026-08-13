const { Pool } = require('pg');
const conn = process.env.DATABASE_URL || 'postgres://pguser:pgpassword@localhost:5432/vinitvers';
const pool = new Pool({ connectionString: conn });
module.exports = pool;
