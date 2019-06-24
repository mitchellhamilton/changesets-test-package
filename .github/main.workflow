workflow "Create bump branch" {
  on = "push"
  resolves = ["stuff"]
}


action "stuff" {
  uses = "mitchellhamilton/changesets-test-package/filter-action@master"
  secrets = ["GITHUB_TOKEN"]
  args = ""
}

