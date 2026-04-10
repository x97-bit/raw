import { describe, expect, it } from 'vitest';
import { createInitialProfilePasswordForm, validateProfilePasswordForm } from './profilePageHelpers';

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
      currentPassword: '1111',
      newPassword: '1111',
      confirmPassword: '1111',
    })).toBe('كلمة المرور الجديدة يجب أن تختلف عن الحالية.');
    expect(validateProfilePasswordForm({
      currentPassword: '1111',
      newPassword: '22',
      confirmPassword: '22',
    })).toBe('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل.');
    expect(validateProfilePasswordForm({
      currentPassword: '1111',
      newPassword: '2222',
      confirmPassword: '3333',
    })).toBe('تأكيد كلمة المرور غير مطابق.');
    expect(validateProfilePasswordForm({
      currentPassword: '1111',
      newPassword: '2222',
      confirmPassword: '2222',
    })).toBe('');
  });
});
