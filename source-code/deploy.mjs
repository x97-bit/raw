import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '195.35.29.31',
    username: 'root',
    password: "b6t'MT'.t@EsZThz+d/I"
  });

  console.log("Connected to SSH.");

  // Find where the app is. usually /root/raw or something similar.
  // console.log("Uploading alrawi-source-code.zip...");
  // await ssh.putFile('../alrawi-source-code.zip', '/root/alrawi-source-code.zip');
  // console.log("Upload complete.");

  console.log("Installing missing Puppeteer dependencies...");
  const result = await ssh.execCommand('apt-get update && apt-get install -y libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgtk-3-0 && systemctl restart alrawi', {
    onStdout(chunk) { console.log(chunk.toString('utf8')); },
    onStderr(chunk) { console.error(chunk.toString('utf8')); }
  });
  
  console.log('Dependencies installed with code:', result.code);

  ssh.dispose();
}

run().catch(console.error);
