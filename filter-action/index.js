const { Toolkit } = require("actions-toolkit");
const fs = require("fs");
const { promisify } = require("util");
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
    await spawn("git", [
      "config",
      "--global",
      "user.name",
      `"${process.env.GITHUB_ACTOR}"`
    ]);
    await spawn("git", [
      "config",
      "--global",
      "user.email",
      `"${process.env.GITHUB_ACTOR}@users.noreply.github.com"`
    ]);

    await spawn("git", ["commit", "-m", '"Bump Packages"']);

    fs.writeFileSync(
      `${process.env.HOME}/.netrc`,
      `machine github.com\nlogin ${process.env.GITHUB_ACTOR}\npassword ${
        process.env.GITHUB_TOKEN
      }`
    );
    await spawn("git", ["commit", "-m", '"Bump Packages"']);
    await spawn("git", ["push", "origin", "changeset-release"]);

    console.log("committed the things");
  } else {
    tools.exit.neutral("No new changesets");
  }
});
