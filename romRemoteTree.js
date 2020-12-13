const vscode = require('vscode');
const FileUtil = require('./fileUtil');
const os = require('os');
const path = require('path');
const fs = require('fs');

class RomRemoteTree {
    constructor(context){
        this.context = context;
        this.userRoot = os.homedir();
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        if(!FileUtil.pathExists(path.join(this.userRoot, '.anes','remote'))) {
            //if not exists create default ahost floder
            try{
                //FileUtil.createDefaultAHostFloder(this.userRoot,this.context);
            }catch(e){
                //vscode.window.showInformationMessage('Ahost need Administrator permission!');
            }
        }
    }
    refresh(){
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element){
        return element;
    }
    getChildren(element) {
        let remoteRomConfig = FileUtil.getRemoteRomConfig(this.userRoot);
        let remoteMeta = fs.readFileSync(path.join(this.userRoot, '.anes', 'remote','meta.json'));
        remoteMeta = remoteMeta.toString();
        remoteMeta = JSON.parse(remoteMeta);
        let remoteMetaMap = {};
        remoteMeta.forEach((meta)=>{
            remoteMetaMap[meta.name] = meta;
        });
        if(remoteRomConfig && remoteRomConfig.length >0){
            let remoteRomList = [];
            remoteRomConfig.forEach((config)=>{
                let meta = remoteMetaMap[config.name] ? remoteMetaMap[config.name]  : {}
                remoteRomList.push(new DataItem({
                    label:config.name,
                    url:config.url,
                    children: null,
                    command: null,
                    downloadStatus: meta.downloadStatus,
                    fileName: config.fileName,
                    nesName: config.nesName
                }));
            });
            return remoteRomList;
        }else{
            return [];
        }
    }
}

class DataItem extends vscode.TreeItem{
    constructor({label, url, children, command, downloadStatus,fileName,nesName}) {
        super(label,  vscode.TreeItemCollapsibleState.None);
        downloadStatus = downloadStatus ? downloadStatus : 0; // download 0 downloading 1 downloaded 2
        console.log(`downloadStatus:${downloadStatus}`);
        this.downloadStatus = downloadStatus;
        this.iconPath = path.join(__filename,'..','resources', `d0.svg`);
        this.children = children;
        this.command = command;
        this.url = url;
        this.fileName = fileName;
        this.nesName= nesName;
    }
}

module.exports = RomRemoteTree;