import sqlite from 'sqlite3';

import bcrypt from 'bcrypt';

//import path from 'node:path';
import path from 'path';
import { fileURLToPath } from 'url'; // <-- NEW IMPORT
import { dirname } from 'path';


// const sqlite = require('sqlite3').verbose();
// const bcrypt = require('bcrypt');
// const path = require('node:path');

// Database path
// Define __filename and __dirname for ES Modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // <-- THIS REPLACES DIRECT USE OF __dirname
const dbPath = path.join(__dirname, 'participium.db'); // Now __dirname is defined
// Database connection
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw err;
  console.log('✅ Connesso al DB:', dbPath);
});

// --- 1. USER DATA TO INSERT ---
const workers = [
  // CITIZENS AND ADMIN
  { username: 'citizen', email: 'citizen@participium.test', name: 'Davide', surname: 'Idini', type: 'citizen', roles: [] },
  { username: 'admin_main', email: 'admin@participium.test', name: 'Super', surname: 'Admin', type: 'admin', roles: [] },
  { username: 'pr_officer1', email: 'pr@comune.test.it', name: 'Sara', surname: 'Comunicazione', type: 'municipality_user', roles: ['municipal_public_relations_officer'] },
  // TECHNICIANS
  { username: 'urban_planner1', email: 'planner@comune.test.it', name: 'Giulia', surname: 'Rossi', type: 'municipality_user', roles: ['urban_planner'] },
  { username: 'urban_planner2', email: 'planner2@comune.test.it', name: 'Luca', surname: 'Rossi', type: 'municipality_user', roles: ['urban_planner'] },
  { username: 'civil_eng1', email: 'works@comune.test.it', name: 'Marco', surname: 'Gialli', type: 'municipality_user', roles: ['public_works_engineer'] },
  { username: 'env_tech1', email: 'env@comune.test.it', name: 'Elena', surname: 'Verdi', type: 'municipality_user', roles: ['environment_technician'] },
  { username: 'traffic_eng1', email: 'traffic@comune.test.it', name: 'Roberto', surname: 'Neri', type: 'municipality_user', roles: ['mobility_traffic_engineer'] },
  { username: 'inspector1', email: 'inspector@comune.test.it', name: 'Anna', surname: 'Viola', type: 'municipality_user', roles: ['building_inspector'] },
  // EXTERNAL MAINTAINERS
  { username: 'ext_maint1', email: 'maint1@external.com', name: 'Paolo', surname: 'Bianchi', type: 'municipality_user', roles: ['external_maintainer'] },
  { username: 'ext_maint2', email: 'maint2@external.com', name: 'Francesca', surname: 'Russo', type: 'municipality_user', roles: ['external_maintainer'] },
  // USERS WITH MULTIPLE ROLES
  { username: 'multi_tech1', email: 'multi1@comune.test.it', name: 'Mario', surname: 'Multiruolo', type: 'municipality_user', roles: ['urban_planner', 'public_works_engineer'] },
  { username: 'multi_tech2', email: 'multi2@comune.test.it', name: 'Laura', surname: 'Polivalente', type: 'municipality_user', roles: ['environment_technician', 'mobility_traffic_engineer'] },
  { username: 'multi_tech3', email: 'multi3@comune.test.it', name: 'Giorgio', surname: 'Tuttofare', type: 'municipality_user', roles: ['building_inspector', 'public_works_engineer', 'urban_planner'] },
  { username: 'super_tech', email: 'supertech@comune.test.it', name: 'Alessandro', surname: 'Onnisciente', type: 'municipality_user', roles: ['urban_planner', 'public_works_engineer', 'environment_technician', 'mobility_traffic_engineer'] },
  // ADDITIONAL CITIZENS (50+)
  { username: 'mario_rossi', email: 'mario.rossi@email.it', name: 'Mario', surname: 'Rossi', type: 'citizen', roles: [] },
  { username: 'luisa_verdi', email: 'luisa.verdi@email.it', name: 'Luisa', surname: 'Verdi', type: 'citizen', roles: [] },
  { username: 'giovanni_bianchi', email: 'giovanni.bianchi@email.it', name: 'Giovanni', surname: 'Bianchi', type: 'citizen', roles: [] },
  { username: 'francesca_neri', email: 'francesca.neri@email.it', name: 'Francesca', surname: 'Neri', type: 'citizen', roles: [] },
  { username: 'andrea_ferrari', email: 'andrea.ferrari@email.it', name: 'Andrea', surname: 'Ferrari', type: 'citizen', roles: [] },
  { username: 'chiara_esposito', email: 'chiara.esposito@email.it', name: 'Chiara', surname: 'Esposito', type: 'citizen', roles: [] },
  { username: 'luca_romano', email: 'luca.romano@email.it', name: 'Luca', surname: 'Romano', type: 'citizen', roles: [] },
  { username: 'valentina_colombo', email: 'valentina.colombo@email.it', name: 'Valentina', surname: 'Colombo', type: 'citizen', roles: [] },
  { username: 'matteo_ricci', email: 'matteo.ricci@email.it', name: 'Matteo', surname: 'Ricci', type: 'citizen', roles: [] },
  { username: 'sofia_marino', email: 'sofia.marino@email.it', name: 'Sofia', surname: 'Marino', type: 'citizen', roles: [] },
  { username: 'alessandro_greco', email: 'alessandro.greco@email.it', name: 'Alessandro', surname: 'Greco', type: 'citizen', roles: [] },
  { username: 'elena_bruno', email: 'elena.bruno@email.it', name: 'Elena', surname: 'Bruno', type: 'citizen', roles: [] },
  { username: 'davide_gallo', email: 'davide.gallo@email.it', name: 'Davide', surname: 'Gallo', type: 'citizen', roles: [] },
  { username: 'giulia_conti', email: 'giulia.conti@email.it', name: 'Giulia', surname: 'Conti', type: 'citizen', roles: [] },
  { username: 'federico_costa', email: 'federico.costa@email.it', name: 'Federico', surname: 'Costa', type: 'citizen', roles: [] },
  { username: 'martina_fontana', email: 'martina.fontana@email.it', name: 'Martina', surname: 'Fontana', type: 'citizen', roles: [] },
  { username: 'riccardo_caruso', email: 'riccardo.caruso@email.it', name: 'Riccardo', surname: 'Caruso', type: 'citizen', roles: [] },
  { username: 'alice_mancini', email: 'alice.mancini@email.it', name: 'Alice', surname: 'Mancini', type: 'citizen', roles: [] },
  { username: 'simone_serra', email: 'simone.serra@email.it', name: 'Simone', surname: 'Serra', type: 'citizen', roles: [] },
  { username: 'beatrice_lombardi', email: 'beatrice.lombardi@email.it', name: 'Beatrice', surname: 'Lombardi', type: 'citizen', roles: [] },
  { username: 'lorenzo_barbieri', email: 'lorenzo.barbieri@email.it', name: 'Lorenzo', surname: 'Barbieri', type: 'citizen', roles: [] },
  { username: 'greta_fiore', email: 'greta.fiore@email.it', name: 'Greta', surname: 'Fiore', type: 'citizen', roles: [] },
  { username: 'tommaso_moretti', email: 'tommaso.moretti@email.it', name: 'Tommaso', surname: 'Moretti', type: 'citizen', roles: [] },
  { username: 'aurora_marchetti', email: 'aurora.marchetti@email.it', name: 'Aurora', surname: 'Marchetti', type: 'citizen', roles: [] },
  { username: 'nicola_ferretti', email: 'nicola.ferretti@email.it', name: 'Nicola', surname: 'Ferretti', type: 'citizen', roles: [] },
  { username: 'emma_santoro', email: 'emma.santoro@email.it', name: 'Emma', surname: 'Santoro', type: 'citizen', roles: [] },
  { username: 'gabriele_rinaldi', email: 'gabriele.rinaldi@email.it', name: 'Gabriele', surname: 'Rinaldi', type: 'citizen', roles: [] },
  { username: 'giorgia_palmieri', email: 'giorgia.palmieri@email.it', name: 'Giorgia', surname: 'Palmieri', type: 'citizen', roles: [] },
  { username: 'daniele_benedetti', email: 'daniele.benedetti@email.it', name: 'Daniele', surname: 'Benedetti', type: 'citizen', roles: [] },
  { username: 'caterina_pellegrini', email: 'caterina.pellegrini@email.it', name: 'Caterina', surname: 'Pellegrini', type: 'citizen', roles: [] },
  { username: 'emanuele_vitale', email: 'emanuele.vitale@email.it', name: 'Emanuele', surname: 'Vitale', type: 'citizen', roles: [] },
  { username: 'isabella_sala', email: 'isabella.sala@email.it', name: 'Isabella', surname: 'Sala', type: 'citizen', roles: [] },
  { username: 'filippo_martini', email: 'filippo.martini@email.it', name: 'Filippo', surname: 'Martini', type: 'citizen', roles: [] },
  { username: 'noemi_landi', email: 'noemi.landi@email.it', name: 'Noemi', surname: 'Landi', type: 'citizen', roles: [] },
  { username: 'leonardo_battaglia', email: 'leonardo.battaglia@email.it', name: 'Leonardo', surname: 'Battaglia', type: 'citizen', roles: [] },
  { username: 'sara_bernardi', email: 'sara.bernardi@email.it', name: 'Sara', surname: 'Bernardi', type: 'citizen', roles: [] },
  { username: 'stefano_rossetti', email: 'stefano.rossetti@email.it', name: 'Stefano', surname: 'Rossetti', type: 'citizen', roles: [] },
  { username: 'anna_parisi', email: 'anna.parisi@email.it', name: 'Anna', surname: 'Parisi', type: 'citizen', roles: [] },
  { username: 'marco_gentile', email: 'marco.gentile@email.it', name: 'Marco', surname: 'Gentile', type: 'citizen', roles: [] },
  { username: 'francesca_amato', email: 'francesca.amato@email.it', name: 'Francesca', surname: 'Amato', type: 'citizen', roles: [] },
  { username: 'giacomo_baldini', email: 'giacomo.baldini@email.it', name: 'Giacomo', surname: 'Baldini', type: 'citizen', roles: [] },
  { username: 'elisa_fabbri', email: 'elisa.fabbri@email.it', name: 'Elisa', surname: 'Fabbri', type: 'citizen', roles: [] },
  { username: 'pietro_sorrentino', email: 'pietro.sorrentino@email.it', name: 'Pietro', surname: 'Sorrentino', type: 'citizen', roles: [] },
  { username: 'ludovica_damico', email: 'ludovica.damico@email.it', name: 'Ludovica', surname: 'Damico', type: 'citizen', roles: [] },
  { username: 'cristian_pagano', email: 'cristian.pagano@email.it', name: 'Cristian', surname: 'Pagano', type: 'citizen', roles: [] },
  { username: 'viola_gatti', email: 'viola.gatti@email.it', name: 'Viola', surname: 'Gatti', type: 'citizen', roles: [] },
  { username: 'samuele_guida', email: 'samuele.guida@email.it', name: 'Samuele', surname: 'Guida', type: 'citizen', roles: [] },
  { username: 'rebecca_mazza', email: 'rebecca.mazza@email.it', name: 'Rebecca', surname: 'Mazza', type: 'citizen', roles: [] },
  { username: 'diego_testa', email: 'diego.testa@email.it', name: 'Diego', surname: 'Testa', type: 'citizen', roles: [] },
  { username: 'camilla_ferrara', email: 'camilla.ferrara@email.it', name: 'Camilla', surname: 'Ferrara', type: 'citizen', roles: [] },
  { username: 'mattia_russo', email: 'mattia.russo@email.it', name: 'Mattia', surname: 'Russo', type: 'citizen', roles: [] },
  { username: 'ginevra_marini', email: 'ginevra.marini@email.it', name: 'Ginevra', surname: 'Marini', type: 'citizen', roles: [] },
  { username: 'jacopo_grassi', email: 'jacopo.grassi@email.it', name: 'Jacopo', surname: 'Grassi', type: 'citizen', roles: [] },
  { username: 'bianca_valentini', email: 'bianca.valentini@email.it', name: 'Bianca', surname: 'Valentini', type: 'citizen', roles: [] }
];

