import { ALL_USER_PERMISSION_KEYS } from './usersManagementConfig';

export const createInitialUserForm = () => ({
  username: '',
  password: '',
  fullName: '',
  role: 'user',
});

export const normalizePermissionList = (permissions = []) => Array.from(new Set((permissions || []).filter(Boolean)));

export const buildCreateUserPayload = (form) => ({
  username: form?.username?.trim?.() || '',
  password: form?.password || '',
  fullName: form?.fullName?.trim?.() || '',
  role: form?.role || 'user',
});

export const buildUserUpdatePayload = (user) => ({
  fullName: user?.FullName?.trim?.() || '',
  role: user?.Role || 'user',
  isActive: user?.IsActive ? 1 : 0,
});

export const buildPermissionsPayload = (permissions) => ({
  permissions: normalizePermissionList(permissions),
});

export const validateNewUserForm = (form) => {
  if (!form?.fullName?.trim?.() || !form?.username?.trim?.() || !form?.password) {
    return 'جميع الحقول مطلوبة';
  }

  return '';
};

export const validateResetPassword = (newPassword) => {
  if (!newPassword || newPassword.length < 4) {
    return 'كلمة المرور يجب أن تكون 4 أحرف على الأقل';
  }

  return '';
};

export const generateTemporaryPassword = (length = 12) => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const safeLength = Math.max(8, Math.min(32, Number(length) || 12));

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const values = new Uint32Array(safeLength);
    crypto.getRandomValues(values);
    return Array.from(values, (value) => charset[value % charset.length]).join('');
  }

  return Array.from({ length: safeLength }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
};

export const togglePermissionSelection = (permissions, key) => (
  permissions.includes(key)
    ? permissions.filter((permission) => permission !== key)
    : [...permissions, key]
);

export const selectAllPermissions = () => [...ALL_USER_PERMISSION_KEYS];

export const clearPermissions = () => [];
