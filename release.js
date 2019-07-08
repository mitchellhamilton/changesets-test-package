const fs = require("fs");
const { promisify } = require("util");
const Octokit = require("@octokit/rest");
const _spawn = require("spawndamnit");

let spawn = (command, args) => {
  let child = _spawn(command, args);
  child.on("stdout", data => console.log("stdout: " + data.toString()));
  child.on("stderr", data => console.error("stderr: " + data.toString()));
  return child;
};

(async () => {
  let repo = `${process.env.CIRCLE_PROJECT_USERNAME}/${
    process.env.CIRCLE_PROJECT_REPONAME
  }`;
  let ghUsername = process.env.GITHUB_ACTOR;
  let ghAuthToken = process.env.GITHUB_TOKEN;
  let octokit = new Octokit({
    auth: { username: ghUsername, password: ghAuthToken }
  });

  if (process.env.CIRCLE_BRANCH !== "master") {
    return console.log(
      "Not on master, on branch: " + process.env.CIRCLE_BRANCH
    );
  }

  fs.writeFileSync(
    `${process.env.HOME}/.npmrc`,
    "//registry.npmjs.org/:_authToken=${NPM_TOKEN}"
  );

  // await spawn("yarn", ["release"]);

  // await spawn("git", ["push", "--follow-tags"]);

  let hasChangesets = fs
    .readdirSync(`${process.cwd()}/.changeset`)
    .some(x => x !== "config.js" && x !== "README.md");
  if (!hasChangesets) {
    return console.log("No changesets found");
  }

  let { stdout, stderr } = await spawn("git", [
    "checkout",
    "changeset-release"
  ]);
  let isCreatingChangesetReleaseBranch = !stderr
    .toString()
    .includes("Switched to a new branch 'changeset-release'");
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
    const files = diffOutput.stdout.toString("utf8").trim();
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
    await spawn("git", ["config", "--global", "user.name", `"${ghUsername}"`]);
    await spawn("git", [
      "config",
      "--global",
      "user.email",
      `"${ghUsername}@users.noreply.github.com"`
    ]);
    console.log("setting GitHub credentials");
    fs.writeFileSync(
      `${process.env.HOME}/.netrc`,
      `machine github.com\nlogin ${ghUsername}\npassword ${ghAuthToken}`
    );
    console.log("committing changes");
    await spawn("git", ["commit", "-m", "Bump Packages"]);
    console.log("pushing to remote");
    await spawn("git", ["push", "origin", "changeset-release", "--force"]);
    console.log("searching for pull requests");
    let searchQuery = `repo:${repo}+state:open+head:changeset-release+base:master`;
    console.log("search query: " + searchQuery);
    let searchResult = await octokit.search.issuesAndPullRequests({
      q: searchQuery
    });
    console.log(JSON.stringify(searchResult.data, null, 2));
    if (searchResult.data.items.length === 0) {
      console.log("creating pull request");
      await octokit.pulls.create({
        base: "master",
        head: "changeset-release",
        title: "Bump Packages",
        owner: process.env.CIRCLE_PROJECT_USERNAME,
        repo: process.env.CIRCLE_PROJECT_REPONAME
      });
    } else {
      console.log("pull request found");
    }
  } else {
    console.log("no new changesets");
  }
})();
