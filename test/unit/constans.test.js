const { ALLOWED_ROLES, ROLE_METADATA, TECHNICAL_OFFICER_ROLES } = require('../../server/constants/roles');
const REPORT_STATUSES = require('../../server/constants/reportStatus');
const { REPORT_CATEGORIES } = require('../../server/constants/reportCategories');

describe('Constants', () => {
  describe('roles.js', () => {
    describe('ALLOWED_ROLES', () => {
      it('should be an array', () => {
        expect(Array.isArray(ALLOWED_ROLES)).toBe(true);
      });

      it('should contain expected roles', () => {
        expect(ALLOWED_ROLES).toContain('municipal_public_relations_officer');
        expect(ALLOWED_ROLES).toContain('municipal_administrator');
        expect(ALLOWED_ROLES).toContain('urban_planner');
        expect(ALLOWED_ROLES).toContain('building_permit_officer');
        expect(ALLOWED_ROLES).toContain('building_inspector');
        expect(ALLOWED_ROLES).toContain('suap_officer');
        expect(ALLOWED_ROLES).toContain('public_works_engineer');
        expect(ALLOWED_ROLES).toContain('mobility_traffic_engineer');
        expect(ALLOWED_ROLES).toContain('environment_technician');
        expect(ALLOWED_ROLES).toContain('technical_office_staff_member');
        expect(ALLOWED_ROLES).toContain('external_maintainer');
      });

      it('should have correct length', () => {
        expect(ALLOWED_ROLES.length).toBe(11);
      });

      it('should not contain duplicate values', () => {
        const uniqueRoles = [...new Set(ALLOWED_ROLES)];
        expect(uniqueRoles.length).toBe(ALLOWED_ROLES.length);
      });

      it('should contain only string values', () => {
        ALLOWED_ROLES.forEach(role => {
          expect(typeof role).toBe('string');
        });
      });
    });

    describe('ROLE_METADATA', () => {
      it('should be an object', () => {
        expect(typeof ROLE_METADATA).toBe('object');
        expect(ROLE_METADATA).not.toBeNull();
      });

      it('should have metadata for all allowed roles', () => {
        ALLOWED_ROLES.forEach(role => {
          expect(ROLE_METADATA).toHaveProperty(role);
          expect(ROLE_METADATA[role]).toHaveProperty('label');
          expect(typeof ROLE_METADATA[role].label).toBe('string');
        });
      });

      it('should contain correct labels', () => {
        expect(ROLE_METADATA.municipal_public_relations_officer.label).toBe('Public Relations (URP)');
        expect(ROLE_METADATA.municipal_administrator.label).toBe('Municipal Administrator');
        expect(ROLE_METADATA.urban_planner.label).toBe('Urban Planner (Urbanistica)');
        expect(ROLE_METADATA.building_permit_officer.label).toBe('Building Permit Officer (Edilizia Privata)');
        expect(ROLE_METADATA.building_inspector.label).toBe('Building Inspector (Vigilanza Edilizia)');
        expect(ROLE_METADATA.suap_officer.label).toBe('SUAP Officer');
        expect(ROLE_METADATA.public_works_engineer.label).toBe('Public Works Engineer (Lavori Pubblici)');
        expect(ROLE_METADATA.mobility_traffic_engineer.label).toBe('Mobility & Traffic Engineer');
        expect(ROLE_METADATA.environment_technician.label).toBe('Environment Technician (Ambiente)');
        expect(ROLE_METADATA.technical_office_staff_member.label).toBe('Technical Office Staff (Generic)');
        expect(ROLE_METADATA.external_maintainer.label).toBe('External Maintainer');
      });
    });

    describe('TECHNICAL_OFFICER_ROLES', () => {
      it('should be an array', () => {
        expect(Array.isArray(TECHNICAL_OFFICER_ROLES)).toBe(true);
      });

      it('should contain technical roles', () => {
        expect(TECHNICAL_OFFICER_ROLES).toContain('urban_planner');
        expect(TECHNICAL_OFFICER_ROLES).toContain('building_permit_officer');
        expect(TECHNICAL_OFFICER_ROLES).toContain('building_inspector');
        expect(TECHNICAL_OFFICER_ROLES).toContain('suap_officer');
        expect(TECHNICAL_OFFICER_ROLES).toContain('public_works_engineer');
        expect(TECHNICAL_OFFICER_ROLES).toContain('mobility_traffic_engineer');
        expect(TECHNICAL_OFFICER_ROLES).toContain('environment_technician');
        expect(TECHNICAL_OFFICER_ROLES).toContain('external_maintainer');
      });

      it('should have correct length', () => {
        expect(TECHNICAL_OFFICER_ROLES.length).toBe(8);
      });

      it('should not contain non-technical roles', () => {
        expect(TECHNICAL_OFFICER_ROLES).not.toContain('municipal_public_relations_officer');
        expect(TECHNICAL_OFFICER_ROLES).not.toContain('municipal_administrator');
      });

      it('should be a subset of ALLOWED_ROLES', () => {
        TECHNICAL_OFFICER_ROLES.forEach(role => {
          expect(ALLOWED_ROLES).toContain(role);
        });
      });
    });
  });

  describe('reportStatus.js', () => {
    it('should be an object', () => {
      expect(typeof REPORT_STATUSES).toBe('object');
      expect(REPORT_STATUSES).not.toBeNull();
    });

    it('should contain all status constants', () => {
      expect(REPORT_STATUSES).toHaveProperty('PENDING');
      expect(REPORT_STATUSES).toHaveProperty('ACCEPTED');
      expect(REPORT_STATUSES).toHaveProperty('REJECTED');
      expect(REPORT_STATUSES).toHaveProperty('PROGRESS');
      expect(REPORT_STATUSES).toHaveProperty('ASSIGNED');
      expect(REPORT_STATUSES).toHaveProperty('SUSPENDED');
      expect(REPORT_STATUSES).toHaveProperty('RESOLVED');
    });

    it('should have correct status values', () => {
      expect(REPORT_STATUSES.PENDING).toBe('pending');
      expect(REPORT_STATUSES.ACCEPTED).toBe('accepted');
      expect(REPORT_STATUSES.REJECTED).toBe('rejected');
      expect(REPORT_STATUSES.PROGRESS).toBe('progress');
      expect(REPORT_STATUSES.ASSIGNED).toBe('assigned');
      expect(REPORT_STATUSES.SUSPENDED).toBe('suspended');
      expect(REPORT_STATUSES.RESOLVED).toBe('resolved');
    });

    it('should have exactly 7 status constants', () => {
      const keys = Object.keys(REPORT_STATUSES);
      expect(keys.length).toBe(7);
    });

    it('should contain only string values', () => {
      Object.values(REPORT_STATUSES).forEach(status => {
        expect(typeof status).toBe('string');
      });
    });

    it('should not have duplicate values', () => {
      const values = Object.values(REPORT_STATUSES);
      const uniqueValues = [...new Set(values)];
      expect(uniqueValues.length).toBe(values.length);
    });
  });

  describe('reportCategories.js', () => {
    it('should be an array', () => {
      expect(Array.isArray(REPORT_CATEGORIES)).toBe(true);
    });

    it('should contain expected categories', () => {
      expect(REPORT_CATEGORIES).toContain('Water Supply - Drinking Water');
      expect(REPORT_CATEGORIES).toContain('Architectural Barriers');
      expect(REPORT_CATEGORIES).toContain('Sewer System');
      expect(REPORT_CATEGORIES).toContain('Public Lighting');
      expect(REPORT_CATEGORIES).toContain('Waste');
      expect(REPORT_CATEGORIES).toContain('Road Signs and Traffic Lights');
      expect(REPORT_CATEGORIES).toContain('Roads and Urban Furnishings');
      expect(REPORT_CATEGORIES).toContain('Public Green Areas and Playgrounds');
      expect(REPORT_CATEGORIES).toContain('Other');
    });

    it('should have correct length', () => {
      expect(REPORT_CATEGORIES.length).toBe(9);
    });

    it('should contain only string values', () => {
      REPORT_CATEGORIES.forEach(category => {
        expect(typeof category).toBe('string');
        expect(category.length).toBeGreaterThan(0);
      });
    });

    it('should not contain duplicate values', () => {
      const uniqueCategories = [...new Set(REPORT_CATEGORIES)];
      expect(uniqueCategories.length).toBe(REPORT_CATEGORIES.length);
    });

    it('should have "Other" as the last category', () => {
      expect(REPORT_CATEGORIES[REPORT_CATEGORIES.length - 1]).toBe('Other');
    });
  });
});
