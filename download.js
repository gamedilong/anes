var request = require("request");
var fs = require("fs");


function download(url, filePath, callback){
    let stream = fs.createWriteStream(filePath);
    request({url:url, timeout:10000}).pipe(stream).on("close", function (err) {
        console.log("文件[" + filePath + "]下载完毕");
        callback(err);
    });
}


// download('https://github.com/gamedilong/anes-repository/archive/master.zip','master.zip');

module.exports = {
    download
}

