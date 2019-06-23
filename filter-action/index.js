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
  let isCreatingChangesetReleaseBranch = !!stderr;
  if (isCreatingChangesetReleaseBranch) {
    console.log("creating changeset-release branch");
    await spawn("git", ["checkout", "-b", "changeset-release"]);
  }

  let shouldBump = isCreatingChangesetReleaseBranch;

  if (!shouldBump) {
    let cmd = await spawn("git", ["merge-base", "changeset-release", "master"]);
    const divergedAt = cmd.stdout.toString("utf8").trim();

    let diffOutput = await spawn("git", [
      "diff",
      "--name-only",
      `${divergedAt}...master`
    ]);
    const files = diffOutput.stdout.toString("uf8").trim();
    shouldBump = files.includes(".changeset");
  }
  if (shouldBump) {
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
