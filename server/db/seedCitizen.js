const sqlite = require('sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

// Percorso al database
const dbPath = path.join(__dirname, 'participium.db');

const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw err;
  console.log('✅ Connesso al DB:', dbPath);
});

// Lista utenti da inserire
const workers = [
  // --- NUOVI AGGIUNTI ---
  { 
    username: 'admin_main', 
    email: 'admin@participium.test', 
    name: 'Super', 
    surname: 'Admin', 
    type: 'admin' 
  },
  { 
    username: 'pr_officer1', 
    email: 'pr@comune.test.it', 
    name: 'Sara', 
    surname: 'Comunicazione', 
    type: 'municipal_public_relations_officer' 
  },
  // --- LAVORATORI PRECEDENTI ---
  { 
    username: 'urban_planner1', 
    email: 'planner@comune.test.it', 
    name: 'Giulia', 
    surname: 'Rossi', 
    type: 'urban_planner' 
  },
  { 
    username: 'civil_eng1', 
    email: 'works@comune.test.it', 
    name: 'Marco', 
    surname: 'Gialli', 
    type: 'public_works_engineer' 
  },
  { 
    username: 'env_tech1', 
    email: 'env@comune.test.it', 
    name: 'Elena', 
    surname: 'Verdi', 
    type: 'environment_technician' 
  },
  { 
    username: 'traffic_eng1', 
    email: 'traffic@comune.test.it', 
    name: 'Roberto', 
    surname: 'Neri', 
    type: 'mobility_traffic_engineer' 
  },
  { 
    username: 'inspector1', 
    email: 'inspector@comune.test.it', 
    name: 'Anna', 
    surname: 'Viola', 
    type: 'building_inspector' 
  }
];

// Preparazione per la pulizia dei vecchi dati (per evitare errori di "Unique constraint")
const placeholders = workers.map(() => '?').join(',');
const usernamesToDelete = workers.map(w => w.username);

// Cancellazione preventiva
db.run(`DELETE FROM Users WHERE username IN (${placeholders})`, usernamesToDelete, (err) => {
  if (err) console.error('Errore cancellando utenti esistenti:', err.message);
  else console.log('🧹 Pulizia utenti completata (se esistevano).');
});

const password = 'test1234'; 
const saltRounds = 10;

(async () => {
  let completed = 0;

  for (const w of workers) {
    try {
      // Generazione Hash e Salt reali
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);

      db.run(
        `INSERT INTO Users (username, email, name, surname, type, password, salt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [w.username, w.email, w.name, w.surname, w.type, hash, salt],
        function(err) {
          if (err) {
            console.error(`❌ Errore inserendo ${w.username}:`, err.message);
          } else {
            console.log(`✅ Inserito ${w.username} [Ruolo: ${w.type}]`);
          }
          
          // Contatore per chiudere il DB alla fine
          completed++;
          if (completed === workers.length) {
             db.close(() => console.log("🔒 Database chiuso."));
          }
        }
      );
    } catch (error) {
      console.error("Errore critico:", error);
    }
  }
})();