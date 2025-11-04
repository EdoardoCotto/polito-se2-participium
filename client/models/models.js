/**
 * Data Models for Participium Frontend
 * Contains class definitions for data objects
 */

/**
 * User Model
 */
class User {
  constructor(id, username, email, name, surname, type) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.name = name;
    this.surname = surname;
    this.type = type; // 'citizen' or 'admin'
  }

  /**
   * Get full name
   * @returns {string}
   */
  getFullName() {
    return `${this.name} ${this.surname}`;
  }

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  isAdmin() {
    return this.type === 'admin';
  }

  /**
   * Check if user is citizen
   * @returns {boolean}
   */
  isCitizen() {
    return this.type === 'citizen';
  }
}

export { User };