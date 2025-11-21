-- SQLite Schema for Participium
-- Database for citizen participation management system

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
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  technical_office TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  userId INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE, 
  CHECK(status IN ('pending', 'assigned', 'rejected')),
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
    'technical_office_staff_member'
  ))
);