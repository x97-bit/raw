import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function runMigration() {
  try {
    await ssh.connect({
      host: '195.35.29.31',
      username: 'root',
      password: "b6t'MT'.t@EsZThz+d/I"
    });

    console.log("Connected to VPS. Running migration...");
    const result = await ssh.execCommand('mysql -u alrawi_user -pAlrawiDb2026Safe alrawi_db -e "ALTER TABLE app_users MODIFY COLUMN role ENUM(\'admin\',\'user\',\'merchant\') NOT NULL DEFAULT \'user\'; ALTER TABLE app_users ADD account_id int;"');
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
    console.log("Migration complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runMigration();
