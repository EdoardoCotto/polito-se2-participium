'use strict';

// Allowed user roles/types in the system
// Note: keep 'citizen' and 'admin' for existing flows
// Municipality roles per Story 3
const ALLOWED_ROLES = [
  'citizen',
  'admin',
  'urban_planner',
  'municipal_public_relations_officer',
  'municipal_administrator',
  'technical_office_staff_member',
];

module.exports = {
  ALLOWED_ROLES,
};


