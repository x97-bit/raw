import { PASSWORD_MIN_LENGTH, isStrongPassword } from '../../../../shared/passwordPolicy';

export const PROFILE_PASSWORD_REQUIREMENTS_MESSAGE = `يجب أن تتكون كلمة المرور الجديدة من ${PASSWORD_MIN_LENGTH} أحرف على الأقل وأن تتضمن حرفًا كبيرًا وحرفًا صغيرًا ورقمًا.`;

export const createInitialProfilePasswordForm = () => ({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

export const validateProfilePasswordForm = (form) => {
  if (!form?.currentPassword || !form?.newPassword || !form?.confirmPassword) {
    return 'يرجى ملء جميع حقول كلمة المرور.';
  }

  if (!isStrongPassword(form.newPassword)) {
    return PROFILE_PASSWORD_REQUIREMENTS_MESSAGE;
  }

  if (form.currentPassword === form.newPassword) {
    return 'كلمة المرور الجديدة يجب أن تختلف عن الحالية.';
  }

  if (form.newPassword !== form.confirmPassword) {
    return 'تأكيد كلمة المرور غير مطابق.';
  }

  return '';
};
