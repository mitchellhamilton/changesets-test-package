const { Toolkit } = require("actions-toolkit");
const spawn = require("spawndamnit");

// Run your GitHub Action!
Toolkit.run(async tools => {
  let { stdout, stderr } = await spawn("git", [
    "checkout",
    "changeset-release-branch"
  ]);
  console.log(stdout);
  console.log(stderr);
  tools.exit.neutral("No new changesets");
});
