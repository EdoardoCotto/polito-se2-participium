-- SQLite Schema for Participium
-- Database for citizen participation management system

-- Drop existing tables if they exist
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Reports;

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  type TEXT NOT NULL,
  password TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Reports table
CREATE TABLE IF NOT EXISTS Reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DFATETIME DEFAULT CURRENT_TIMESTAMP,
  userId INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE 
);


-- Sample data (optional - remove if you don't want test data)
INSERT INTO Users (username, email, name, surname, type, password, salt) VALUES
('admin', 'admin@example.org', 'Mario', 'Rossi', 'admin', 'hashed_password_1', 'salt_1'),
('citizen1', 'citizen1@example.org', 'Luigi', 'Verdi', 'citizen', 'hashed_password_2', 'salt_2'),
('citizen2', 'citizen2@example.org', 'Maria', 'Bianchi', 'citizen', 'hashed_password_3', 'salt_3');