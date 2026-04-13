import { describe, expect, it } from 'vitest';
import { isStrongPassword } from '../../../../shared/passwordPolicy';
import {
  buildCreateUserPayload,
  buildPermissionsPayload,
  buildUserUpdatePayload,
  clearPermissions,
  createInitialUserForm,
  generateTemporaryPassword,
  normalizePermissionList,
  PASSWORD_REQUIREMENTS_MESSAGE,
  selectAllPermissions,
  togglePermissionSelection,
  validateNewUserForm,
  validateResetPassword,
} from './usersManagementHelpers';

describe('usersManagementHelpers', () => {
  it('creates a stable initial user form', () => {
    expect(createInitialUserForm()).toEqual({
      username: '',
      password: '',
      fullName: '',
      role: 'user',
    });
  });

  it('validates required create-user fields and password strength', () => {
    expect(validateNewUserForm(createInitialUserForm()))
      .toBe('جميع الحقول مطلوبة');

    expect(validateNewUserForm({
      username: 'admin',
      password: '1234',
      fullName: 'Admin User',
      role: 'admin',
    })).toBe(PASSWORD_REQUIREMENTS_MESSAGE);

    expect(validateNewUserForm({
      username: 'admin',
      password: 'StrongPass1',
      fullName: 'Admin User',
      role: 'admin',
    })).toBe('');
  });

  it('validates password reset strength', () => {
    expect(validateResetPassword('123')).toBe(PASSWORD_REQUIREMENTS_MESSAGE);
    expect(validateResetPassword('StrongPass1')).toBe('');
  });

  it('generates a temporary password with a safe default length', () => {
    const password = generateTemporaryPassword();

    expect(password).toHaveLength(12);
    expect(password).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%]+$/);
    expect(isStrongPassword(password)).toBe(true);
  });

  it('toggles and normalizes permission selections', () => {
    expect(togglePermissionSelection(['reports'], 'debts')).toEqual(['reports', 'debts']);
    expect(togglePermissionSelection(['reports', 'debts'], 'reports')).toEqual(['debts']);
    expect(normalizePermissionList(['reports', 'reports', '', null, 'debts'])).toEqual(['reports', 'debts']);
    expect(clearPermissions()).toEqual([]);
    expect(selectAllPermissions()).toContain('reports');
  });

  it('builds API payloads from editable state', () => {
    expect(buildCreateUserPayload({
      username: '  admin  ',
      password: 'StrongPass1',
      fullName: '  المدير  ',
      role: 'admin',
    })).toEqual({
      username: 'admin',
      password: 'StrongPass1',
      fullName: 'المدير',
      role: 'admin',
    });

    expect(buildUserUpdatePayload({
      FullName: '  مستخدم  ',
      Role: 'user',
      IsActive: 0,
    })).toEqual({
      fullName: 'مستخدم',
      role: 'user',
      isActive: 0,
    });

    expect(buildPermissionsPayload(['reports', 'reports', 'debts'])).toEqual({
      permissions: ['reports', 'debts'],
    });
  });
});
