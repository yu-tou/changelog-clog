class ReleaseModel {
    constructor() {
        this.version = ''; // 此次版本的版本号
        this.commits = []; // 此次版本的提交记录
        this.time = '';
        this.lastVersion = '';
    }
}

module.exports = ReleaseModel;