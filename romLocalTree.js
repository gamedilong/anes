const vscode = require('vscode');
const FileUtil = require('./fileUtil');
const os = require('os');
const path = require('path');

class RomLocalTree {
    constructor(context){
        this.context = context;
        this.userRoot = os.homedir();
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        if(!FileUtil.pathExists(path.join(this.userRoot, '.anes'))) {
            //if not exists create default ahost floder
            try{
                FileUtil.createDefaultANesFloder(this.userRoot,this.context);
            }catch(e){
                vscode.window.showInformationMessage('Ahost need Administrator permission!');
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
        let romConfigFileList = FileUtil.getRomConfigFileList(this.userRoot);
        console.log(`romConfigFileList ${JSON.stringify(romConfigFileList)}`);
        if( romConfigFileList && romConfigFileList.length > 0){
            let hostConfigs = [];
            romConfigFileList.forEach((romConfig) => {
                hostConfigs.push(new DataItem(romConfig.label,null,{
                    command:"anes.openGameBox",title:"",arguments:[romConfig]
                }));
            })
            return hostConfigs;
        }else{
            return [];
        }
    }
    deleteRom(item){
        let romConfigList = FileUtil.getRomConfigFileList(this.userRoot);
        if(romConfigList && romConfigList.length > 0){
            let deleteIndex = -1;
            romConfigList.forEach((romConfig,index)=>{
                if(romConfig.label == item.label){
                    deleteIndex = index;
                }
            });
            deleteIndex > -1 && romConfigList.splice(deleteIndex,1);
            FileUtil.writeMetaInfo(this.userRoot,romConfigList);
            this._onDidChangeTreeData.fire();
        }
    }
    rename(item){
		vscode.window.showInputBox({ placeHolder: 'Enter the new game name', value: item.label })
		.then((value) => {
			if(value){
                let romConfigList = FileUtil.getRomConfigFileList(this.userRoot);
                let exist = false;
                romConfigList.forEach(romConfig=>{
                    if(romConfig.label == value){
                        exist = true;
                    }
                });
				if(exist){
					vscode.window.showInformationMessage('This name is aready exist!');
				}else{
                    romConfigList.forEach(romConfig=>{
                        if(romConfig.label == item.label){
                            romConfig.label = value;
                        }
                    });
                    FileUtil.writeMetaInfo(this.userRoot,romConfigList);
                    this._onDidChangeTreeData.fire();
                }
			}else{
				vscode.window.showInformationMessage('Please enter your game name!');
			}
		});	
	}
}

class DataItem extends vscode.TreeItem{
    constructor(label, children, command) {
        super(label,  vscode.TreeItemCollapsibleState.None);
        this.iconPath = path.join(__filename,'..','resources', 'rom.svg');;	
        this.children = children;
        this.command = command;
    }
}

module.exports = RomLocalTree;