const sqlite = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Percorso al database
const dbPath = path.join(__dirname, 'participium.db');

// Connessione al DB
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw err;
  console.log('✅ Connesso al DB:', dbPath);
});

// --- 1. DATI UTENTI DA INSERIRE ---
const workers = [
  // CITTADINI E ADMIN
  { username: 'citizen', email: 'citizen@participium.test', name: 'Davide', surname: 'Idini', type: 'citizen' },
  { username: 'admin_main', email: 'admin@participium.test', name: 'Super', surname: 'Admin', type: 'admin' },
  { username: 'pr_officer1', email: 'pr@comune.test.it', name: 'Sara', surname: 'Comunicazione', type: 'municipal_public_relations_officer' },
  // TECNICI
  { username: 'urban_planner1', email: 'planner@comune.test.it', name: 'Giulia', surname: 'Rossi', type: 'urban_planner' },
  { username: 'urban_planner2', email: 'planner2@comune.test.it', name: 'Luca', surname: 'Rossi', type: 'urban_planner' },
  { username: 'civil_eng1', email: 'works@comune.test.it', name: 'Marco', surname: 'Gialli', type: 'public_works_engineer' },
  { username: 'env_tech1', email: 'env@comune.test.it', name: 'Elena', surname: 'Verdi', type: 'environment_technician' },
  { username: 'traffic_eng1', email: 'traffic@comune.test.it', name: 'Roberto', surname: 'Neri', type: 'mobility_traffic_engineer' },
  { username: 'inspector1', email: 'inspector@comune.test.it', name: 'Anna', surname: 'Viola', type: 'building_inspector' }
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
    latitude: 45.05380,
    longitude: 7.6835,
    image_path1: 'static/uploads/parcoGiochiAbbandonato.jpg',
    status: 'pending',
    author_username: 'citizen'
  },
  {
    title: 'Rifiuti abbandonati in Piazza Castello',
    description: 'Accumulo di sacchi neri non ritirati vicino alla fermata del tram.',
    category: 'Waste',
    latitude: 45.07090,
    longitude: 7.68570,
    image_path1: 'static/uploads/Fontanella.jpg',
    status: 'pending', 
    author_username: 'citizen'
  },
  {
    title: 'Weed too high on sidewalk',
    description: 'Weed too high on sidewalk',
    category: 'Architectural Barriers',
    latitude: 45.06210,
    longitude: 7.66100,
    image_path1: '/static/uploads/ErbaAlta.jpg',
    status: 'pending',
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
    } catch (e) {
        console.log("   Info: Tabelle forse vuote o non esistenti, proseguo.");
    }

    // B. INSERIMENTO UTENTI
    console.log("👥 Inserimento utenti...");
    const password = 'test1234';
    const saltRounds = 10;
    
    // Mappa per salvare la corrispondenza: username -> ID reale nel DB
    const userMap = {}; 

    for (const w of workers) {
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);

      const result = await runQuery(
        `INSERT INTO Users (username, email, name, surname, type, password, salt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [w.username, w.email, w.name, w.surname, w.type, hash, salt]
      );
      
      // Salviamo l'ID generato
      userMap[w.username] = result.lastID;
      console.log(`   ✅ Utente inserito: ${w.username} (ID: ${result.lastID})`);
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