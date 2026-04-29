import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
ssh.connect({ host: '195.35.29.31', username: 'root', password: "b6t'MT'.t@EsZThz+d/I" }).then(async () => {
  const result = await ssh.execCommand('journalctl -u alrawi -n 200 --no-pager | grep -i "error"');
  console.log(result.stdout);
  console.error(result.stderr);
  process.exit(0);
});
