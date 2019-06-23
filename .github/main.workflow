workflow "Create bump branch" {
  on = "push"
  resolves = ["stuff"]
}

action "Filters for GitHub Actions" {
  uses = "actions/bin/filter@3c0b4f0e63ea54ea5df2914b4fabf383368cd0da"
  args = "branch master"
}

action "stuff" {
  uses = "mitchellhamilton/changesets-test-package/filter-action@master"
  needs = ["yarn"]
  args = ""
}


action "yarn" {
  uses = "nuxt/actions-yarn@97f98f200b7fd42a001f88e7bdfc14d64d695ab2"
  needs = ["Filters for GitHub Actions"]
  args = "install"
}
