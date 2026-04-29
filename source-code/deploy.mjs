import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log("Connecting to VPS...");
    await ssh.connect({
      host: '195.35.29.31',
      username: 'root',
      password: "b6t'MT'.t@EsZThz+d/I"
    });

    console.log("1. Checking if /root/alrawi-source-code is a git repository...");
    let result = await ssh.execCommand('cd /root/alrawi-source-code && git status');
    console.log("STDOUT: " + result.stdout);
    if (result.stderr) console.error("STDERR: " + result.stderr);

    if (!result.stderr.includes('fatal')) {
      console.log("2. Pulling latest code in /root/alrawi-source-code...");
      result = await ssh.execCommand('cd /root/alrawi-source-code && git pull origin main');
      console.log("STDOUT: " + result.stdout);
      
      console.log("3. Syncing to live directory...");
      result = await ssh.execCommand('rsync -a --delete --exclude "node_modules" /root/alrawi-source-code/ /var/www/alrawi/source-code/');
      console.log("STDOUT: " + result.stdout);
      
      console.log("4. Building live directory...");
      result = await ssh.execCommand('export PATH=$PATH:/root/.local/share/pnpm:/root/.nvm/versions/node/v20.12.0/bin && cd /var/www/alrawi/source-code && pnpm install --frozen-lockfile && pnpm run build');
      console.log("STDOUT: " + result.stdout);
      
      console.log("5. Restarting service...");
      result = await ssh.execCommand('systemctl restart alrawi');
      console.log("STDOUT: " + result.stdout);
    } else {
      console.log("It's not a git repository. Zipping from Github...");
      result = await ssh.execCommand('cd /root && rm -rf temp-clone && git clone https://github.com/x97-bit/raw.git temp-clone && rsync -a temp-clone/ /var/www/alrawi/source-code/ && export PATH=$PATH:/root/.local/share/pnpm:/root/.nvm/versions/node/v20.12.0/bin && cd /var/www/alrawi/source-code && pnpm install && pnpm run build && systemctl restart alrawi && rm -rf /root/temp-clone');
      console.log("STDOUT: " + result.stdout);
      if (result.stderr) console.error("STDERR: " + result.stderr);
    }

    console.log("Deployment complete!");
    ssh.dispose();
  } catch (err) {
    console.error("Deployment failed:", err);
    ssh.dispose();
  }
}

deploy();
