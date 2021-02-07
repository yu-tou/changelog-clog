"use strict";
const fs = require("fs");
const _ = require("lodash");
const request = require("request");
const ora = require("ora");
const Parser = require("./release_parser.js");
const parser = new Parser();

const PUSH_URL = "https://oapi.dingtalk.com/robot/send?access_token=";
const MSG_TPL = {
  msgtype: "markdown",
  markdown: {
    title: "标题未填",
    text: "内容未填",
  },
};

module.exports = {
  getLastRelease: function (callback) {
    parser.getLastRelease(callback);
  },
  sendLastReleaseMessage: function (userName, sdkName, pushURL, baseURL) {
    console.log("读取最后一个版本信息");
    const spinner = ora("").start("读取最后一个版本信息");
    this.getLastRelease((err, release) => {
      if (!userName) {
        userName = release.commits[0].author;
      }

      parser.getRepoUrl((err, url) => {
        let ms = url.match(/:(.*?)\.git/);
        let repoURL = `${baseURL}/${ms[1]}`;
        if (!sdkName) {
          sdkName = ms[1];
        }
        let msg = _.cloneDeep(MSG_TPL);
        msg.markdown.title = `${userName} 为 ${sdkName} 发布了一个新版本 ${release.version}`;
        msg.markdown.text = `
${userName} 为 ${sdkName} 发布了一个新版本 ${release.version}：<br/>
${release.commits
  .map((c, i) => {
    return `> [${i + 1}] ${c.header}`;
  })
  .filter((v) => {
    return !!v;
  })
  .join("\n\n")}

[查看版本的具体变更](${repoURL}/compare/${release.lastVersion}...${
          release.version
        })
`;
        spinner.text = "发送信息到钉钉";
        var _url = pushURL ? pushURL : PUSH_URL;
        var urls = _url.split(",");
        urls.forEach(function (url) {
          request.post(
            {
              url: url,
              json: true,
              body: msg,
              timeout: 1000 * 10,
            },
            (e, r, body) => {
              if (body.errcode === 0) {
                spinner.succeed("通知发送成功");
              } else {
                spinner.fail("通知发送失败");
                process.exit(1);
              }
            }
          );
        });

        // spinner.succeed('通知发送成功')
      });
    });
  },
  createReleaseTable: function (callback) {
    parser.getAllRelease((err, releases) => {
      parser.getRepoUrl((err, url) => {
        console.log(url);
        let ms = url.match(/:(.*?)\.git/);
        let table = parser.convertReleaseMD({
          repoURL: `/${ms[1]}`,
          releases: releases,
        });
        callback(null, table);
      });
    });
  },
  createChangeLog: function () {
    this.createReleaseTable((err, table) => {
      console.log("写入文件");
      const spinner = ora("").start("写入文件");
      fs.writeFileSync("./CHANGELOG.md", table, "utf-8");
      spinner.succeed("写入文件成功");
    });
  },
};