// --- 2. REPORT DATA TO INSERT ---
// Note: Categories must match EXACTLY with the CHECK constraint in the SQL schema
// Turin coordinates: ~45.06-45.08 lat, 7.65-7.69 lon
const reports = [
  // Existing reports
  {
    title: 'Weed too high on sidewalk',
    description: 'Weed too high on sidewalk that obstructs passage.',
    category: 'Roads and Urban Furnishings',
    latitude: 45.06495,
    longitude: 7.65922,
    image_path1: 'static/uploads/Roads and Urban Furnishings.png',
    status: 'pending',
    author_username: 'citizen',
    technical_office: null
  },
  {
    title: 'Damaged playground',
    description: 'The playground has been damaged and some lights are not working.',
    category: 'Public Lighting',
    latitude: 45.0538,
    longitude: 7.6835,
    image_path1: 'static/uploads/public lighting.png',
    status: 'pending',
    author_username: 'citizen',
    technical_office: null
  },
  {
    title: 'Abandoned waste in Piazza Castello',
    description: 'Accumulation of uncollected black bags near the tram stop.',
    category: 'Waste',
    latitude: 45.0709,
    longitude: 7.6857,
    image_path1: 'static/uploads/waste.jpg',
    status: 'pending', 
    author_username: 'citizen',
    technical_office: null
  },
  {
    title: 'Architectural barrier in Via Po',
    description: 'Sidewalk with step too high that prevents access for disabled people.',
    category: 'Architectural Barriers',
    latitude: 45.0621,
    longitude: 7.661,
    image_path1: 'static/uploads/Architectural Barriers.png',
    status: 'pending',
    author_username: 'citizen',
    technical_office: null
  },
  {
    title: 'Broken streetlight in Via Roma',
    description: 'Non-functioning streetlight in front of a shop in Via Roma.',
    category: 'Public Lighting',
    latitude: 45.0653,
    longitude: 7.6809,
    image_path1: 'static/uploads/public lighting.png',
    status: 'assigned',
    author_username: 'citizen',
    technical_office: 'public_works_engineer'
  },
  // New reports - Public Lighting
  {
    title: 'Streetlight off in Corso Vittorio Emanuele',
    description: 'Streetlight completely off for several days, poorly lit area.',
    category: 'Public Lighting',
    latitude: 45.0672,
    longitude: 7.6785,
    image_path1: 'static/uploads/public lighting.png',
    status: 'pending',
    author_username: 'mario_rossi',
    technical_office: null
  },
  {
    title: 'Insufficient lighting in Via Garibaldi',
    description: 'Public lighting is too weak, especially in the evening hours.',
    category: 'Public Lighting',
    latitude: 45.0691,
    longitude: 7.6823,
    image_path1: 'static/uploads/public lighting.png',
    status: 'assigned',
    author_username: 'luisa_verdi',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Broken lamp in Piazza San Carlo',
    description: 'One of the decorative lamps in Piazza San Carlo is broken and not working.',
    category: 'Public Lighting',
    latitude: 45.0705,
    longitude: 7.6798,
    image_path1: 'static/uploads/public lighting.png',
    status: 'progress',
    author_username: 'giovanni_bianchi',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Damaged streetlight in Via Lagrange',
    description: 'Streetlight with broken glass and burnt-out bulb.',
    category: 'Public Lighting',
    latitude: 45.0668,
    longitude: 7.6754,
    image_path1: 'static/uploads/public lighting.png',
    status: 'pending',
    author_username: 'francesca_neri',
    technical_office: null
  },
  // Waste
  {
    title: 'Abandoned waste in Via Pietro Micca',
    description: 'Garbage bag abandoned on the sidewalk for days.',
    category: 'Waste',
    latitude: 45.0634,
    longitude: 7.6721,
    image_path1: 'static/uploads/waste.jpg',
    status: 'pending',
    author_username: 'andrea_ferrari',
    technical_office: null
  },
  {
    title: 'Public trash bin overflowing in Corso Francia',
    description: 'Public trash bin completely full with waste spilling out.',
    category: 'Waste',
    latitude: 45.0712,
    longitude: 7.6615,
    image_path1: 'static/uploads/waste.jpg',
    status: 'assigned',
    author_username: 'chiara_esposito',
    technical_office: 'environment_technician'
  },
  {
    title: 'Illegal dump in Via Nizza',
    description: 'Bulky waste illegally abandoned along the road.',
    category: 'Waste',
    latitude: 45.0587,
    longitude: 7.6842,
    image_path1: 'static/uploads/waste.jpg',
    status: 'pending',
    author_username: 'luca_romano',
    technical_office: null
  },
  {
    title: 'Damaged waste container',
    description: 'Container for separate waste collection broken and unusable.',
    category: 'Waste',
    latitude: 45.0659,
    longitude: 7.6738,
    image_path1: 'static/uploads/waste.jpg',
    status: 'resolved',
    author_username: 'valentina_colombo',
    technical_office: 'environment_technician'
  },
  // Roads and Urban Furnishings
  {
    title: 'Pothole in sidewalk on Via XX Settembre',
    description: 'Deep pothole in the sidewalk that poses a danger to pedestrians.',
    category: 'Roads and Urban Furnishings',
    latitude: 45.0683,
    longitude: 7.6812,
    image_path1: 'static/uploads/Roads and Urban Furnishings.png',
    status: 'pending',
    author_username: 'matteo_ricci',
    technical_office: null
  },
  {
    title: 'Broken bench in Parco del Valentino',
    description: 'Public bench with broken slat, no longer usable.',
    category: 'Roads and Urban Furnishings',
    latitude: 45.0542,
    longitude: 7.6887,
    image_path1: 'static/uploads/Roads and Urban Furnishings.png',
    status: 'assigned',
    author_username: 'sofia_marino',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Damaged asphalt in Corso Re Umberto',
    description: 'Road with uneven asphalt and potholes that make transit difficult.',
    category: 'Roads and Urban Furnishings',
    latitude: 45.0627,
    longitude: 7.6776,
    image_path1: 'static/uploads/Roads and Urban Furnishings.png',
    status: 'progress',
    author_username: 'alessandro_greco',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Bent road sign',
    description: 'No parking sign bent and no longer readable.',
    category: 'Roads and Urban Furnishings',
    latitude: 45.0718,
    longitude: 7.6654,
    image_path1: 'static/uploads/Roads and Urban Furnishings.png',
    status: 'assigned',
    author_username: 'elena_bruno',
    technical_office: null
  },
  {
    title: 'Uneven sidewalk in Via Montebello',
    description: 'Sidewalk with raised and dangerous stone slabs.',
    category: 'Roads and Urban Furnishings',
    latitude: 45.0641,
    longitude: 7.6698,
    image_path1: 'static/uploads/Roads and Urban Furnishings.png',
    status: 'pending',
    author_username: 'davide_gallo',
    technical_office: null
  },
  // Architectural Barriers
  {
    title: 'Step too high for disabled people',
    description: 'Store access step too high, not accessible for wheelchairs.',
    category: 'Architectural Barriers',
    latitude: 45.0697,
    longitude: 7.6834,
    image_path1: 'static/uploads/Architectural Barriers.png',
    status: 'assigned',
    author_username: 'giulia_conti',
    technical_office: null
  },
  {
    title: 'Missing ramp for disabled people',
    description: 'Public entrance without access ramp for disabled people.',
    category: 'Architectural Barriers',
    latitude: 45.0665,
    longitude: 7.6742,
    image_path1: 'static/uploads/Architectural Barriers.png',
    status: 'assigned',
    author_username: 'federico_costa',
    technical_office: 'urban_planner'
  },
  {
    title: 'Sidewalk without curb ramp',
    description: 'Sidewalk without curb ramp for wheelchairs at the intersection.',
    category: 'Architectural Barriers',
    latitude: 45.0638,
    longitude: 7.6715,
    image_path1: 'static/uploads/Architectural Barriers.png',
    status: 'pending',
    author_username: 'martina_fontana',
    technical_office: null
  },
  // Water Supply - Drinking Water
  {
    title: 'Non-functioning public water fountain',
    description: 'Public water fountain has not been dispensing water for weeks.',
    category: 'Water Supply - Drinking Water',
    latitude: 45.0679,
    longitude: 7.6792,
    image_path1: 'static/uploads/Water Supply - Drinking Water.jpg',
    status: 'assigned',
    author_username: 'riccardo_caruso',
    technical_office: null
  },
  {
    title: 'Water fountain with leak',
    description: 'Public water fountain leaks continuously, wasting resources.',
    category: 'Water Supply - Drinking Water',
    latitude: 45.0656,
    longitude: 7.6827,
    image_path1: 'static/uploads/Water Supply - Drinking Water.jpg',
    status: 'assigned',
    author_username: 'alice_mancini',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Broken water fountain in Parco della Pellerina',
    description: 'Water fountain completely broken and not repairable.',
    category: 'Water Supply - Drinking Water',
    latitude: 45.0724,
    longitude: 7.6589,
    image_path1: 'static/uploads/Water Supply - Drinking Water.jpg',
    status: 'pending',
    author_username: 'simone_serra',
    technical_office: null
  },
  // Sewer System
  {
    title: 'Sewer manhole with bad odor',
    description: 'Sewer manhole emitting bad odor, possible obstruction.',
    category: 'Sewer System',
    latitude: 45.0687,
    longitude: 7.6763,
    image_path1: 'static/uploads/Sewer System.jpg',
    status: 'pending',
    author_username: 'beatrice_lombardi',
    technical_office: null
  },
  {
    title: 'Flooding in Via Madama Cristina',
    description: 'Road flooded after rain, insufficient sewer system.',
    category: 'Sewer System',
    latitude: 45.0593,
    longitude: 7.6751,
    image_path1: 'static/uploads/Sewer System.jpg',
    status: 'assigned',
    author_username: 'lorenzo_barbieri',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Clogged sewer grate',
    description: 'Sewer system grate completely clogged with leaves and debris.',
    category: 'Sewer System',
    latitude: 45.0645,
    longitude: 7.6801,
    image_path1: 'static/uploads/Sewer System.jpg',
    status: 'assigned',
    author_username: 'greta_fiore',
    technical_office: null
  },
  // Road Signs and Traffic Lights
  {
    title: 'Non-functioning traffic light',
    description: 'Traffic light at intersection completely off, danger for traffic.',
    category: 'Road Signs and Traffic Lights',
    latitude: 45.0701,
    longitude: 7.6778,
    image_path1: 'static/uploads/Road Signs and Traffic Lights.jpg',
    status: 'assigned',
    author_username: 'tommaso_moretti',
    technical_office: 'mobility_traffic_engineer'
  },
  {
    title: 'Road sign covered by vegetation',
    description: 'Stop sign covered by branches and leaves, no longer visible.',
    category: 'Road Signs and Traffic Lights',
    latitude: 45.0631,
    longitude: 7.6687,
    image_path1: 'static/uploads/Road Signs and Traffic Lights.jpg',
    status: 'assigned',
    author_username: 'aurora_marchetti',
    technical_office: null
  },
  {
    title: 'Broken pedestrian traffic light',
    description: 'Pedestrian traffic light not working, dangerous crossing.',
    category: 'Road Signs and Traffic Lights',
    latitude: 45.0662,
    longitude: 7.6819,
    image_path1: 'static/uploads/Road Signs and Traffic Lights.jpg',
    status: 'progress',
    author_username: 'nicola_ferretti',
    technical_office: 'mobility_traffic_engineer'
  },
  {
    title: 'Missing road sign',
    description: 'Direction sign missing at intersection, confusion for drivers.',
    category: 'Road Signs and Traffic Lights',
    latitude: 45.0694,
    longitude: 7.6735,
    image_path1: 'static/uploads/Road Signs and Traffic Lights.jpg',
    status: 'assigned',
    author_username: 'emma_santoro',
    technical_office: null
  },
  // Public Green Areas and Playgrounds
  {
    title: 'Broken swing in playground',
    description: 'Swing in playground with broken chain, danger for children.',
    category: 'Public Green Areas and Playgrounds',
    latitude: 45.0615,
    longitude: 7.6865,
    image_path1: 'static/uploads/Public Green Areas and Playgrounds.jpg',
    status: 'assigned',
    author_username: 'gabriele_rinaldi',
    technical_office: null
  },
  {
    title: 'Abandoned flowerbed in Piazza Statuto',
    description: 'Public flowerbed completely uncultivated and full of weeds.',
    category: 'Public Green Areas and Playgrounds',
    latitude: 45.0728,
    longitude: 7.6672,
    image_path1: 'static/uploads/Public Green Areas and Playgrounds.jpg',
    status: 'assigned',
    author_username: 'giorgia_palmieri',
    technical_office: 'environment_technician'
  },
  {
    title: 'Damaged slide in park',
    description: 'Slide in playground with cracks and sharp edges.',
    category: 'Public Green Areas and Playgrounds',
    latitude: 45.0558,
    longitude: 7.6821,
    image_path1: 'static/uploads/Public Green Areas and Playgrounds.jpg',
    status: 'pending',
    author_username: 'daniele_benedetti',
    technical_office: null
  },
  {
    title: 'Unstable tree in Via Verdi',
    description: 'Tree with dry branches that could fall, danger for passersby.',
    category: 'Public Green Areas and Playgrounds',
    latitude: 45.0689,
    longitude: 7.6703,
    image_path1: 'static/uploads/Public Green Areas and Playgrounds.jpg',
    status: 'assigned',
    author_username: 'caterina_pellegrini',
    technical_office: 'environment_technician'
  },
  {
    title: 'Uncut grass in park',
    description: 'Public park lawn not mowed for weeks, grass too high.',
    category: 'Public Green Areas and Playgrounds',
    latitude: 45.0572,
    longitude: 7.6795,
    image_path1: 'static/uploads/Public Green Areas and Playgrounds.jpg',
    status: 'pending',
    author_username: 'emanuele_vitale',
    technical_office: null
  },
  // Other
  {
    title: 'Graffiti on public wall',
    description: 'Vandal graffiti on public wall that deface the urban landscape.',
    category: 'Other',
    latitude: 45.0651,
    longitude: 7.6789,
    image_path1: 'static/uploads/other.jpg',
    status: 'pending',
    author_username: 'isabella_sala',
    technical_office: null
  },
  {
    title: 'Broken window',
    description: 'Public building window broken, possible act of vandalism.',
    category: 'Other',
    latitude: 45.0715,
    longitude: 7.6847,
    image_path1: 'static/uploads/other.jpg',
    status: 'assigned',
    author_username: 'filippo_martini',
    technical_office: 'building_inspector'
  },
  // Other various reports
  {
    title: 'Flickering streetlight in Via Cavour',
    description: 'Streetlight that flashes continuously, probable electrical problem.',
    category: 'Public Lighting',
    latitude: 45.0675,
    longitude: 7.6825,
    image_path1: 'static/uploads/public lighting.png',
    status: 'pending',
    author_username: 'noemi_landi',
    technical_office: null
  },
  {
    title: 'Abandoned hazardous waste',
    description: 'Special waste (paints, batteries) abandoned on the street.',
    category: 'Waste',
    latitude: 45.0608,
    longitude: 7.6718,
    image_path1: 'static/uploads/waste.jpg',
    status: 'assigned',
    author_username: 'leonardo_battaglia',
    technical_office: 'environment_technician'
  },
  {
    title: 'Deep pothole in Corso Inghilterra',
    description: 'Very deep pothole in the roadway, danger for vehicles.',
    category: 'Roads and Urban Furnishings',
    latitude: 45.0623,
    longitude: 7.6746,
    image_path1: 'static/uploads/Roads and Urban Furnishings.png',
    status: 'progress',
    author_username: 'sara_bernardi',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Missing curb ramp for disabled people',
    description: 'Public staircase without alternative for disabled people.',
    category: 'Architectural Barriers',
    latitude: 45.0698,
    longitude: 7.6805,
    image_path1: 'static/uploads/Architectural Barriers.png',
    status: 'pending',
    author_username: 'stefano_rossetti',
    technical_office: null
  },
  {
    title: 'Water fountain with cloudy water',
    description: 'Public water fountain dispenses cloudy water, possible contamination.',
    category: 'Water Supply - Drinking Water',
    latitude: 45.0647,
    longitude: 7.6772,
    image_path1: 'static/uploads/Water Supply - Drinking Water.jpg',
    status: 'assigned',
    author_username: 'anna_parisi',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Sewer manhole without cover',
    description: 'Sewer manhole without cover, danger for pedestrians and vehicles.',
    category: 'Sewer System',
    latitude: 45.0711,
    longitude: 7.6698,
    image_path1: 'static/uploads/Sewer System.jpg',
    status: 'assigned',    
    author_username: 'marco_gentile',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Traffic light with yellow light always on',
    description: 'Traffic light with flashing yellow light always on, traffic confusion.',
    category: 'Road Signs and Traffic Lights',
    latitude: 45.0668,
    longitude: 7.6759,
    image_path1: 'static/uploads/Road Signs and Traffic Lights.jpg',
    status: 'assigned',
    author_username: 'francesca_amato',
    technical_office: 'mobility_traffic_engineer'
  },
  {
    title: 'Broken carousel in park',
    description: 'Carousel in playground with broken mechanism, not working.',
    category: 'Public Green Areas and Playgrounds',
    latitude: 45.0564,
    longitude: 7.6853,
    image_path1: 'static/uploads/Public Green Areas and Playgrounds.jpg',
    status: 'assigned',    
    author_username: 'giacomo_baldini',
    technical_office: null
  },
  {
    title: 'Vandalism on bench',
    description: 'Public bench defaced with spray paint.',
    category: 'Other',
    latitude: 45.0681,
    longitude: 7.6729,
    image_path1: 'static/uploads/other.jpg',
    status: 'pending',
    author_username: 'elisa_fabbri',
    technical_office: null
  },
  {
    title: 'Insufficient nighttime lighting',
    description: 'Area poorly lit in the evening, request for more lighting.',
    category: 'Public Lighting',
    latitude: 45.0636,
    longitude: 7.6794,
    image_path1: 'static/uploads/public lighting.png',
    status: 'assigned',
    author_username: 'pietro_sorrentino',
    technical_office: null
  },
  {
    title: 'Missing trash bin',
    description: 'Public trash bin removed, need to install a new one.',
    category: 'Waste',
    latitude: 45.0707,
    longitude: 7.6783,
    image_path1: 'static/uploads/waste.jpg',
    status: 'assigned',
    author_username: 'ludovica_damico',
    technical_office: 'environment_technician'
  },
  {
    title: 'Road with multiple potholes',
    description: 'Road with numerous potholes that make driving difficult.',
    category: 'Roads and Urban Furnishings',
    latitude: 45.0619,
    longitude: 7.6732,
    image_path1: 'static/uploads/Roads and Urban Furnishings.png',
    status: 'progress',
    author_username: 'cristian_pagano',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Ramp for disabled people too steep',
    description: 'Ramp for disabled people with excessive slope, not compliant with regulations.',
    category: 'Architectural Barriers',
    latitude: 45.0673,
    longitude: 7.6816,
    image_path1: 'static/uploads/Architectural Barriers.png',
    status: 'pending',
    author_username: 'viola_gatti',
    technical_office: null
  },
  {
    title: 'Water fountain with broken tap',
    description: 'Public water fountain with tap that does not close, water waste.',
    category: 'Water Supply - Drinking Water',
    latitude: 45.0654,
    longitude: 7.6767,
    image_path1: 'static/uploads/Water Supply - Drinking Water.jpg',
    status: 'assigned',
    author_username: 'samuele_guida',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Recurring flooding',
    description: 'Road that floods with every rain, inadequate sewer system.',
    category: 'Sewer System',
    latitude: 45.0597,
    longitude: 7.6765,
    image_path1: 'static/uploads/Sewer System.jpg',
    status: 'assigned',
    author_username: 'rebecca_mazza',
    technical_office: null
  },
  {
    title: 'Illegible speed limit sign',
    description: 'Speed limit sign faded and no longer readable.',
    category: 'Road Signs and Traffic Lights',
    latitude: 45.0719,
    longitude: 7.6641,
    image_path1: 'static/uploads/Road Signs and Traffic Lights.jpg',
    status: 'pending',
    author_username: 'diego_testa',
    technical_office: null
  },
  {
    title: 'Playground without maintenance',
    description: 'Playground in poor condition, needs urgent maintenance.',
    category: 'Public Green Areas and Playgrounds',
    latitude: 45.0548,
    longitude: 7.6871,
    image_path1: 'static/uploads/Public Green Areas and Playgrounds.jpg',
    status: 'assigned',
    author_username: 'camilla_ferrara',
    technical_office: 'environment_technician'
  },
  {
    title: 'Damage to public property',
    description: 'Unspecified damage to public property that needs repair.',
    category: 'Other',
    latitude: 45.0665,
    longitude: 7.6797,
    image_path1: 'static/uploads/other.jpg',
    status: 'pending',
    author_username: 'mattia_russo',
    technical_office: null
  },
  {
    title: 'Streetlight with intermittent light',
    description: 'Streetlight that turns on and off continuously.',
    category: 'Public Lighting',
    latitude: 45.0628,
    longitude: 7.6781,
    image_path1: 'static/uploads/public lighting.png',
    status: 'resolved',
    author_username: 'ginevra_marini',
    technical_office: 'public_works_engineer'
  },
  {
    title: 'Waste collection not performed',
    description: 'Waste not collected on scheduled day, accumulation on street.',
    category: 'Waste',
    latitude: 45.0692,
    longitude: 7.6828,
    image_path1: 'static/uploads/waste.jpg',
    status: 'pending',
    author_username: 'jacopo_grassi',
    technical_office: null
  },
  {
    title: 'Sidewalk with broken slabs',
    description: 'Sidewalk with several broken and dangerous slabs.',
    category: 'Roads and Urban Furnishings',
    latitude: 45.0643,
    longitude: 7.6705,
    image_path1: 'static/uploads/Roads and Urban Furnishings.png',
    status: 'pending',
    author_username: 'bianca_valentini',
    technical_office: null
  }
];

