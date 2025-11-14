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
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_path1 TEXT NOT NULL,
  image_path2 TEXT,
  image_path3 TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- possible values: 'pending', 'approved', 'rejected'  etc
  rejection_reason TEXT,
  technical_office TEXT, -- anche questo campo dovra essere ridotto con solo i possibili uffici tecnici
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  userId INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE 
);