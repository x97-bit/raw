import { describe, expect, it } from 'vitest';
import {
  createInitialProfilePasswordForm,
  PROFILE_PASSWORD_REQUIREMENTS_MESSAGE,
  validateProfilePasswordForm,
} from './profilePageHelpers';

describe('profilePageHelpers', () => {
  it('creates the initial password form state', () => {
    expect(createInitialProfilePasswordForm()).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  });

  it('validates password change requirements', () => {
    expect(validateProfilePasswordForm(createInitialProfilePasswordForm())).toBe('يرجى ملء جميع حقول كلمة المرور.');
    expect(validateProfilePasswordForm({
      currentPassword: 'StrongPass1',
      newPassword: 'StrongPass1',
      confirmPassword: 'StrongPass1',
    })).toBe('كلمة المرور الجديدة يجب أن تختلف عن الحالية.');
    expect(validateProfilePasswordForm({
      currentPassword: 'StrongPass1',
      newPassword: '22',
      confirmPassword: '22',
    })).toBe(PROFILE_PASSWORD_REQUIREMENTS_MESSAGE);
    expect(validateProfilePasswordForm({
      currentPassword: 'StrongPass1',
      newPassword: 'NewPass22',
      confirmPassword: 'OtherPass33',
    })).toBe('تأكيد كلمة المرور غير مطابق.');
    expect(validateProfilePasswordForm({
      currentPassword: 'StrongPass1',
      newPassword: 'NewPass22',
      confirmPassword: 'NewPass22',
    })).toBe('');
  });
});
