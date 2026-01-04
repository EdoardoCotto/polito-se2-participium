import sqlite from 'sqlite3';

import bcrypt from 'bcrypt';

//import path from 'node:path';
import path from 'path';
import { fileURLToPath } from 'url'; // <-- NUOVA IMPORTAZIONE
import { dirname } from 'path';


// const sqlite = require('sqlite3').verbose();
// const bcrypt = require('bcrypt');
// const path = require('node:path');

// Percorso al database
// Definisci __filename e __dirname per compatibilità con gli ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // <-- QUESTO SOSTITUISCE L'USO DIRETTO DI __dirname
const dbPath = path.join(__dirname, 'participium.db'); // Ora __dirname è definito
// Connessione al DB
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw err;
  console.log('✅ Connesso al DB:', dbPath);
});

// --- 1. DATI UTENTI DA INSERIRE ---
const workers = [
  // CITTADINI E ADMIN
  { username: 'citizen', email: 'citizen@participium.test', name: 'Davide', surname: 'Idini', roles: ['citizen'] },
  { username: 'admin_main', email: 'admin@participium.test', name: 'Super', surname: 'Admin', roles: ['admin'] },
  { username: 'pr_officer1', email: 'pr@comune.test.it', name: 'Sara', surname: 'Comunicazione', roles: ['municipal_public_relations_officer'] },
  // TECNICI
  { username: 'urban_planner1', email: 'planner@comune.test.it', name: 'Giulia', surname: 'Rossi', roles: ['urban_planner'] },
  { username: 'urban_planner2', email: 'planner2@comune.test.it', name: 'Luca', surname: 'Rossi', roles: ['urban_planner'] },
  { username: 'civil_eng1', email: 'works@comune.test.it', name: 'Marco', surname: 'Gialli', roles: ['public_works_engineer'] },
  { username: 'env_tech1', email: 'env@comune.test.it', name: 'Elena', surname: 'Verdi', roles: ['environment_technician'] },
  { username: 'traffic_eng1', email: 'traffic@comune.test.it', name: 'Roberto', surname: 'Neri', roles: ['mobility_traffic_engineer'] },
  { username: 'inspector1', email: 'inspector@comune.test.it', name: 'Anna', surname: 'Viola', roles: ['building_inspector'] },
  // MANUTENTORI ESTERNI
  { username: 'ext_maint1', email: 'maint1@external.com', name: 'Paolo', surname: 'Bianchi', roles: ['external_maintainer'] },
  { username: 'ext_maint2', email: 'maint2@external.com', name: 'Francesca', surname: 'Russo', roles: ['external_maintainer'] },
  // UTENTI CON RUOLI MULTIPLI
  { username: 'multi_tech1', email: 'multi1@comune.test.it', name: 'Mario', surname: 'Multiruolo', roles: ['urban_planner', 'public_works_engineer'] },
  { username: 'multi_tech2', email: 'multi2@comune.test.it', name: 'Laura', surname: 'Polivalente', roles: ['environment_technician', 'mobility_traffic_engineer'] },
  { username: 'multi_tech3', email: 'multi3@comune.test.it', name: 'Giorgio', surname: 'Tuttofare', roles: ['building_inspector', 'public_works_engineer', 'urban_planner'] },
  { username: 'super_tech', email: 'supertech@comune.test.it', name: 'Alessandro', surname: 'Onnisciente', roles: ['urban_planner', 'public_works_engineer', 'environment_technician', 'mobility_traffic_engineer'] }
];

