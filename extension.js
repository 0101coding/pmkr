
//TODO: signaler superagent comme require
const vscode = require('vscode');
const superagent = require('superagent');
const fs = require('fs-extra');
const mkdirp = require('mkdirp');

var token;
var process = [];
var to_sync = {};
var tot;
var status_bar = vscode.window.createStatusBarItem(1);
    status_bar.tooltip = "ProcessMaker\nPending Syncing Elements";
    status_bar.text = "PHP: " + to_sync.count_php + ", JS: " + to_sync.count_js;
var bar_sync = vscode.window.createStatusBarItem(1);
    bar_sync.tooltip = "PMKR Ready to Sync";
    bar_sync.command = "pmkr.sync";
    bar_sync.text = "$(sync) PMKR";
// var bar_php;
// var bar_js;
var abort;

//DONE: configurer les constantes suivantes
let conf = vscode.workspace.getConfiguration();
let b = conf.get("pmkr_workspace");
const pm_workspace = "/" + b;
if (!b) {
    vscode.window.showErrorMessage("PMKR : Setting Error; pmkr_workspace cannot be 'null'");
    abort = true;
}
b = conf.get("pmkr_client_id");
const pm_client_id = b;
if (!b) {
    vscode.window.showErrorMessage("PMKR : Setting Error; pmkr_client_id cannot be 'null'");
    abort = true;
}
b = conf.get("pmkr_client_secret");
const pm_client_secret = b;
if (!b) {
    vscode.window.showErrorMessage("PMKR : Setting Error; pmkr_client_secret cannot be 'null'");
    abort = true;
}
b = conf.get("pmkr_username");
const pm_username = b;
if (!b) {
    vscode.window.showErrorMessage("PMKR : Setting Error; pmkr_username cannot be 'null'");
    abort = true;
}
b = conf.get("pmkr_userpassword");
const pm_userpassword = b;
if (!b) {
    vscode.window.showErrorMessage("PMKR : Setting Error; pmkr_userpassword cannot be 'null'");
    abort = true;
}
b = conf.get("pmkr_base_url");
const pm_base_url = b;
if (!b) {
    vscode.window.showErrorMessage("PMKR : Setting Error; pmkr_base_url cannot be 'null'");
    abort = true;
}
b = conf.get("pmkr_auth_url");
const pm_auth_url = pm_base_url + pm_workspace + b;
if (!b) {
    vscode.window.showErrorMessage("PMKR : Setting Error; pmkr_auth_url cannot be 'null'");
    abort = true;
}
b = conf.get("pmkr_api_ver");
const pm_api_ver = b;
if (!b) {
    vscode.window.showErrorMessage("PMKR : Setting Error; pmkr_api_ver cannot be 'null'");
    abort = true;
}
b = conf.get("pmkr_loc_workspace_path");
// on multi process maker workspace
//const pm_loc_workspace=b;
//const loc_workspace = b + pm_workspace;
const loc_workspace = b;

if (!b) {
    vscode.window.showErrorMessage("PMKR : Setting Error; pmkr_loc_workspace_path cannot be 'null'");
    abort = true;
}
const pm_api_url = pm_base_url + pm_api_ver + pm_workspace + '/project';

to_sync.api = pm_api_ver;
to_sync.workspace = pm_workspace;
to_sync.count_js = 0;
to_sync.count_php = 0;
to_sync.code_php = [];
to_sync.code_js = [];

