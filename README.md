# ProcessMaker External Editor README

Update PHP trigger and Dynaform JavaScript in Visual Studio Code.

## Features

Retrieve project of a ProcessMaker and write to disk php triggers and Dynaforms JavaScript scripts.

Modified and saved script can be upload to ProcessMaker Server.

One simple command PMKR : Sync.

## Extension Settings 


> **Must be in user settings.**

Settings | Value  | Description 
---------|--------|------------
`pmkr_workspace`|"workflow"|ProcessMaker workspace, default is workflow
`pmkr_client_id`|"GVKFCISAMPLEVJHKBVKZNPHCZEEYL"|ProcessMaker Client id
`pmkr_client_secret`|"35976236857SAMPLEaf7047158145"|ProcessMaker Client secret
`pmkr_username`|"John_Doe"|The username of a ProcessMaker user
`pmkr_userpassword`|"JDPassword"|ProcessMaker user password
`pmkr_base_url`|"https://ProcessMaker.mycompagny.com"|ProcessMaker url
`pmkr_api_ver`|"/api/1.0"|ProcessMaker Api version, default is /api/1.0
`pmkr_loc_workspace_path`|"/home/yourname/Documents/PMworkspace"|Path to Local Folder

-----------------------------------------------------------------------------------------------------------
# How to
1. Open Settings, search for pmkr
1. Fill them
1. In vscode open the folder you have define in `pmkr_loc_workspace_path`
1. Call Command Sync, to download ProcessMaker Script to your local file system
1. Once you have saved scripts, you can Sync again to upload scripts in ProcessMaker

> * Tip 1 : You can now use Git.
> * Tip 2 : You can now use snippet.
> * Tip 3 : **Enjoy !**

![Screen](/images/pmkr.gif)

-----------------------------------------------------------------------------------------------------------
## What you cannot do

## Requirements
* SuperAgent : npm install superagent

## Known Issues
* Settings must be define in user settings

## Release Notes



### 0.1.0

Initial release of ProcessMaker External Editor (BETA)

-----------------------------------------------------------------------------------------------------------
