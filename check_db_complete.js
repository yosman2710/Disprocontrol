
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

async function check() {
    try {
        const envContent = fs.readFileSync('c:/Users/yosma/Proyectos/Disprocar/backendDisprocar/.env', 'utf8');
        const dbUrl = envContent.split('\n').find(line => line.startsWith('DB_URL=')).split('=')[1].trim();

        const pool = new Pool({ connectionString: dbUrl });

        console.log('--- TABLA tipos_corte ---');
        const resTipos = await pool.query('SELECT id, nombre, activo FROM tipos_corte');
        console.table(resTipos.rows);

        console.log('\n--- TABLA reses (ejemplo) ---');
        const resReses = await pool.query('SELECT id, numero, estado FROM reses LIMIT 5');
        console.table(resReses.rows);

        await pool.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
