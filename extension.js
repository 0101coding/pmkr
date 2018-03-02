/** 
 * Client ID: GVKFCIHGYSQRYJYVJHKBVKZNPHCZEEYL
 * Client Secret: 359762368574d98699a1af7047158145
*/
const vscode = require('vscode');
//TODO: signaler superagent comme require
const superagent = require('superagent');
const fs = require('fs');
const mkdirp = require('mkdirp');
var token;
var process = [];
//TODO: configurer les constantes suivantes
const pm_workspace = '/workflow';
const pm_client_id = 'GVKFCIHGYSQRYJYVJHKBVKZNPHCZEEYL';
const pm_client_secret = '359762368574d98699a1af7047158145';
const pm_username = 'cdoudet';
const pm_userpassword = 'arathorn';
const pm_base_url = 'https://bpm.coreplighting.com';
const pm_auth_url = pm_base_url + pm_workspace + '/oauth2/token';
const pm_api_ver = '/api/1.0';
const pm_api_url = pm_base_url + pm_api_ver + pm_workspace+'/project';
const loc_workspace = '/home/chris/Documents/PMworkspace'+pm_workspace;

function activate(context) {
    console.log('Congratulations, your extension "pmkr" is now active!');

    let disposable = vscode.commands.registerCommand('extension.sync', sync);

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;

//main
/**
 * The main function is sync
 * process is :
 * if process.json exist :
 *  auth
 *  load to variable process, 
 *  push what to sync to PM,
 *  refresh json from PM,
 *  not yet dev : manage diff,
 *  write to local file system,
 * else
 *  auth
 *  jsonPopulate json from PM,
 *  write to local file system
 */
async function sync() {
    console.time("traitement");
    if (!token) {
        let auth = await pmAuth();
        if (!auth) {
            vscode.window.showInformationMessage('PMKR Authentification failed, check your settings');
            return false;
        }
    }
    if (!(fs.existsSync(loc_workspace + '.process.json'))) {
        let pop = await jsonPopulate();
        if (pop){
            let docu=vscode.workspace.openTextDocument({content:JSON.stringify(process),language:'json'})
            .then(doc => {vscode.window.showTextDocument(doc);});
        }
        jsonWrite();
    } else {
        jsonRead();
        jsonPushToPM();
        jsonPopulate();
        //syncDiffManage();
        jsonWrite();
    }
    console.timeEnd("traitement");
    vscode.window.showInformationMessage('PMKR sync DONE');
}
async function jsonPopulate() {
    let response = await superagent.get(pm_api_url)
        .set('Authorization', 'Bearer ' + token)
        .then((res) => {
            if (res.status != 200) vscode.window.showWarningMessage('PMKR Authentification : ' + res.status.toString());
            process = JSON.parse(res.text);
            if (!process[0].prj_uid) {
                vscode.window.showErrorMessage('PMKR Process not found !');
                return false;
            }
            return true;
        });

    if (response) {
        for (let index = 0; index < process.length; index++) {
            let prj_uid = process[index].prj_uid;
            let t = await jsonTriggPopulate(index, prj_uid);
        }
    }
    return response;
}

async function jsonTriggPopulate(index, prj_uid) {
    let responset, responsev, responsed
    responset = await superagent.get(pm_api_url + '/'+prj_uid + '/triggers')
        .set('Authorization', 'Bearer ' + token)
        .then((res) => {
            let decode_res = JSON.parse(res.text);
            process[index].trigger = decode_res;
        }
    );
    responsev = await superagent.get(pm_api_url + '/'+prj_uid + '/process-variables')
        .set('Authorization', 'Bearer ' + token)
        .then((res) => {
            let decode_res = JSON.parse(res.text);
            process[index].variables = decode_res;
        }
    );
    response = await superagent.get(pm_api_url + '/'+prj_uid + '/dynaforms')
        .set('Authorization', 'Bearer ' + token)
        .then((res) => {
            let decode_res = JSON.parse(res.text);
            process[index].dynaforms = decode_res;
        }
    );
}
function jsonWrite() {

}

function jsonRead() {

}
function jsonPushToPM() {

}
async function pmAuth() {
    let response;
    response = await superagent.post(pm_auth_url)
        .send({
            grant_type: 'password',
            client_id: pm_client_id,
            client_secret: pm_client_secret,
            username: pm_username,
            password: pm_userpassword
        })
        .then((res) => {
            if (res) {
                if (res.status != 200) vscode.window.showWarningMessage('PMKR Authentification : ' + res.status.toString())
                token = JSON.parse(res.text).access_token;
                if (!token) {
                    vscode.window.showErrorMessage('PMKR Authentification no Token');
                    return false;
                }
                return true;
            } else {
                vscode.window.showErrorMessage('PMKR Authentification response is null, check your settings.');
                return false;
            }
        });
    return response;
}