import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { buildMySqlConnectionOptions } from '../../shared/scriptMysqlConfig.mjs';

async function seed() {
  const conn = await mysql.createConnection(buildMySqlConnectionOptions(process.env.DATABASE_URL));

  try {
    const hashedPassword = await bcrypt.hash('admin', 10);
    await conn.query(
      `INSERT IGNORE INTO app_users (username, password, name, role, permissions, active) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'admin',
        hashedPassword,
        'المدير',
        'admin',
        JSON.stringify([
          'port-1',
          'port-2',
          'port-3',
          'transport',
          'partnership',
          'fx',
          'debts',
          'special',
          'reports',
          'add_invoice',
          'add_payment',
          'edit_transaction',
          'delete_transaction',
          'export',
          'add_trader',
          'manage_debts',
        ]),
        1,
      ],
    );
    console.log('Admin user created (admin/admin)');

    const goodsTypes = [
      'مواد غذائية',
      'مواد بناء',
      'أجهزة كهربائية',
      'قطع غيار',
      'ملابس',
      'أدوية',
      'مواد كيميائية',
      'أثاث',
      'مواد زراعية',
      'نفط ومشتقات',
      'حديد وصلب',
      'خشب',
      'بلاستيك',
      'ورق',
      'أخرى',
    ];
    for (const name of goodsTypes) {
      await conn.query(`INSERT IGNORE INTO goods_types (name) VALUES (?)`, [name]);
    }
    console.log('Goods types seeded');

    const govs = [
      'بغداد',
      'البصرة',
      'نينوى',
      'أربيل',
      'النجف',
      'كربلاء',
      'ذي قار',
      'الأنبار',
      'ديالى',
      'واسط',
      'ميسان',
      'المثنى',
      'القادسية',
      'صلاح الدين',
      'كركوك',
      'بابل',
      'دهوك',
      'السليمانية',
    ];
    for (const name of govs) {
      await conn.query(`INSERT IGNORE INTO governorates (name) VALUES (?)`, [name]);
    }
    console.log('Governorates seeded');

    const portsData = [
      { portId: 'port-1', name: 'السعودية', section: 'ports' },
      { portId: 'port-2', name: 'المنذرية', section: 'ports' },
      { portId: 'port-3', name: 'القائم', section: 'ports' },
      { portId: 'transport-1', name: 'النقل', section: 'transport' },
      { portId: 'partnership-1', name: 'شراكة', section: 'partnership' },
      { portId: 'fx-1', name: 'صرافة', section: 'fx' },
    ];
    for (const port of portsData) {
      await conn.query(
        `INSERT IGNORE INTO ports (portId, name, section) VALUES (?, ?, ?)`,
        [port.portId, port.name, port.section],
      );
    }
    console.log('Ports seeded');

    const accountTypes = [
      { typeId: 'port-1', name: 'منفذ السعودية' },
      { typeId: 'port-2', name: 'منفذ المنذرية' },
      { typeId: 'port-3', name: 'منفذ القائم' },
      { typeId: 'transport', name: 'نقل' },
      { typeId: 'partnership', name: 'شراكة' },
      { typeId: 'fx', name: 'صرافة' },
    ];
    for (const accountType of accountTypes) {
      await conn.query(
        `INSERT IGNORE INTO account_types (typeId, name) VALUES (?, ?)`,
        [accountType.typeId, accountType.name],
      );
    }
    console.log('Account types seeded');

    console.log('Database seeded successfully!');
  } finally {
    await conn.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
