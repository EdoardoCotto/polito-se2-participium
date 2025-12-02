"use strict";

const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');

// Definisci la cartella di destinazione per gli upload
// usiamo path.join per creare un percorso assoluto partendo dalla root del progetto
const uploadDir = path.join(__dirname, '..', 'static', 'uploads');

const profileDir = path.join(__dirname, '..', 'static', 'avatars');

// Assicurati che la cartella di destinazione esista
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

// Configura lo 'storage' di Multer
const storage = multer.diskStorage({
  // Dove salvare i file
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  // Come nominare i file per evitare collisioni
  filename: function (req, file, cb) {
    // Crea un nome univoco: es. 'photos-1678886400000-logo.png'
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const profileStorage = multer.diskStorage({
  // Dove salvare i file
  destination: function (req, file, cb) {
    cb(null, profileDir);
  },
  // Come nominare i file per evitare collisioni
  filename: function (req, file, cb) {
    // Crea un nome univoco: es. 'profiles-1678886400000-logo.png'
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Opzioni di Multer (es. filtri per tipo di file, se necessario)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Accetta il file
  } else {
    cb(new Error('Invalid file type, only images are allowed!'), false); // Rifiuta il file
  }
};

// Inizializza multer con la configurazione
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // Limite di 5MB per file
});

const updateProfile = multer({ 
  storage: profileStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // Limite di 5MB per file
}).single('personal_photo_path');

// Esporta il middleware
// .array('photos', 3) significa:
// - Cerca i file nel campo 'photos' del FormData
// - Accetta un massimo di 3 file
module.exports = upload.array('photos', 3);

module.exports.updateProfile = updateProfile;