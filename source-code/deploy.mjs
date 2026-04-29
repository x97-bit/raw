import { NodeSSH } from 'node-ssh';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const ssh = new NodeSSH();

async function fullDeploy() {
  try {
    console.log("1. Zipping local source-code...");
    const zipPath = path.resolve('../alrawi-source-code.zip');
    
    // Using powershell to compress the folder (excluding node_modules to keep it small)
    // Actually, git archive is much faster and cleaner!
    execSync('git archive -o ../alrawi-source-code.zip HEAD');
    console.log("Zip created at " + zipPath);

    console.log("2. Connecting to VPS...");
    await ssh.connect({
      host: '195.35.29.31',
      username: 'root',
      password: "b6t'MT'.t@EsZThz+d/I"
    });

    console.log("3. Uploading zip file to VPS...");
    await ssh.putFile(zipPath, '/root/alrawi-source-code.zip');
    console.log("Upload complete.");

    console.log("4. Running deploy-on-vps.sh via CHMOD...");
    const result = await ssh.execCommand('chmod +x /root/deploy-on-vps.sh && /root/deploy-on-vps.sh');
    console.log("STDOUT:\n" + result.stdout);
    if (result.stderr) console.error("STDERR:\n" + result.stderr);

    console.log("Deployment fully completed via standard CHMOD method!");
    ssh.dispose();
  } catch (err) {
    console.error("Deployment failed:", err);
    if (ssh.isConnected()) ssh.dispose();
  }
}

fullDeploy();
