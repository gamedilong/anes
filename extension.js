// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const RomLocalTree = require('./romLocalTree');
const RomRemoteTree = require('./romRemoteTree');
const FileUtil = require('./fileUtil');
const { download } = require('./download');
const compressing = require('compressing');

const os = require('os');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const romLocalTree = new RomLocalTree(context);
	vscode.window.registerTreeDataProvider("romLocal", romLocalTree);
	


	let openGameBox = vscode.commands.registerCommand('anes.openGameBox', function (params) {
		// The code you place here will be executed every time your command is executed
		console.log('anes.openGameBox:' + JSON.stringify(params));
		// Display a message box to the user
		const panel = vscode.window.createWebviewPanel(
			'webview', // viewType
			"小霸王其乐无穷", // 视图标题
			vscode.ViewColumn.One,
			{
				enableScripts: true, // 启用JS，默认禁用
				retainContextWhenHidden: true // webview被隐藏时保持状态，避免被重置
			}
		);
		let absPath = FileUtil.getExtensionFileAbsolutePath(context, 'resources');

		panel.iconPath = vscode.Uri.file(path.join(absPath,"anes.svg"));


		panel.webview.html =  getWebViewContent(context, 'view/index.html');
		panel.webview.onDidReceiveMessage(message => {
            if (messageHandler[message.cmd]) {
                messageHandler[message.cmd](global, message);
            } else {
                // util.showError(`未找到名为 ${message.cmd} 回调方法!`);
            }
		}, undefined, context.subscriptions);
		

		function invokeCallback(panel, message, resp) {
			panel.webview.postMessage({cmd: 'vscodeCallback', cbid: message.cbid, data: resp});
		}
		
		/**
		 * 存放所有消息回调函数，根据 message.cmd 来决定调用哪个方法
		 */
		const messageHandler = {
			getRom(global, message) {
				//let romPath = FileUtil.getExtensionFileAbsolutePath(context,'resources/su.nes');
				let romPath = params.path;
				fs.readFile(romPath, function(err, data) {
					if (err) return;
					console.log(data);
					console.log(data.toString('binary'))
					invokeCallback(panel, message, data.toString('binary'));
				});
			}
		};
		
	});
	context.subscriptions.push(openGameBox);
	let addRom = vscode.commands.registerCommand('anes.addRom', function () {
		// The code you place here will be executed every time your command is executed
		vscode.window.showOpenDialog(
			{
				canSelectFiles:true,
				canSelectFolders:false, 
				canSelectMany:true,
				filter: {"nes":['nes']},
				defaultUri:vscode.Uri.file("/D:/"),
			}).then(function(files){
				console.log(JSON.stringify(files))
				if(files && files.length > 0){
					let userRoot = os.homedir();
					files.forEach((file)=>{
						FileUtil.addRomToResposity(userRoot,file.fsPath);
					});
					romLocalTree.refresh();
				}
			}
		)
	});

	context.subscriptions.push(addRom);

	let deleteRom = vscode.commands.registerCommand('anes.deleteRom', function (romConfig) {
		// The code you place here will be executed every time your command is executed
		romLocalTree.deleteRom(romConfig);
	});

	context.subscriptions.push(deleteRom);

	let renameRom = vscode.commands.registerCommand('anes.renameRom', function (romConfig) {

		romLocalTree.rename(romConfig);
		romLocalTree.refresh();
	});

	context.subscriptions.push(renameRom);
	let userRoot = os.homedir();
	let romRemoteTree = null;
	if(!FileUtil.pathExists(path.join(userRoot, '.anes','remote'))){
		let defaultRemoteRepository = path.join(userRoot, '.anes','remote');
		fs.mkdirSync(path.join(userRoot, '.anes','remote'));
		fs.writeFileSync(path.join(userRoot, '.anes', 'remote','meta.json'),JSON.stringify([]));
		let defaultRomPath = FileUtil.getExtensionFileAbsolutePath(context, 'resources');
		let zipPath = path.join(defaultRomPath,'master.zip');
		download('https://github.com/gamedilong/anes-repository/archive/master.zip', zipPath , function(err){
			if(!err){
				console.log(`zipPath:${zipPath}, defaultRemoteRepository :${defaultRemoteRepository}`);
				compressing.zip.uncompress(zipPath, defaultRemoteRepository).then(function(){
					console.log('success unzip')
					fs.unlinkSync(zipPath);
					romRemoteTree = new RomRemoteTree(context);
					vscode.window.registerTreeDataProvider("romRemote", romRemoteTree);
				}).catch(function(unzipErr){
					vscode.window.showInformationMessage(`Download remote repository error info: ${unzipErr}`);
				});
			}else{
				vscode.window.showInformationMessage(`Download remote repository error info: ${err}`);
			}
		});
	}else{
		romRemoteTree = new RomRemoteTree(context);
		vscode.window.registerTreeDataProvider("romRemote", romRemoteTree);
	}

	let refreshRemote = vscode.commands.registerCommand('anes.refreshRemote', function () {
		console.log('refresh');
		let defaultRemoteRepository = path.join(userRoot, '.anes','remote');
		let defaultRomPath = FileUtil.getExtensionFileAbsolutePath(context, 'resources');
		let zipPath = path.join(defaultRomPath,'master.zip');
		download('https://github.com/gamedilong/anes-repository/archive/master.zip', zipPath , function(err){
			if(!err){
				compressing.zip.uncompress(zipPath, defaultRemoteRepository).then(function(){
					fs.unlinkSync(zipPath);
					romRemoteTree.refresh();
					vscode.window.registerTreeDataProvider("romRemote", romRemoteTree);
				}).catch(function(unzipErr){
					vscode.window.showInformationMessage(`Refresh remote repository error info: ${unzipErr}`);
				});
			}else{
				vscode.window.showInformationMessage(`Refresh remote repository error info: ${err}`);
			}
		});
	});

	context.subscriptions.push(refreshRemote);

	let downloadRemote = vscode.commands.registerCommand('anes.downloadRom', function (remoteConfig) {
		/*if(remoteConfig.downloadStatus == 1 || remoteConfig.downloadStatus == 2){
			return false;
		}*/
		let remoteMeta = fs.readFileSync(path.join(userRoot, '.anes', 'remote','meta.json'));
		remoteMeta = remoteMeta.toString();
		remoteMeta = JSON.parse(remoteMeta);
		remoteMeta.push({
			name: remoteConfig.label,
			downloadStatus: 1
		})
		fs.writeFileSync(path.join(userRoot, '.anes', 'remote','meta.json'),JSON.stringify(remoteMeta));

		vscode.window.withProgress({ title: `Download:${remoteConfig.label}`, location: vscode.ProgressLocation.Notification, cancellable: false }, async (progress, token) => {
			let downloadSuccess = false;

						// The code you place here will be executed every time your command is executed
			download(remoteConfig.url, path.join(userRoot, '.anes','local',`${remoteConfig.fileName}`), function(err){
				downloadSuccess = true;
				remoteMeta.forEach((meta)=>{
					if(meta.name == remoteConfig.label){
						meta.downloadStatus = 2;
					}
				})
				if(remoteConfig.fileName.indexOf(".zip")>-1){
					// 解压到本地仓库
					let zipPath =  path.join(userRoot, '.anes','local',remoteConfig.fileName)
					let localPath =  path.join(userRoot, '.anes','local')
					compressing.zip.uncompress(zipPath, localPath).then(function(){
						fs.unlinkSync(zipPath);
						FileUtil.addRomToResposity(userRoot,path.join(userRoot, '.anes','local',remoteConfig.nesName),remoteConfig.label);
						// 本地仓库更新
						romLocalTree.refresh();
					}).catch(function(err){
						vscode.window.showInformationMessage(`download error :${err}`);
					});
				}else{
					FileUtil.addRomToResposity(userRoot,path.join(userRoot, '.anes','local',remoteConfig.fileName),remoteConfig.label);
					romLocalTree.refresh();
				}
				if(!err){
					vscode.window.showInformationMessage(`Game: ${remoteConfig.label} download success!`);
				}else{
					remoteMeta.forEach((meta)=>{
						if(meta.name == remoteConfig.label){
							meta.downloadStatus = 0;
						}
					})
					vscode.window.showInformationMessage(`Game: ${remoteConfig.label} download err, and err info is ${err}!`);
				}
				fs.writeFileSync(path.join(userRoot, '.anes', 'remote','meta.json'),JSON.stringify(remoteMeta));
				})
			await new Promise(resolve => {
				let intervalId = setInterval(() => {
						if (!downloadSuccess) {
							progress.report({
								increment: 1
								//message: `${Math.round(count)}下载`
							});
							return;
						}
						clearInterval(intervalId);
						resolve(undefined);
				}, 100);
			});
			return "下载完成";
		});
	});

	context.subscriptions.push(downloadRemote);
	
}

function getWebViewContent(context, templatePath) {
    const resourcePath = FileUtil.getExtensionFileAbsolutePath(context, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');
    // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });
    return html;
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
