import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '195.35.29.31',
    username: 'root',
    password: "b6t'MT'.t@EsZThz+d/I"
  });

  console.log("Connected to SSH.");

  console.log("Uploading alrawi-source-code.zip...");
  await ssh.putFile('../alrawi-source-code.zip', '/root/alrawi-source-code.zip');
  console.log("Upload complete.");

  console.log("Deploying via remote script...");
  const result = await ssh.execCommand('bash -x /root/deploy-on-vps.sh', {
    onStdout(chunk) { console.log(chunk.toString('utf8')); },
    onStderr(chunk) { console.error(chunk.toString('utf8')); }
  });
  
  if (result.code !== 0) {
      console.log("Fixing pnpm lockfile and building manually...");
      const result2 = await ssh.execCommand('cd /var/www/alrawi/source-code && corepack enable && pnpm install --no-frozen-lockfile && pnpm build && systemctl restart alrawi', {
        onStdout(chunk) { console.log(chunk.toString('utf8')); },
        onStderr(chunk) { console.error(chunk.toString('utf8')); }
      });
      console.log('Build finished with code:', result2.code);
  }

  ssh.dispose();
}

run().catch(console.error);
