import * as fs from "fs";
import { exec } from "child_process";

const COMMIT_HASH_SIZE = 40; //Default for git is md5 = 40 hex characters long
const statePath = "/home/john/code/ci/cistate.json";

interface App {
  name: string;
  repo: string;
  latest: string;
  ciFile: string;
  running: boolean;
}

interface State {
  apps: App[];
}

const ci = () => {
  const ciState = JSON.parse(fs.readFileSync(statePath, "utf8")) as State;

  for (const app of ciState.apps) {
    if (app.running) continue;

    exec(`git ls-remote ${app.repo}`, (error, stdout, stderr) => {
      if (error) {
        console.log(error);
      }
      
      if (stderr) {
        console.log(stderr);
      }

      const mainLine = stdout.split("\n").find((n) => n.includes("heads/main"));
      if (!mainLine) return;

      const main = mainLine.substring(0, COMMIT_HASH_SIZE);
      if (main != app.latest) {
        app.running = true;
        app.latest = main;
        console.log(`Running CI for ${app.name}`);
        fs.writeFileSync(statePath, JSON.stringify(ciState));
        exec(
          `bash /home/john/code/ci/${app.ciFile}`,
          (error, stdout, stderr) => {
            if (error) {
              console.log(`error: ${error.message}`);
            }
            if (stderr) {
              console.log(`stderr: ${stderr}`);
            }
            console.log(stdout);
            app.running = false;
            fs.writeFileSync(statePath, JSON.stringify(ciState));
            console.log(`CI complete for: ${app.name}`);
          }
        );
      }
    });
  }
};

setInterval(ci, 5000);
