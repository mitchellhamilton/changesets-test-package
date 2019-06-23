const { Toolkit } = require("actions-toolkit");
const spawn = require("spawndamnit");

// Run your GitHub Action!
Toolkit.run(async tools => {
  let execGit = args => {
    return spawn("git", args, { cwd: tools.workspace });
  };
  let { stdout, stderr } = await execGit(["checkout", "changeset-release"]);
  if (stderr) {
    console.log("creating changeset-release branch");
    await execGit(["checkout", "-b", "changeset-release"]);
  }
  let { stdout } = await execGit(["status"]);
  console.log(stdout.toString("utf8"));
  tools.exit.neutral("No new changesets");
});
