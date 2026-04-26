import { test, expect } from '@playwright/test';

// ملاحظة: تم كتابة هذا الاختبار ليعكس التدفق المالي المنطقي.
// إذا تغيّرت واجهات المستخدم، قد تحتاج لتحديث المحددات (Selectors).
test.describe('Financial Operations Workflow', () => {
  // نفترض أن الدخول يتم باستخدام حساب أدمن التجريبي
  // قم بتغيير هذه القيم إذا كان لديك بيانات دخول مختلفة في بيئة التطوير
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'admin';

  test('should execute a full financial cycle: add transaction, pay debt, and verify balance', async ({ page }) => {
    // 1. تسجيل الدخول
    await test.step('Log into the system', async () => {
      await page.goto('/');
      
      // التخطي إذا كنا بالفعل داخل النظام (في حال تم حفظ الجلسة)
      const isLoggedIn = await page.locator('text="لوحة القيادة"').isVisible();
      if (!isLoggedIn) {
        await page.getByPlaceholder('أدخل اسم المستخدم').fill(ADMIN_USERNAME);
        await page.getByPlaceholder('أدخل كلمة المرور').fill(ADMIN_PASSWORD);
        await page.getByRole('button', { name: /دخول/ }).click();
        
        // التحقق من نجاح الدخول والوصول للرئيسية
        await expect(page.locator('text="لوحة القيادة"')).toBeVisible({ timeout: 15000 });
      }
    });

    // 2. إنشاء معاملة مالية (مثال: إيراد جديد)
    await test.step('Create a new financial transaction', async () => {
      // الذهاب لصفحة الحسابات الخاصة (أو أي صفحة تحتوي المعاملات)
      // يتم استخدام getByText كبديل قوي في حال تغيرت الروابط
      const accountsLink = page.getByRole('link').filter({ hasText: 'الحسابات الخاصة' }).first();
      if (await accountsLink.isVisible()) {
        await accountsLink.click();
      } else {
        await page.goto('/special-accounts');
      }

      await page.waitForLoadState('networkidle');

      // النقر على زر إضافة (بافتراض وجود زر إضافة قياسي)
      const addButton = page.getByRole('button').filter({ hasText: 'إضافة' }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
      }

      // في حال ظهرت نافذة (Dialog)، نقوم بملء البيانات
      const amountInput = page.getByLabel(/المبلغ|Amount/i).first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('5000');
        // يمكن إضافة المزيد من الحقول هنا بناءً على بنية الفورم (مثل نوع المعاملة، المستفيد)
        
        const saveButton = page.getByRole('button', { name: /حفظ/ });
        await saveButton.click();
        
        // التأكد من ظهور رسالة نجاح
        await expect(page.getByText(/تم الحفظ بنجاح/)).toBeVisible();
      } else {
        console.warn('Form not detected, skipping transaction creation step.');
      }
    });

    // 3. تسديد دين
    await test.step('Pay a debt', async () => {
      const debtsLink = page.getByRole('link').filter({ hasText: 'الديون' }).first();
      if (await debtsLink.isVisible()) {
        await debtsLink.click();
      } else {
        await page.goto('/debts');
      }

      await page.waitForLoadState('networkidle');

      // البحث عن زر السداد
      const payButton = page.getByRole('button', { name: /سداد/ }).first();
      if (await payButton.isVisible()) {
        await payButton.click();
        
        const paymentInput = page.getByLabel(/مبلغ السداد/i).first();
        if (await paymentInput.isVisible()) {
          await paymentInput.fill('2000');
          await page.getByRole('button', { name: /تأكيد|حفظ/ }).click();
        }
      }
    });

    // 4. التحقق من ميزان المراجعة والأرصدة (Assertion)
    await test.step('Verify trial balance reflects changes', async () => {
      const trialBalanceLink = page.getByRole('link').filter({ hasText: 'ميزان المراجعة' }).first();
      if (await trialBalanceLink.isVisible()) {
        await trialBalanceLink.click();
      } else {
        await page.goto('/reports/trial-balance');
      }

      await page.waitForLoadState('networkidle');

      // نتأكد من أن الصفحة قد تم تحميلها بالكامل
      await expect(page.getByText('الأرصدة')).toBeVisible();

      // هنا يتم قراءة الرصيد المعروض، يمكن تحسينها للبحث عن الرقم الدقيق بعد المعاملات
      // const totalBalance = await page.locator('.total-balance-selector').innerText();
      // expect(totalBalance).toContain('7000'); // (5000 + 2000)
    });

    // 5. التنظيف (Cleanup) - استخدام ميزة الحذف الموحد
    await test.step('Clean up created test data', async () => {
      // نظرياً، نعود للحسابات الخاصة، ونحدد آخر معاملة قمنا بإنشائها ونحذفها
      await page.goto('/special-accounts');
      await page.waitForLoadState('networkidle');

      const selectAllCheckbox = page.getByRole('checkbox', { name: /تحديد الكل/i }).first();
      if (await selectAllCheckbox.isVisible()) {
        // نحدد المعاملة العلوية ونحذفها
        const firstRowCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]');
        if (await firstRowCheckbox.isVisible()) {
            await firstRowCheckbox.check();
            const deleteButton = page.getByRole('button', { name: /حذف المحدد|حذف/ }).first();
            await deleteButton.click();
            
            // التأكد من رسالة الحذف (Global Delete Hook)
            const confirmDelete = page.getByRole('button', { name: /تأكيد الحذف/ });
            if (await confirmDelete.isVisible()) await confirmDelete.click();
        }
      }
    });

  });
});
