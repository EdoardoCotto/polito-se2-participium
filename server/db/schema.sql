-- SQLite Schema for Participium
-- Database for citizen participation management system

-- Drop existing tables (in reverse order of dependencies due to foreign keys)
DROP TABLE IF EXISTS InternalComments;
DROP TABLE IF EXISTS Reports;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Streets;
DROP TABLE IF EXISTS UsersRoles;

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  personal_photo_path TEXT,
  telegram_nickname TEXT,
  mail_notifications INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL DEFAULT 'citizen',
  password TEXT NOT NULL,
  salt TEXT NOT NULL,
  is_confirmed INTEGER NOT NULL DEFAULT 0,
  confirmation_code TEXT,
  confirmation_code_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK(type IN ('admin', 'citizen', 'municipality_user'))
);

-- Create Reports table
CREATE TABLE IF NOT EXISTS Reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  officerId INTEGER,
  external_maintainerId INTEGER,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_path1 TEXT NOT NULL,
  image_path2 TEXT,
  image_path3 TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  technical_office TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (officerId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (external_maintainerId) REFERENCES Users(id) ON DELETE CASCADE,
  CHECK(status IN ('pending', 'assigned', 'rejected', 'progress', 'suspended', 'resolved')),
  CHECK(category IN (
    'Water Supply - Drinking Water',
    'Architectural Barriers',
    'Sewer System',
    'Public Lighting',
    'Waste',
    'Road Signs and Traffic Lights',
    'Roads and Urban Furnishings',
    'Public Green Areas and Playgrounds',
    'Other'
  )),
  CHECK(technical_office IN (
    'municipal_public_relations_officer',
    'municipal_administrator',
    'urban_planner',
    'building_permit_officer',
    'building_inspector',
    'suap_officer',
    'public_works_engineer',
    'mobility_traffic_engineer',
    'environment_technician',
    'technical_office_staff_member',
    'external_office'
  ))
);

-- Table for internal comments on reports (invisible for citizens)
CREATE TABLE IF NOT EXISTS InternalComments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reportId INTEGER NOT NULL,
  authorId INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reportId) REFERENCES Reports(id) ON DELETE CASCADE,
  FOREIGN KEY (authorId) REFERENCES Users(id)
);

--Table for messages between users and officers
CREATE TABLE IF NOT EXISTS Messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reportId INTEGER NOT NULL,
  senderId INTEGER NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reportId) REFERENCES Reports(id) ON DELETE CASCADE,
  FOREIGN KEY (senderId) REFERENCES Users(id)
);

-- Tabella per l'autocompletamento e la cache geografica delle vie
CREATE TABLE IF NOT EXISTS Streets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL,
  street_name TEXT NOT NULL,
  
  -- Coordinate centrali (utili per la ricerca a raggio)
  latitude REAL,
  longitude REAL,
  
  -- Confini dell'area (fondamentali per lo ZOOM richiesto dal PO)
  min_lat REAL,
  max_lat REAL,
  min_lon REAL,
  max_lon REAL,
  -- geometria via formato json
  geometry TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Evita duplicati della stessa via nella stessa città
  UNIQUE(city, street_name)
);

CREATE TABLE IF NOT EXISTS UsersRoles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  CHECK(role IN (
    'municipal_public_relations_officer',
    'municipal_administrator',
    'urban_planner',
    'building_permit_officer',
    'building_inspector',
    'suap_officer',
    'public_works_engineer',
    'mobility_traffic_engineer',
    'environment_technician',
    'technical_office_staff_member',
    'external_maintainer'
  ))
);

-- Indice per rendere l'autocompletamento istantaneo (fondamentale per LIKE 'via...')
CREATE INDEX IF NOT EXISTS idx_street_search ON Streets(street_name);