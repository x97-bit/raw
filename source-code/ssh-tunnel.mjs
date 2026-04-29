import { NodeSSH } from 'node-ssh';
import net from 'net';

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '195.35.29.31',
    username: 'root',
    password: "b6t'MT'.t@EsZThz+d/I"
  });

  console.log("SSH connected. Setting up tunnel on localhost:3307 -> VPS:3306...");

  const server = net.createServer((localSocket) => {
    ssh.forwardOut('127.0.0.1', 0, '127.0.0.1', 3306).then((remoteSocket) => {
      localSocket.pipe(remoteSocket);
      remoteSocket.pipe(localSocket);
    }).catch((err) => {
      console.error("Tunnel error:", err.message);
      localSocket.destroy();
    });
  });

  server.listen(3307, '127.0.0.1', () => {
    console.log("SSH Tunnel ready: localhost:3307 -> VPS MySQL:3306");
    console.log("Keep this running while you use the dev server.");
  });

  server.on('error', (err) => {
    console.error("Server error:", err.message);
  });
}

run().catch(console.error);
