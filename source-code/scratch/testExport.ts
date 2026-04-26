import { buildBackupPayload } from "../server/routes/backups/shared";
import "dotenv/config";

async function run() {
  try {
    console.log("Generating payload...");
    const payload = await buildBackupPayload({ templateOnly: false, generatedBy: "MCP Simulation" });
    console.log("Payload generated successfully!");
    console.log("Checksum:", payload.meta.checksum);
    console.log("Version:", payload.meta.version);
    console.log("Tables Exported:", Object.keys(payload.data).join(", "));
    
    // Check if app_users password was masked
    const appUsers = payload.data["app_users"];
    if (appUsers && appUsers.length > 0) {
      console.log("Sample app_user password:", appUsers[0].password);
    }
  } catch (err) {
    console.error("Export failed:", err);
  }
}

run();
