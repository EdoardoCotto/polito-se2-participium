import API from '../../client/API/API';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Session Management', () => {
    describe('login', () => {
      it('should login successfully', async () => {
        const mockUser = { id: 1, username: 'testuser', type: 'citizen' };
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        });

        const result = await API.login({ username: 'testuser', password: 'pass123' });

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/sessions',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          })
        );
        expect(result).toEqual(mockUser);
      });

      it('should throw error on failed login', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Invalid credentials' }),
        });

        await expect(API.login({ username: 'wrong', password: 'wrong' }))
          .rejects.toThrow('Invalid credentials');
      });
    });

    describe('logout', () => {
      it('should logout successfully', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Logged out' }),
        });

        const result = await API.logout();

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/sessions/current',
          expect.objectContaining({
            method: 'DELETE',
            credentials: 'include',
          })
        );
        expect(result).toEqual({ message: 'Logged out' });
      });
    });

    describe('getCurrentUser', () => {
      it('should return user when authenticated', async () => {
        const mockUser = { id: 1, username: 'testuser' };
        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockUser,
        });

        const result = await API.getCurrentUser();

        expect(result).toEqual(mockUser);
      });

      it('should return null when not authenticated (401)', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

        const result = await API.getCurrentUser();

        expect(result).toBeNull();
      });
    });
  });

  describe('User Management', () => {
    describe('register', () => {
      it('should register a new user', async () => {
        const mockUser = { id: 1, username: 'newuser' };
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        });

        const userData = {
          username: 'newuser',
          email: 'new@example.com',
          password: 'pass123',
          name: 'John',
          surname: 'Doe',
        };

        const result = await API.register(userData);

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/users',
          expect.objectContaining({
            method: 'POST',
            credentials: 'include',
          })
        );
        expect(result).toEqual(mockUser);
      });

      it('should throw error on registration conflict', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Username already exists' }),
        });

        await expect(API.register({ username: 'existing' }))
          .rejects.toThrow('Username already exists');
      });
    });

    describe('createUserByAdmin', () => {
      it('should create user as admin', async () => {
        const mockUser = { id: 2, username: 'planner1', type: 'urban_planner' };
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        });

        const result = await API.createUserByAdmin({
          username: 'planner1',
          email: 'planner@example.com',
          password: 'pass123',
          name: 'Jane',
          surname: 'Smith',
          type: 'urban_planner',
        });

        expect(result).toEqual(mockUser);
      });
    });

    describe('assignUserRole', () => {
      it('should assign role to user', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 5, type: 'urban_planner' }),
        });

        const result = await API.assignUserRole(5, 'urban_planner');

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/users/5/type',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ type: 'urban_planner' }),
          })
        );
        expect(result.type).toBe('urban_planner');
      });
    });

    describe('getAllowedRoles', () => {
      it('should get allowed roles', async () => {
        const mockRoles = { roles: ['citizen', 'admin', 'urban_planner'] };
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockRoles,
        });

        const result = await API.getAllowedRoles();

        expect(result).toEqual(mockRoles);
      });
    });

    describe('getMunicipalityUsers', () => {
      it('should get municipality users', async () => {
        const mockUsers = [{ id: 1, username: 'planner1' }];
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsers,
        });

        const result = await API.getMunicipalityUsers();

        expect(result).toEqual(mockUsers);
      });
    });

    describe('updateUserProfile', () => {
      it('should update user profile', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1, telegram_nickname: '@john' }),
        });

        const result = await API.updateUserProfile(1, {
          telegram_nickname: '@john',
          mail_notifications: true,
        });

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/users/1/update',
          expect.objectContaining({
            method: 'PUT',
            credentials: 'include',
          })
        );
        expect(result.id).toBe(1);
      });
    });

    describe('getExternalMaintainers', () => {
      it('should get external maintainers', async () => {
        const mockMaintainers = [{ id: 1, type: 'external_maintainer' }];
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockMaintainers,
        });

        const result = await API.getExternalMaintainers();

        expect(result).toEqual(mockMaintainers);
      });
    });
  });

  describe('Report Management', () => {
    describe('createReport', () => {
      it('should create a report with files', async () => {
        const mockReport = { id: 1, title: 'Test Report' };
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReport,
        });

        const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const result = await API.createReport({
          title: 'Test Report',
          description: 'Description',
          category: 'Roads',
          latitude: 45.0,
          longitude: 7.0,
          files: [mockFile],
        });

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/reports',
          expect.objectContaining({
            method: 'POST',
            credentials: 'include',
          })
        );
        expect(result).toEqual(mockReport);
      });
    });

    describe('createAnonymousReport', () => {
      it('should create an anonymous report', async () => {
        const mockReport = { id: 2, title: 'Anonymous Report', anonymous: true };
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReport,
        });

        const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const result = await API.createAnonymousReport({
          title: 'Anonymous Report',
          description: 'Description',
          category: 'Public Lighting',
          latitude: 45.0,
          longitude: 7.0,
          files: [mockFile],
        });

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/reports/anonymous',
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(result.anonymous).toBe(true);
      });
    });

    describe('getPendingReports', () => {
      it('should get pending reports', async () => {
        const mockReports = [{ id: 1, status: 'pending' }];
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReports,
        });

        const result = await API.getPendingReports();

        expect(result).toEqual(mockReports);
      });
    });

    describe('getReportById', () => {
      it('should get report by ID', async () => {
        const mockReport = { id: 42, title: 'Test Report' };
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReport,
        });

        const result = await API.getReportById(42);

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/reports/42',
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockReport);
      });
    });

    describe('reviewReport', () => {
      it('should review report with acceptance', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1, status: 'accepted' }),
        });

        const result = await API.reviewReport(1, {
          status: 'accepted',
          technicalOffice: 'urban_planner',
        });

        expect(result.status).toBe('accepted');
      });

      it('should review report with rejection', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1, status: 'rejected' }),
        });

        const result = await API.reviewReport(1, {
          status: 'rejected',
          explanation: 'Invalid report',
        });

        expect(result.status).toBe('rejected');
      });
    });

    describe('getApprovedReports', () => {
      it('should get approved reports without bounding box', async () => {
        const mockReports = [{ id: 1, status: 'approved' }];
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReports,
        });

        const result = await API.getApprovedReports();

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/reports/approved',
          expect.any(Object)
        );
        expect(result).toEqual(mockReports);
      });

      it('should get approved reports with bounding box', async () => {
        const mockReports = [{ id: 1 }];
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReports,
        });

        const result = await API.getApprovedReports({
          north: 45.1,
          south: 45.0,
          east: 7.1,
          west: 7.0,
        });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('north=45.1'),
          expect.any(Object)
        );
        expect(result).toEqual(mockReports);
      });
    });

    describe('getCitizenReports', () => {
      it('should get citizen reports', async () => {
        const mockReports = [{ id: 1 }];
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReports,
        });

        const result = await API.getCitizenReports();

        expect(result).toEqual(mockReports);
      });

      it('should get citizen reports with bounding box', async () => {
        const mockReports = [{ id: 1 }];
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReports,
        });

        await API.getCitizenReports({ north: 45.1, south: 45.0, east: 7.1, west: 7.0 });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('?north=45.1'),
          expect.any(Object)
        );
      });
    });

    describe('getAssignedReports', () => {
      it('should get assigned reports', async () => {
        const mockReports = [{ id: 1, status: 'assigned' }];
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReports,
        });

        const result = await API.getAssignedReports();

        expect(result).toEqual(mockReports);
      });
    });

    describe('assignReportToExternalMaintainer', () => {
      it('should assign report to external maintainer', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1, externalMaintainerId: 5 }),
        });

        const result = await API.assignReportToExternalMaintainer(1, 5);

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/reports/1/assign-external',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ externalMaintainerId: 5 }),
          })
        );
        expect(result.externalMaintainerId).toBe(5);
      });
    });

    describe('updateMaintainerStatus', () => {
      it('should update maintainer status', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 1, status: 'progress' }),
        });

        const result = await API.updateMaintainerStatus(1, 'progress');

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/reports/1/status',
          expect.objectContaining({
            body: JSON.stringify({ status: 'progress' }),
          })
        );
        expect(result.status).toBe('progress');
      });
    });

    describe('getExternalAssignedReports', () => {
      it('should get assigned reports for external maintainer', async () => {
        const mockReports = [{ id: 1, status: 'assigned', externalMaintainerId: 5 }];
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockReports,
        });

        const result = await API.getExternalAssignedReports();

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/reports/external/assigned',
          expect.objectContaining({
            method: 'GET',
            credentials: 'include',
          })
        );
        expect(result).toEqual(mockReports);
      });
    });
  });

  describe('Comment Management', () => {
    describe('createComment', () => {
      it('should create a comment', async () => {
        const mockComment = { id: 1, reportId: 42, comment: 'Test comment' };
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockComment,
        });

        const result = await API.createComment(42, 'Test comment');

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/comment/42/comments',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ comment: 'Test comment' }),
          })
        );
        expect(result).toEqual(mockComment);
      });
    });

    describe('getComments', () => {
      it('should get comments for a report', async () => {
        const mockComments = [{ id: 1, comment: 'Comment 1' }];
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockComments,
        });

        const result = await API.getComments(42);

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/comment/42/comments',
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockComments);
      });
    });
  });

  describe('Constants', () => {
    describe('getCategories', () => {
      it('should get categories', async () => {
        const mockCategories = ['Roads', 'Public Lighting', 'Water Supply'];
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        });

        const result = await API.getCategories();

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/categories',
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockCategories);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error response with error field', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Custom error message' }),
      });

      await expect(API.login({ username: 'test', password: 'test' }))
        .rejects.toThrow('Custom error message');
    });

    it('should handle error response with message field', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Another error format' }),
      });

      await expect(API.logout())
        .rejects.toThrow('Another error format');
    });

    it('should use default message when no error details', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(API.getPendingReports())
        .rejects.toThrow('Failed to get pending reports');
    });

    it('should handle non-JSON error response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // The error from json() parsing is caught and re-thrown
      await expect(API.getCurrentUser())
        .rejects.toThrow('Invalid JSON');
    });

    it('should handle failed requests with error branches', async () => {
      // Test createReport error
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create report' }),
      });

      await expect(API.createReport({
        title: 'Test',
        description: 'Test',
        category: 'Roads',
        latitude: 45,
        longitude: 7,
        files: [],
      })).rejects.toThrow('Failed to create report');
    });

    it('should handle failed anonymous report creation', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create anonymous report' }),
      });

      await expect(API.createAnonymousReport({
        title: 'Test',
        description: 'Test',
        category: 'Roads',
        latitude: 45,
        longitude: 7,
        files: [],
      })).rejects.toThrow();
    });

    it('should handle failed getReportById', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Report not found' }),
      });

      await expect(API.getReportById(999)).rejects.toThrow('Report not found');
    });

    it('should handle failed reviewReport', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(API.reviewReport(1, { status: 'accepted' }))
        .rejects.toThrow('Unauthorized');
    });

    it('should handle failed getApprovedReports', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(API.getApprovedReports()).rejects.toThrow('Server error');
    });

    it('should handle failed getCitizenReports', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Forbidden' }),
      });

      await expect(API.getCitizenReports()).rejects.toThrow('Forbidden');
    });

    it('should handle failed getAssignedReports', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Not authorized' }),
      });

      await expect(API.getAssignedReports()).rejects.toThrow('Not authorized');
    });

    it('should handle failed getExternalMaintainers', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Access denied' }),
      });

      await expect(API.getExternalMaintainers()).rejects.toThrow('Access denied');
    });

    it('should handle failed assignReportToExternalMaintainer', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Assignment failed' }),
      });

      await expect(API.assignReportToExternalMaintainer(1, 5))
        .rejects.toThrow('Assignment failed');
    });

    it('should handle failed updateMaintainerStatus', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Status update failed' }),
      });

      await expect(API.updateMaintainerStatus(1, 'progress'))
        .rejects.toThrow('Status update failed');
    });

    it('should handle failed getExternalAssignedReports', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Not authorized' }),
      });

      await expect(API.getExternalAssignedReports())
        .rejects.toThrow('Not authorized');
    });

    it('should handle failed getCategories', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot load categories' }),
      });

      await expect(API.getCategories()).rejects.toThrow('Cannot load categories');
    });

    it('should handle failed createComment', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Comment creation failed' }),
      });

      await expect(API.createComment(1, 'test'))
        .rejects.toThrow('Comment creation failed');
    });

    it('should handle failed getComments', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot retrieve comments' }),
      });

      await expect(API.getComments(1))
        .rejects.toThrow('Cannot retrieve comments');
    });

    it('should handle failed assignUserRole', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Role assignment failed' }),
      });

      await expect(API.assignUserRole(1, 'admin'))
        .rejects.toThrow('Role assignment failed');
    });

    it('should handle failed getAllowedRoles', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot get roles' }),
      });

      await expect(API.getAllowedRoles())
        .rejects.toThrow('Cannot get roles');
    });

    it('should handle failed getMunicipalityUsers', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Access denied' }),
      });

      await expect(API.getMunicipalityUsers())
        .rejects.toThrow('Access denied');
    });

    it('should handle failed updateUserProfile with photo', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      });

      const mockFile = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
      await expect(API.updateUserProfile(1, {
        telegram_nickname: '@test',
        personal_photo: mockFile,
        photo_action: 'upload',
      })).rejects.toThrow('Update failed');
    });

    it('should handle failed createUserByAdmin', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Creation failed' }),
      });

      await expect(API.createUserByAdmin({
        username: 'test',
        email: 'test@test.com',
        password: 'pass',
        name: 'Test',
        surname: 'User',
        type: 'citizen',
      })).rejects.toThrow('Creation failed');
    });
  });
});
