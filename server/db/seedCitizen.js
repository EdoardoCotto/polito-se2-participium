const sqlite = require('sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

// Percorso al database esistente (stesso del tuo init script)
const dbPath = path.join(__dirname, 'participium.db');

const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw err;
  console.log('✅ Connesso al DB:', dbPath);
});

db.run("DELETE FROM Users WHERE type = 'citizen'", (err) => {
  if (err) console.error('Errore cancellando utenti esistenti:', err.message);
});
const citizens = [
  { username: 'citizen1', email: 'citizen1@example.org', name: 'Luigi', surname: 'Verdi' },
  { username: 'citizen2', email: 'citizen2@example.org', name: 'Maria', surname: 'Bianchi' },
  { username: 'citizen3', email: 'citizen3@example.org', name: 'Carlo', surname: 'Neri' },
];

const password = 'test123';
const saltRounds = 10;

(async () => {
  for (const c of citizens) {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);

    db.run(
      `INSERT INTO Users (username, email, name, surname, type, password, salt)
       VALUES (?, ?, ?, ?, 'admin', ?, ?)`,
      [c.username, c.email, c.name, c.surname, hash, salt],
      (err) => {
        if (err) console.error(`Errore inserendo ${c.username}:`, err.message);
        else console.log(`✅ Inserito ${c.username} con password "${password}"`);
      }
    );
  }

  db.close(() => console.log("🔒 Database chiuso."));
})();