// --- 2. DATI REPORT DA INSERIRE ---
// Nota: Le categorie devono combaciare ESATTAMENTE con il CHECK constraint dello schema SQL
const reports = [
  {
    title: 'Weed too high on sidewalk',
    description: 'Weed too high on sidewalk',
    category: 'Roads and Urban Furnishings',
    latitude: 45.06495,
    longitude: 7.65922,
    image_path1: 'uploads/ErbaAlta.jpg',
    status: 'pending',
    author_username: 'citizen' // Riferimento allo username sopra
  },
  {
    title: 'Baby Park damaged',
    description: 'The park was damaged and some lights are not working.',
    category: 'Public Lighting',
    latitude: 45.0538,
    longitude: 7.6835,
    image_path1: 'static/uploads/parcoGiochiAbbandonato.jpg',
    status: 'pending',
    author_username: 'citizen'
  },
  {
    title: 'Rifiuti abbandonati in Piazza Castello',
    description: 'Accumulo di sacchi neri non ritirati vicino alla fermata del tram.',
    category: 'Waste',
    latitude: 45.0709,
    longitude: 7.6857,
    image_path1: 'static/uploads/Fontanella.jpg',
    status: 'pending', 
    author_username: 'citizen'
  },
  {
    title: 'Weed too high on sidewalk',
    description: 'Weed too high on sidewalk',
    category: 'Architectural Barriers',
    latitude: 45.0621,
    longitude: 7.661,
    image_path1: '/static/uploads/ErbaAlta.jpg',
    status: 'pending',
    author_username: 'citizen'
  },
   // 🔴 REPORT DI TEST IN VIA ROMA
  {
    title: 'Lampione rotto in Via Roma',
    description: 'Lampione non funzionante davanti a un negozio in Via Roma.',
    category: 'Public Lighting',
    latitude: 45.0653,
    longitude: 7.6809,
    image_path1: 'static/uploads/lampione_rotto.jpg',
    status: 'assigned',
    author_username: 'citizen'
  }
];

// --- HELPER PER PROMISE ---
// Trasforma db.run (che usa callback) in una Promise per poter usare async/await
function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this); // 'this' contiene lastID e changes
    });
  });
}

// --- LOGICA PRINCIPALE ---
(async () => {
  try {
    console.log("🚀 Inizio procedura di seeding...");

    // A. PULIZIA
    // Cancelliamo prima i figli (Reports) per non violare foreign key, poi i padri (Users)
    console.log("🧹 Pulizia vecchi dati...");
    try {
        await runQuery(`DELETE FROM Reports`);
        await runQuery(`DELETE FROM Users`);
        // Reset autoincrement ID a 1
        await runQuery(`DELETE FROM sqlite_sequence WHERE name='Users' OR name='Reports'`);
    } catch {
        // Ignore errors: tables may be empty or non-existent on first run
        // This is expected behavior, so we continue with seeding
        console.log("   Info: Tabelle forse vuote o non esistenti, proseguo.");
    }

    // B. INSERIMENTO UTENTI
    console.log("👥 Inserimento utenti...");
    
    const testCredential = process.env.SEED_PASSWORD || 'test1234';
    const saltRounds = 10;
    
    const userMap = {}; 

    for (const w of workers) {
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(testCredential, salt);

      const result = await runQuery(
        `INSERT INTO Users (username, email, name, surname, password, salt, is_confirmed)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [w.username, w.email, w.name, w.surname, hash, salt, 1]
      );
      
      const userId = result.lastID;
      userMap[w.username] = userId;
      
      // Inserisci tutti i ruoli nella tabella UsersRoles
      for (const role of w.roles) {
        await runQuery(
          `INSERT INTO UsersRoles (userId, type) VALUES (?, ?)`,
          [userId, role]
        );
      }
      
      console.log(`   ✅ Utente inserito: ${w.username} (ID: ${userId}) con ruoli: ${w.roles.join(', ')}`);
    }

    // C. INSERIMENTO REPORT
    console.log("📝 Inserimento report...");
    
    for (const r of reports) {
      // Troviamo l'ID dell'utente autore usando la mappa creata prima
      const userId = userMap[r.author_username];
      
      if (!userId) {
        console.warn(`   ⚠️ Saltato report "${r.title}": Utente ${r.author_username} non trovato.`);
        continue;
      }

      await runQuery(
        `INSERT INTO Reports (
            userId, title, description, category, 
            latitude, longitude, image_path1, status, technical_office
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId, r.title, r.description, r.category, 
            r.latitude, r.longitude, r.image_path1, r.status, r.technical_office
        ]
      );
      console.log(`   ✅ Report creato: "${r.title}" (Autore ID: ${userId})`);
    }

    console.log("🎉 Seeding completato con successo!");

  } catch (error) {
    console.error("❌ Errore critico durante il seeding:", error);
  } finally {
    db.close(() => console.log("🔒 Database chiuso."));
  }
})();