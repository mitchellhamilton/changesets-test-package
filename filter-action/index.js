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
    console.log("checking if new changesets should be added");
    let cmd = await spawn("git", ["merge-base", "changeset-release", "master"]);
    const divergedAt = cmd.stdout.toString("utf8").trim();

    let diffOutput = await spawn("git", [
      "diff",
      "--name-only",
      `${divergedAt}...master`
    ]);
    const files = diffOutput.stdout.toString("uf8").trim();
    shouldBump = files.includes(".changeset");
    console.log("checked if new changesets should be added " + shouldBump);
  }
  if (shouldBump) {
    console.log("reseting branch to master");
    await spawn("git", ["reset", "--hard", "master"]);
    console.log("installing packages");
    await spawn("yarn");
    console.log("bumping packages");
    await spawn("yarn", ["changeset", "bump"]);
    console.log("adding changes to git");
    await spawn("git", ["add", "."]);
    console.log("setting git user");
    await spawn("git", [
      "config",
      "--global",
      "user.name",
      `"github-actions[bot]"`
    ]);
    await spawn("git", [
      "config",
      "--global",
      "user.email",
      `"github-actions[bot]@users.noreply.github.com"`
    ]);
    console.log("setting GitHub credentials");
    fs.writeFileSync(
      `${process.env.HOME}/.netrc`,
      `machine github.com\nlogin ${process.env.GITHUB_ACTOR}\npassword ${
        process.env.GITHUB_TOKEN
      }`
    );
    console.log("committing changes");
    await spawn("git", ["commit", "-m", '"Bump Packages"']);
    console.log("pushing to remote");
    await spawn("git", ["push", "origin", "changeset-release", "--force"]);
    console.log("searching for pull requests");
    let searchQuery = `repo:${
      process.env.GITHUB_REPOSITORY
    }+state:open+head:changeset-release+base:master`;
    console.log("search query: " + searchQuery);
    let searchResult = await tools.github.search.issuesAndPullRequests({
      q: searchQuery
    });
    console.log(JSON.stringify(searchResult.data, null, 2));
    if (searchResult.data.items.length === 0) {
      console.log("creating pull request");
      await tools.github.pulls.create({
        base: "master",
        head: "changeset-release",
        ...tools.context.repo,
        title: "Bump Packages"
      });
    } else {
      console.log("pull request found");
    }
  } else {
    tools.exit.neutral("No new changesets");
  }
});
