workflow "Create bump branch" {
  on = "push"
  resolves = ["https://github.com/nuxt/actions-yarn"]
}

action "Filters for GitHub Actions" {
  uses = "actions/bin/filter@3c0b4f0e63ea54ea5df2914b4fabf383368cd0da"
  args = "branch master"
}

action "https://github.com/nuxt/actions-yarn" {
  uses = "nuxt/actions-yarn@97f98f200b7fd42a001f88e7bdfc14d64d695ab2"
  needs = ["Filters for GitHub Actions"]
  args = "install"
}