function activate(context) {

    if (abort) {
        return;
    }
    console.log('Congratulations, your extension "pmkr" is now active!');
    let disposable = vscode.commands.registerCommand('pmkr.sync', sync); 
    //let disposable2 = vscode.commands.registerCommand('pmkr.force_new_sync', newSync);
    
    bar_sync.show();

    if (fs.existsSync(loc_workspace + "/.PMKRProcess")) {
        let text = fs.readFileSync(loc_workspace + "/.PMKRProcess");
        process = JSON.parse(text);
    }
    if (fs.existsSync(loc_workspace + "/.PMKRToSync")) {
        let text = fs.readFileSync(loc_workspace + "/.PMKRToSync");
        to_sync = JSON.parse(text);
        if ((to_sync.count_js + to_sync.count_php) > 0) {
            status_bar.text = "PHP: " + to_sync.count_php + ", JS: " + to_sync.count_js;
             status_bar.show();  
        }
    }

    vscode.workspace.onDidSaveTextDocument((text_doc) => {
        onSaveDoc(text_doc);
    });

    context.subscriptions.push(disposable);
    //context.subscriptions.push(disposable2);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;

// function newSync(){
//     to_sync.count_js = 0;
//     to_sync.count_php = 0;
//     to_sync.code_php = [];
//     to_sync.code_js = [];
//     if ((fs.existsSync(loc_workspace))&&(loc_workspace.length>2)){
//         try {
//             fs.removeSync(loc_workspace);
//         } catch (error) {
//             console.log(error);
            
//         }
//         sync();
//     }
// }

async function onSaveDoc(text_doc) {
    if (text_doc.languageId = "javascript") await toSyncJS(text_doc.fileName, text_doc.getText());
    if (text_doc.languageId = "php") await toSyncPHP(text_doc.fileName, text_doc.getText());
    // vscode.workspace.openTextDocument({ content: JSON.stringify(to_sync), language: 'json' })
    // .then(doc => {
    //     vscode.window.showTextDocument(doc);
    // });

}
function toSyncJS(path, text) {
    for (let index = 0; index < to_sync.code_js.length; index++) {
        const element = to_sync.code_js[index];
        if (element.js_path == path) {
            if (element.js_modif == 0) {
                element.js_modif = 1;
                to_sync.count_js++;
            }
            //add source to to_sync
            element.source = text;
            status_bar.text = "PHP: " + to_sync.count_php + ", JS: " + to_sync.count_js;
            bar_sync.show();
            status_bar.show();
            fs.writeFileSync(loc_workspace + "/.PMKRToSync", JSON.stringify(to_sync));
        }
    }
}
function toSyncPHP(path, text) {
    for (let index = 0; index < to_sync.code_php.length; index++) {
        const element = to_sync.code_php[index];
        if (element.tri_path == path) {
            if (element.tri_modif == 0) {
                element.tri_modif = 1;
                to_sync.count_php++;
            }
            //add source to to_sync
            element.source = text.replace("<?PHP\n", "");
            status_bar.text = "PHP: " + to_sync.count_php + ", JS: " + to_sync.count_js;
            bar_sync.show();
            status_bar.show();
            fs.writeFileSync(loc_workspace + "/.PMKRToSync", JSON.stringify(to_sync));
        }
    }
}

//main
/**
 * The main function is sync
 * process is :
 * if process.json exist :
 *  auth
 *  load variable process, 
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
    bar_sync.hide();
    console.time("sync");

    //test for authentification token
    if (!token) {
        let auth = await pmAuth();
        if (!auth) {
            vscode.window.showInformationMessage('PMKR Authentification failed, check your settings');
            return false;
        }
    }
    //if exist apply modification
    if ((to_sync.count_php + to_sync.count_js) >= 1) {
        await jsonPushToPM();
    }
    //if no modif sync
    if ((to_sync.count_js+to_sync.count_php)==0) {
        delete to_sync.code_js;
        delete to_sync.code_php;
        to_sync.code_php = [];
        to_sync.code_js = [];
        await jsonPopulate();
    }
}
async function jsonPopulate() {
    //retrieve all process
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
    //from process populate trigger, variables, dyna and js
    if (response) {
        tot = process.length * 2;
        for (let index = 0; index < process.length; index++) {
            let prj_uid = process[index].prj_uid;
            process[index].activities=[];
            process[index].dynaforms=[];
            await jsonTriggPopulate(index, prj_uid);
        }
    }
    return response;
}

function jsonTriggPopulate(index, prj_uid) {
    //trigger
    superagent.get(pm_api_url + '/' + prj_uid + '/triggers')
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) => {
            let decode_res = JSON.parse(res.text);
            process[index].trigger = decode_res;

            mkdirp.sync(loc_workspace + "/" + process[index].prj_name + "/Triggers");
            for (let j = 0; j < process[index].trigger.length; j++) {
                const trig_element = process[index].trigger[j];
                //TODO: vérifiez la bonne écriture
                //TODO: Vérifiez la cohérence des fichiers et en cas de conflit ouvrir les deux fichiers en mode diff et demander lequel reste en local sur le disque
                if (trig_element.tri_webbot) {
                    fs.writeFileSync(loc_workspace + "/" + process[index].prj_name + "/Triggers/" + trig_element.tri_title + ".php", "<?PHP\n" + trig_element.tri_webbot);
                    //add path to json
                    trig_element.tri_path = loc_workspace + "/" + process[index].prj_name + "/Triggers/" + trig_element.tri_title + ".php";
                    trig_element.tri_modif = 0;
                    let t = {
                        "tri_title": trig_element.tri_title, "prj_uid": prj_uid, "tri_uid": trig_element.tri_uid, "tri_modif": 0,
                        "tri_path": loc_workspace + "/" + process[index].prj_name + "/Triggers/" + trig_element.tri_title + ".php"
                    };
                    to_sync.code_php.push(t);
                }
            }
            //console.log(tot);
            if (--tot <= 0) {
                endPopulate();
            }
        }
    );
    // //variables
    // superagent.get(pm_api_url + '/' + prj_uid + '/process-variables')
    //     .set('Authorization', 'Bearer ' + token)
    //     .end((err, res) => {
    //         let decode_res = JSON.parse(res.text);
    //         process[index].variables = decode_res;
    //         //console.log(tot);
    //         if (--tot <= 0) {
    //             endPopulate();
    //         }
    //     }
    // );
    // //Cases
    // superagent.get(pm_api_url + '/' + prj_uid)
    //     .set('Authorization', 'Bearer ' + token)
    //     .end((err, res) => {
    //         if (res.status!=200){
    //             console.log(res);
    //         }
    //         let decode_res = JSON.parse(res.text);
    //         //console.log(decode_res);
    //         if (!decode_res.diagrams[0].activities) console.log("no act");
            
    //         for (let i = 0; i < decode_res.diagrams[0].activities.length; i++) {
    //             const elemact = decode_res.diagrams[0].activities[i];
    //             let t = {"act_name":elemact.act_name};
    //             process[index].activities.push(t);
    //             //console.log(process[index]);
                
    //         }
    //         //process[index].variables = decode_res;
    //         //console.log(tot);
    //         if (--tot <= 0) {
    //             endPopulate();
    //         }
    //     }
    // );
    //dynaform javasscript
    superagent.get(pm_api_url + '/' + prj_uid + '/dynaforms')
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) => {
            let decode_res = JSON.parse(res.text);
            //mkdirp.sync(loc_workspace+"/"+process[index].dynaforms+"/Dynaforms");
            for (let j = 0; j < decode_res.length; j++) {
                let t={"dyn_uid": decode_res[j].dyn_uid,"dyn_title":decode_res[j].dyn_title,"dyn_description":decode_res[j].dyn_description}
                process[index].dynaforms.push(t);
                const dyn_element = decode_res[j];
                try {
                    //TODO: vérifiez la bonne écriture
                    //TODO: Vérifiez la cohérence des fichiers et en cas de conflit ouvrir les deux fichiers en mode diff et demander lequel reste en local sur le disque
                    //mkdirp.sync(loc_workspace+"/"+process[index].prj_name+"/Dynaforms/"+dyn_element.dyn_title);
                    let dyn_json = JSON.parse(dyn_element.dyn_content);
                    //console.log(dyn_json);
                    if (dyn_json.items) {
                        let js = dyn_json.items[0].script.code;
                        if (js) {
                            try {
                                mkdirp.sync(loc_workspace + "/" + process[index].prj_name + "/js");
                                fs.writeFileSync(loc_workspace + "/" + process[index].prj_name + "/js/" + dyn_element.dyn_title + ".js", js);
                                dyn_element.js_path = loc_workspace + "/" + process[index].prj_name + "/js/" + dyn_element.dyn_title + ".js";
                                dyn_element.js_modif = 0;
                                let t = {
                                    "js_title": dyn_element.dyn_title, "prj_uid": prj_uid, "js_uid": dyn_element.dyn_uid, "js_modif": 0,
                                    "js_path": loc_workspace + "/" + process[index].prj_name + "/js/" + dyn_element.dyn_title + ".js"
                                };
                                to_sync.code_js.push(t);
                            }
                            catch (er) {
                                console.log(dyn_json.name+" write file error : \n" + er);
                            }
                        }
                    }
                }
                catch (e) {
                    console.log("dynaform error : \n" + e);
                    vscode.window.showErrorMessage(`Project ${prj_uid}, dynaform error ${dyn_element.dyn_title}`);
                }
            }
            //console.log(tot);
            if (--tot <= 0) {
                endPopulate();
            }
        }
    );
    return true;
}
function endPopulate() {
    //bar_sync.hide();
    console.timeEnd("sync");
    console.log('fin');
    vscode.window.showInformationMessage('PMKR sync DONE');
    // vscode.workspace.openTextDocument({ content: JSON.stringify(process), language: 'json' })
    // .then(doc => {
    //     vscode.window.showTextDocument(doc);
    // });
    //write to fs
    fs.writeFileSync(loc_workspace + "/.PMKRProcess", JSON.stringify(process));
    fs.writeFileSync(loc_workspace + "/.PMKRToSync", JSON.stringify(to_sync));
    let uri=vscode.Uri.file(loc_workspace+pm_workspace+".code-workspace");
    console.log(uri);
    vscode.commands.executeCommand("vscode.openFolder",uri)
    .then((res)=>{console.log(res);});

    console.log(uri);
    
    status_bar.text = "PHP: " + to_sync.count_php + ", JS: " + to_sync.count_js;
    bar_sync.show();
    status_bar.show()
}
// function jsonWrite() {
//     for (let i = 0; i < process.length; i++) {
//         const process_element = process[i];
//         //TODO: vérifiez la bonne création
//         mkdirp(loc_workspace + "/" + process_element.prj_name + "/Triggers");
//         for (let j = 0; j < process_element.trigger.length; j++) {
//             const trig_element = process_element.trigger[j];
//             //TODO: vérifiez la bonne écriture
//             //TODO: Vérifiez la cohérence des fichiers et en cas de conflit ouvrir les deux fichiers en mode diff et demander lequel reste en local sur le disque
//             //fs.writeFileSync(loc_workspace+"/"+process_element.prj_name+"/Triggers/"+trig_element.tri_title+".php", "<?PHP\n"+trig_element.tri_webbot);
//             fs.write(loc_workspace + "/" + process_element.prj_name + "/Triggers/" + trig_element.tri_title + ".php", "<?PHP\n" + trig_element.tri_webbot);
//         }
//         //fs.writeFileSync("/home/chris/Documents/PMworkspace/workflow/"+element.prj_fs.existsSync(path)name+"/Triggers/", trig);
//     }
// }

// function jsonRead() {

// }
async function dyn_contentRetrieve(prj_uid, dyn_uid ) {
    let dyn_content;
    //retrieve project
    // let i1=-1;
    // for (let index = 0; index < process.length; index++) {
    //     const elemprocess = process[index];
    //     if (elemprocess.prj_uid==prj_uid) i1=index;
    // }

    // //retrieve dyn_content
    // if(i1>-1){
    //     let elemdyna=process[i1].dynaforms;
    //     for (let index = 0; index < elemdyna.length; index++) {
    //         const form = elemdyna[index];
    //         if (form.dyn_uid==dyn_uid){
    //             dyn_content=form.dyn_content;
    //         }
    //     }
    // } 
    try{
        await superagent.get(pm_api_url + '/' + prj_uid + '/dynaform/'+dyn_uid)
            .set('Authorization', 'Bearer ' + token)
            .then((res) => {

                let decode_res = JSON.parse(res.text);
                dyn_content=decode_res.dyn_content;
                
            }
        );
    }
    catch(e){
        console.log(e);
        
    }
    if (!dyn_content){
        vscode.window.showWarningMessage(`Couple ${prj_uid}, ${dyn_uid} not found !`);
        return null;
    }else return dyn_content;
}
async function jsonPushToPM() {
    if (to_sync.count_js > 0) {
        for (let index = 0; index < to_sync.code_js.length; index++) {
            const elemjs = to_sync.code_js[index];
            if ((elemjs.js_modif==1) && (elemjs.source)){
                
                let ret= await dyn_contentRetrieve(elemjs.prj_uid, elemjs.js_uid);
                
                let dyn_content=JSON.parse(ret);
                dyn_content.items[0].script.code=elemjs.source;

                let dyn_contentst=JSON.stringify(dyn_content);
                
                await superagent.put(pm_api_url + '/' + elemjs.prj_uid + '/dynaform/'+elemjs.js_uid)
                .set('Authorization', 'Bearer ' + token)
                .send({dyn_content: dyn_contentst})
                .then((res) => {   
                    if (res.status!=200) vscode.window.showErrorMessage("PMKR Error update Dynaform Script : "+elemjs.js_title);
                    if (res.status=200) vscode.window.showInformationMessage("PMKR update Dynaform Script "+elemjs.js_title+": OK");
                    elemjs.js_modif=0;
                    elemjs.source="";
                    to_sync.count_js--;
                    status_bar.text = "PHP: " + to_sync.count_php + ", JS: " + to_sync.count_js;
                    status_bar.show();
                    fs.writeFileSync(loc_workspace + "/.PMKRToSync", JSON.stringify(to_sync));
                });
            
                // if (ret){
                //     let dyn_content=JSON.parse(ret);

                //     dyn_content.items[0].script.code=elemjs.source;

                //     let dyn_contentst=JSON.stringify(dyn_content);
                    
                //     await superagent.put(pm_api_url + '/' + elemjs.prj_uid + '/dynaform/'+elemjs.js_uid)
                //     .set('Authorization', 'Bearer ' + token)
                //     .send({dyn_content: dyn_contentst})
                //     .then((res) => {   
                //         if (res.status!=200) vscode.window.showErrorMessage("PMKR Error update Dynaform Script : "+elemjs.js_title);
                //         if (res.status=200) vscode.window.showInformationMessage("PMKR update Dynaform Script "+elemjs.js_title+": OK");
                //         elemjs.js_modif=0;
                //         elemjs.source="";
                //         to_sync.count_js--;
                //         status_bar.text = "PHP: " + to_sync.count_php + ", JS: " + to_sync.count_js;
                //         status_bar.show();
                //         fs.writeFileSync(loc_workspace + "/.PMKRToSync", JSON.stringify(to_sync));
                //     });
                // }
            }
        }
    }
    if (to_sync.count_php > 0) {
        for (let index = 0; index < to_sync.code_php.length; index++) {
            const elemphp = to_sync.code_php[index]; 
            if ((elemphp.tri_modif==1) && (elemphp.source)){
                await superagent.put(pm_api_url + '/' + elemphp.prj_uid + '/trigger/'+elemphp.tri_uid)
                .set('Authorization', 'Bearer ' + token)
                .send({tri_webbot: elemphp.source})
                .then((res) => {   
                    //console.log(res);
                    if (res.status!=200) vscode.window.showErrorMessage("PMKR Error update Trigger : "+elemphp.tri_title);
                    if (res.status=200) vscode.window.showInformationMessage("PMKR update Trigger "+elemphp.tri_title+": OK");
                    elemphp.tri_modif=0;
                    elemphp.source="";
                    to_sync.count_php--;
                    status_bar.text = "PHP: " + to_sync.count_php + ", JS: " + to_sync.count_js;
                    status_bar.show();
                    fs.writeFileSync(loc_workspace + "/.PMKRToSync", JSON.stringify(to_sync));
                });
            }
        }
    }
    status_bar.hide();
    bar_sync.show();
    status_bar.show();
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
                //console.log("token : "+token);
                
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