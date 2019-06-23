const { Toolkit } = require("actions-toolkit");
const _spawn = require("spawndamnit");

// Run your GitHub Action!
Toolkit.run(async tools => {
  let spawn = (command, args) => {
    return _spawn(command, args, { cwd: tools.workspace });
  };

  let { stdout, stderr } = await spawn("git", [
    "checkout",
    "changeset-release"
  ]);
  if (stderr) {
    console.log("creating changeset-release branch");
    await spawn("git", ["checkout", "-b", "changeset-release"]);
  }

  let cmd = await spawnGit(["merge-base", "changeset-release", "master"]);
  const divergedAt = cmd.stdout.trim();

  await spawn("git", ["diff", "--name-only", `${divergedAt}...master`]);
  const files = cmd.stdout.trim();
  if (files.includes(".changeset")) {
    await spawn("yarn");
    await spawn("yarn", ["changeset", "bump"]);
    await spawn("git", ["add", "."]);
    await spawn("git", ["config", "--global", "user.name", "mitchellhamilton"]);
    await spawn("git", [
      "config",
      "--global",
      "user.email",
      "mitchell@hamil.town"
    ]);
    await spawn("git", ["commit", "-m", '"Bump Packages"']);
    console.log("committed the things");
  } else {
    tools.exit.neutral("No new changesets");
  }
});
