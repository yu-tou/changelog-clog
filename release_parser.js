const conventionalChangelog = require("conventional-changelog");
const gitRawCommits = require("git-raw-commits");
const gitSemverTags = require("git-semver-tags");
const conventionalCommitsParser = require("conventional-commits-parser");
const ReleaseModel = require("./release_model.js");
const async = require("async");
const moment = require("moment");
const gitRemoteOriginUrl = require("git-remote-origin-url");
const ora = require("ora");

class ReleaseParser {
  constructor() {}

  /**
   * 获取所有版本信息，倒序排列
   * @param callback err,releases
   */
  getAllRelease(callback) {
    let allRelease = [];
    console.log("获取所有版本中");
    const spinner = ora("").start("获取所有版本中");
    gitSemverTags((err, tags) => {
      if (tags.length) {
        spinner.start("正在获取所有commit");
        async.forEachOf(
          tags,
          (tag, i, callback) => {
            spinner.text = "正在获取所有commit" + i;
            let nowTag = tags[i];
            let lastTag;
            if (i == tags.length - 1) {
              lastTag = "";
            } else {
              lastTag = tags[i + 1];
            }
            this.getCommits(lastTag, nowTag, (err, commits) => {
              let release = new ReleaseModel();
              release.version = nowTag;
              release.commits = commits;
              release.time = commits.length > 0 ? commits[0].time : "";
              allRelease.push(release);
              callback();
            });
          },
          function () {
            spinner.succeed("获取commit列表成功");
            callback(null, allRelease);
          }
        );
      } else {
        spinner.warn("tag列表为空，获取失败");
        process.exit(1);
        callback(null, allRelease);
      }
    });
  }

  /**
   * 获取最后一个版本的信息
   * @param callback error,release
   */
  getLastRelease(callback) {
    var release;
    gitSemverTags((err, tags) => {
      if (tags.length) {
        var nowTag = tags[0];
        var lastTag;
        if (tags.length == 1) {
          lastTag = "";
        } else {
          lastTag = tags[1];
        }
        this.getCommits(lastTag, nowTag, (err, commits) => {
          var release = new ReleaseModel();
          release.version = nowTag;
          release.commits = commits;
          release.time = commits.length > 0 ? commits[0].time : "";
          release.lastVersion = lastTag;
          callback(null, release);
        });
      } else {
        callback(null, release);
      }
    });
  }

  /**
   * 获取当前项目的git地址
   */
  getRepoUrl(callback) {
    gitRemoteOriginUrl().then((url) => {
      callback(null, url);
      //=> 'git@github.com:sindresorhus/git-remote-origin-url.git'
    });
  }

  convertToTable(data) {
    console.log("正在生成表格");
    const spinner = ora("").start("正在生成表格");
    let releaseData = data.releases;
    let repoURL = data.repoURL;
    let table = "版本变更记录\n============\n| 版本 | 变更 |\n";
    table += "|----|----|----|\n";
    releaseData.forEach((release, i) => {
      table += `| ${
        (function () {
          if (i == releaseData.length - 1) return release.version;
          return (
            "[" +
            release.version +
            "](" +
            repoURL +
            "/compare/" +
            releaseData[i + 1].version +
            "..." +
            release.version +
            ")"
          );
        })() +
        "<br/>[" +
        moment(
          new Date(release.commits.length > 0 ? release.commits[0].time : 0)
        ).format("YYYY-MM-DD hh:mm:ss") +
        "] "
      } | ${release.commits
        .map((c) => {
          if (!c.type || c.type == "chore") return "";
          else return c.hash + " " + c.header + ` （${c.author}）`;
        })
        .filter((v) => {
          return !!v;
        })
        .join("<br />")} |\n`;
    });
    spinner.succeed("生成表格成功");
    return table;
  }

  convertReleaseMD(data) {
    const spinner = ora("").start("正在生成 changelog");
    let releaseData = data.releases;
    let repoURL = data.repoURL;
    let table = "## 版本变更记录\n";
    releaseData.forEach((release, i) => {
      table += `\n\n## ${
        (function () {
          if (i == releaseData.length - 1) return release.version;
          return `[${release.version}](${repoURL}/compare/${
            releaseData[i + 1].version + "..." + release.version
          })`;
        })() +
        "\n\n" +
        moment(
          new Date(release.commits.length > 0 ? release.commits[0].time : 0)
        ).format("YYYY-MM-DD")
      }
${release.commits
  .map((c) => {
    if (!c.type || c.type == "chore") return "";
    else
      return (
        "* " +
        c.header +
        ` [${c.hash}](${repoURL}/commit/${c.hash}) （${c.author}）`
      );
  })
  .filter((v) => {
    return !!v;
  })
  .join("\n")} \n`;
    });
    spinner.succeed("生成 changelog 成功");
    return table;
  }

  getCommits(from, to, callback) {
    let result = [];
    gitRawCommits({
      from: from,
      to: to,
      format: "%B%n-hash-%n%h%n-tags-%n%d%n-time-%n%ci%n-author-%n%cE",
    })
      .on("error", function (err) {
        console.log(err);
      })
      .pipe(conventionalCommitsParser({}))
      .on("error", function (err) {
        console.log(err);
      })
      .on("data", function (d) {
        result.push(d);
      })
      .on("end", function () {
        callback(null, result);
      });
  }
}

module.exports = ReleaseParser;