// --- HELPER FOR PROMISE ---
// Transforms db.run (which uses callbacks) into a Promise to use async/await
function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this); // 'this' contains lastID and changes
    });
  });
}

// --- MAIN LOGIC ---
(async () => {
  try {
    console.log("🚀 Starting seeding procedure...");

    // A. CLEANUP
    // Delete children (Reports) first to avoid foreign key violations, then parents (Users)
    console.log("🧹 Cleaning old data...");
    try {
        await runQuery(`DELETE FROM Reports`);
        await runQuery(`DELETE FROM Users`);
        // Reset autoincrement ID to 1
        await runQuery(`DELETE FROM sqlite_sequence WHERE name='Users' OR name='Reports'`);
    } catch {
        // Ignore errors: tables may be empty or non-existent on first run
        // This is expected behavior, so we continue with seeding
        console.log("   Info: Tables may be empty or non-existent, continuing.");
    }

    // B. USER INSERTION
    console.log("👥 Inserting users...");
    
    const testCredential = process.env.SEED_PASSWORD || 'test1234';
    const saltRounds = 10;
    
    const userMap = {}; 

    for (const w of workers) {
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(testCredential, salt);

      // Insert user (WITH type)
      const result = await runQuery(
        `INSERT INTO Users (username, email, name, surname, type, password, salt, is_confirmed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [w.username, w.email, w.name, w.surname, w.type, hash, salt, 1]
      );
      
      const userId = result.lastID;
      userMap[w.username] = userId;
      
      // Insert roles into UsersRoles table ONLY if municipality_user and has roles
      if (w.type === 'municipality_user' && w.roles.length > 0) {
        for (const role of w.roles) {
          await runQuery(
            `INSERT INTO UsersRoles (userId, role) VALUES (?, ?)`,
            [userId, role]
          );
        }
        console.log(`   ✅ User inserted: ${w.username} (ID: ${userId}) type: ${w.type} with roles: ${w.roles.join(', ')}`);
      } else {
        console.log(`   ✅ User inserted: ${w.username} (ID: ${userId}) type: ${w.type}`);
      }
    }

    // C. REPORT INSERTION
    console.log("📝 Inserting reports...");
    
    for (const r of reports) {
      // Find the author user ID using the map created earlier
      const userId = userMap[r.author_username];
      
      if (!userId) {
        console.warn(`   ⚠️ Skipped report "${r.title}": User ${r.author_username} not found.`);
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
      console.log(`   ✅ Report created: "${r.title}" (Author ID: ${userId})`);
    }

    console.log("🎉 Seeding completed successfully!");

  } catch (error) {
    console.error("❌ Critical error during seeding:", error);
  } finally {
    db.close(() => console.log("🔒 Database closed."));
  }
})();