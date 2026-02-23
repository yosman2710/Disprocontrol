
const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');

const envContent = fs.readFileSync('c:/Users/yosma/Proyectos/Disprocar/backendDisprocar/.env', 'utf8');
const dbUrl = envContent.split('\n').find(line => line.startsWith('DB_URL=')).split('=')[1].trim();

const pool = new Pool({
    connectionString: dbUrl,
});

async function verify() {
    try {
        console.log('Querying cortes_extraidos...');
        const cutsRes = await pool.query(`
            SELECT ce.*, tc.nombre as tipo_nombre 
            FROM cortes_extraidos ce 
            JOIN tipos_corte tc ON ce.tipo_corte_id = tc.id 
            ORDER BY ce.id DESC LIMIT 5
        `);
        console.log('\nÚltimos cortes registrados:');
        console.table(cutsRes.rows);

        const resesRes = await pool.query(`
            SELECT id, numero, estado 
            FROM reses 
            WHERE estado = 'completado' 
            ORDER BY id DESC LIMIT 5
        `);
        console.log('\nÚltimas reses completadas:');
        console.table(resesRes.rows);

    } catch (err) {
        console.error('Error verifying database:', err);
    } finally {
        await pool.end();
    }
}

verify();
