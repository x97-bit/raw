export const createInitialProfilePasswordForm = () => ({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

export const validateProfilePasswordForm = (form) => {
  if (!form?.currentPassword || !form?.newPassword || !form?.confirmPassword) {
    return 'يرجى ملء جميع حقول كلمة المرور.';
  }

  if (form.newPassword.length < 4) {
    return 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل.';
  }

  if (form.currentPassword === form.newPassword) {
    return 'كلمة المرور الجديدة يجب أن تختلف عن الحالية.';
  }

  if (form.newPassword !== form.confirmPassword) {
    return 'تأكيد كلمة المرور غير مطابق.';
  }

  return '';
};
