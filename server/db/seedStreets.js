const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = './participium.db';
const CITY_NAME = 'Torino';

const db = new sqlite3.Database(DB_PATH);

// Ripristiniamo la funzione o assicuriamoci che non venga chiamata se la tabella esiste già
async function setupDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS Streets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    city TEXT NOT NULL,
                    street_name TEXT NOT NULL,
                    latitude REAL,
                    longitude REAL,
                    min_lat REAL,
                    max_lat REAL,
                    min_lon REAL,
                    max_lon REAL,
                    UNIQUE(city, street_name)
                )
            `, (err) => err ? reject(err) : resolve());
        });
    });
}

async function fetchStreetsFromOSM(city) {
    console.log(`Recupero delle vie per: ${city}... (Potrebbe richiedere un minuto)`);
    
    // Aumentiamo il timeout a 180 secondi nella query e specifichiamo meglio i tag
    const overpassQuery = `
        [out:json][timeout:180];
        area[name="${city}"][admin_level=8]->.a;
        (
          way["highway"]["name"](area.a);
        );
        out tags;
    `;
    
    const url = `https://overpass-api.de/api/interpreter`;

    try {
        const response = await axios({
            method: 'post', // Usiamo POST invece di GET per query lunghe
            url: url,
            data: `data=${encodeURIComponent(overpassQuery)}`,
            timeout: 200000, // Timeout di Axios (200 secondi)
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const elements = response.data?.elements || [];
        const streetNames = new Set();
        elements.forEach(el => {
            if (el.tags?.name) {
                streetNames.add(el.tags.name);
            }
        });

        return Array.from(streetNames).sort((a, b) => a.localeCompare(b));
    } catch (error) {
        if (error.response?.status === 504) {
            console.error("Il server Overpass è sovraccarico (504). Riprova tra qualche minuto.");
        } else {
            console.error("Errore durante il fetch:", error.message);
        }
        return [];
    }
}

async function saveStreetsToDb(city, streets) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("INSERT OR IGNORE INTO Streets (city, street_name) VALUES (?, ?)");
        
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            streets.forEach(street => stmt.run(city, street));
            db.run("COMMIT", (err) => {
                if (err) reject(err);
                else {
                    console.log(`✅ Successo! Inserite ${streets.length} vie.`);
                    resolve();
                }
            });
        });
        stmt.finalize();
    });
}

async function main() {
    try {
        // Se la tabella la crei manualmente da schema.sql, 
        // puoi commentare questa riga MA assicurati che non sia chiamata sotto
        await setupDatabase(); 
        
        const streets = await fetchStreetsFromOSM(CITY_NAME);
        
        if (streets.length > 0) {
            await saveStreetsToDb(CITY_NAME, streets);
        }
    } catch (err) {
        console.error("Errore nel processo:", err);
    } finally {
        db.close();
    }
}

main();