# 版本管理通知工具

## 安装

`sudo npm install git-clog -g`

## 自动生成 changelog 文件

执行 `clog changelog` 后再当前文件夹生成一个 CHANGLOG.md 的文件。

生成的文件示例：[clog changelog 示例](./CHANGELOG.md)

注意：

- git tag 的 name 必须是符合 http://semver.org/lang/zh-CN/ 语义化规范的才可以被解析出来（例如：1.0.0、v1.0.0、v1.0.0+17w19a）。
- commit log 必须符合规范才可以被解析，否则会被忽略。

## 自动发送最后一次发版的 钉钉通知

执行 `clog dingding` 可以将最近一次发布的变更（最近一次变更指的是从上一个 tag 到现在的所有 commit ）发送到某个钉钉的群机器人上。

可用参数：

|  参数 | 说明                                                                             |
| ----- | -------------------------------------------------------------------------------- |
| -u    | 姓名（可省，默认是打 tag 的人的名字）                                            |
| -p    | 钉钉群机器人 hook 地址（可省，可传入多个，通过逗号分隔)                          |
| -n    | sdk 名（可省，默认是项目名，某些场景下如无法自动获取可手动传入，例如 f2er/clog） |
| -b    | baseURL，如 https://git.xxx.com                                                  |

例如：

```
clog dingding -u 芋头 -b https://code.aliyun.com/yunhuxi -p https://oapi.dingtalk.com/robot/send?access_token=7f2cb6b3682a6fda1e321ad49c1aefe98243eb40ce6b6a4c63f72664e3d8b57b
```

## commit 规范

```
feat：新功能（feature）
fix：修补bug
docs：文档（documentation）
style： 格式（不影响代码运行的变动）
refactor：重构（即不是新增功能，也不是修改bug的代码变动）
test：增加测试
chore：构建过程或辅助工具的变动
```

其他规范：

1. 所有针对 SDK 的开发请不要在 master 上进行。
2. 没有经过测试的发包，请发 alpha 版 （snapshot 版）,在确定可以被别人更新使用的时候再发布正式版。
3. 每个小的改动都有一个 commit，不要所有改动一起提交 commit。
