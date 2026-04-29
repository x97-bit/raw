import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '195.35.29.31',
    username: 'root',
    password: "b6t'MT'.t@EsZThz+d/I"
  });

  const result = await ssh.execCommand('cat /etc/alrawi/alrawi.env');
  console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  ssh.dispose();
}

run().catch(console.error);
