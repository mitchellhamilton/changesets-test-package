const { Toolkit } = require("actions-toolkit");
const spawn = require("spawndamnit");

// Run your GitHub Action!
Toolkit.run(async tools => {
  let { stdout, stderr } = await spawn(
    "git",
    ["checkout", "changeset-release-branch"],
    { cwd: tools.workspace }
  );
  console.log(stdout.toString("utf8"));
  console.log(stderr.toString("utf8"));
  tools.exit.neutral("No new changesets");
});
