import { User } from '../../client/models/models';

describe('User Model', () => {
  describe('constructor', () => {
    it('should create a User instance with all properties', () => {
      const user = new User(1, 'john_doe', 'john@example.com', 'John', 'Doe', 'citizen');

      expect(user.id).toBe(1);
      expect(user.username).toBe('john_doe');
      expect(user.email).toBe('john@example.com');
      expect(user.name).toBe('John');
      expect(user.surname).toBe('Doe');
      expect(user.type).toBe('citizen');
    });

    it('should create a User instance with admin type', () => {
      const admin = new User(2, 'admin_user', 'admin@example.com', 'Admin', 'User', 'admin');

      expect(admin.id).toBe(2);
      expect(admin.type).toBe('admin');
    });
  });

  describe('getFullName', () => {
    it('should return the full name of the user', () => {
      const user = new User(1, 'jane_smith', 'jane@example.com', 'Jane', 'Smith', 'citizen');

      expect(user.getFullName()).toBe('Jane Smith');
    });

    it('should handle names with spaces', () => {
      const user = new User(1, 'user', 'user@example.com', 'Mary Jane', 'Watson Parker', 'citizen');

      expect(user.getFullName()).toBe('Mary Jane Watson Parker');
    });

    it('should concatenate name and surname correctly', () => {
      const user = new User(1, 'test', 'test@test.com', 'First', 'Last', 'admin');
      const fullName = user.getFullName();

      expect(fullName).toContain('First');
      expect(fullName).toContain('Last');
      expect(fullName).toBe('First Last');
    });
  });

  describe('isAdmin', () => {
    it('should return true when user type is admin', () => {
      const admin = new User(1, 'admin', 'admin@example.com', 'Admin', 'User', 'admin');

      expect(admin.isAdmin()).toBe(true);
    });

    it('should return false when user type is citizen', () => {
      const citizen = new User(1, 'citizen', 'citizen@example.com', 'Citizen', 'User', 'citizen');

      expect(citizen.isAdmin()).toBe(false);
    });

    it('should return false for other user types', () => {
      const other = new User(1, 'other', 'other@example.com', 'Other', 'User', 'municipal_public_relations_officer');

      expect(other.isAdmin()).toBe(false);
    });
  });

  describe('isCitizen', () => {
    it('should return true when user type is citizen', () => {
      const citizen = new User(1, 'citizen', 'citizen@example.com', 'Citizen', 'User', 'citizen');

      expect(citizen.isCitizen()).toBe(true);
    });

    it('should return false when user type is admin', () => {
      const admin = new User(1, 'admin', 'admin@example.com', 'Admin', 'User', 'admin');

      expect(admin.isCitizen()).toBe(false);
    });

    it('should return false for other user types', () => {
      const other = new User(1, 'other', 'other@example.com', 'Other', 'User', 'urban_planner');

      expect(other.isCitizen()).toBe(false);
    });
  });

  describe('User type checking methods', () => {
    it('should correctly identify admin users', () => {
      const admin = new User(1, 'admin', 'admin@test.com', 'Admin', 'Test', 'admin');

      expect(admin.isAdmin()).toBe(true);
      expect(admin.isCitizen()).toBe(false);
    });

    it('should correctly identify citizen users', () => {
      const citizen = new User(2, 'citizen', 'citizen@test.com', 'Citizen', 'Test', 'citizen');

      expect(citizen.isAdmin()).toBe(false);
      expect(citizen.isCitizen()).toBe(true);
    });

    it('should handle edge cases with empty strings', () => {
      const userWithEmptyType = new User(3, 'empty', 'empty@test.com', 'Empty', 'Test', '');

      expect(userWithEmptyType.isAdmin()).toBe(false);
      expect(userWithEmptyType.isCitizen()).toBe(false);
    });
  });

  describe('User properties', () => {
    it('should have all required properties defined', () => {
      const user = new User(1, 'test', 'test@test.com', 'Test', 'User', 'citizen');

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('surname');
      expect(user).toHaveProperty('type');
    });

    it('should have all required methods defined', () => {
      const user = new User(1, 'test', 'test@test.com', 'Test', 'User', 'citizen');

      expect(typeof user.getFullName).toBe('function');
      expect(typeof user.isAdmin).toBe('function');
      expect(typeof user.isCitizen).toBe('function');
    });
  });
});
