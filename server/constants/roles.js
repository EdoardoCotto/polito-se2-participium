'use strict';

// Single source of truth for user roles/types.
// Keeps backward compatibility with existing flows (citizen/admin)
// and adds granular technical roles for realistic municipality scenarios.

const ALLOWED_ROLES = [
  // base roles
  'citizen',
  'admin',

  // non-technical municipality roles
  'municipal_public_relations_officer',
  'municipal_administrator',

  // technical roles (granular)
  'urban_planner',                // Urban planning
  'building_permit_officer',      // Private building permits
  'building_inspector',           // Building compliance/vigilance
  'suap_officer',                 // One-stop shop for businesses (SUAP)
  'public_works_engineer',        // Public works / maintenance & technical services
  'mobility_traffic_engineer',    // Mobility & traffic
  'environment_technician',       // Environment / built environment quality

  // generic legacy technical role (keep if already used somewhere)
  'technical_office_staff_member',
];

// Optional but recommended: metadata for UI labels and future extensions.
const ROLE_METADATA = {
  citizen: { label: 'Citizen' },
  admin: { label: 'System Administrator' },

  municipal_public_relations_officer: { label: 'Public Relations (URP)' },
  municipal_administrator: { label: 'Municipal Administrator' },

  urban_planner: { label: 'Urban Planner (Urbanistica)' },
  building_permit_officer: { label: 'Building Permit Officer (Edilizia Privata)' },
  building_inspector: { label: 'Building Inspector (Vigilanza Edilizia)' },
  suap_officer: { label: 'SUAP Officer' },
  public_works_engineer: { label: 'Public Works Engineer (Lavori Pubblici)' },
  mobility_traffic_engineer: { label: 'Mobility & Traffic Engineer' },
  environment_technician: { label: 'Environment Technician (Ambiente)' },

  technical_office_staff_member: { label: 'Technical Office Staff (Generic)' },
};

module.exports = {
  ALLOWED_ROLES,
  ROLE_METADATA,
};
