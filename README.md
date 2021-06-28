# flp-systeminfo-plugin
Fiori Launchpad Plugin for 
- displaying ABAP system info
- changing language
  - via Dropdown of all installed languages in the system (works only if the SICF service /sap/bc/adt is active and user has authority to use it)
  - from(to) German to(from) English
- changing the client
  - via Dropdown of all available clients in the system (works only if the SICF service /sap/bc/adt is active and user has authority to use it)
  - or via direkt input via Popup input dialog (if above service is not active)

## Development setup
### Node setup
1) Install all node dependencies
```
$ npm i
```
2) Create `.env`-file for testing/deployment
```env
# variables for Proxy
PROXY_AUTH_USER=<username on ABAP system>
PROXY_AUTH_PASS=<password on ABAP system>
PROXY_TARGET=<URL to ABAP system>

# variables for ABAP Deployment
UI5_TASK_NWABAP_DEPLOYER__USER=<username on ABAP system>
UI5_TASK_NWABAP_DEPLOYER__PASSWORD=<password on ABAP system>
UI5_TASK_NWABAP_DEPLOYER__SERVER=<password on ABAP system>
UI5_TASK_NWABAP_DEPLOYER__CLIENT=<URL to ABAP system>
UI5_TASK_NWABAP_DEPLOYER__TKORRNO=<optional transport request>

# UI5 Library paths
SAPUI5_RESOURCES=<root path to unpacked saoui5 lib>/resources
SAPUI5_TEST_RESOURCES=<root path to unpacked saoui5 lib>/test-resources
```

### Testing
```
$ npm run start
```

### Deployment to ABAP System
```
$ npm run deploy
```

## Manual deployment of Releases
1) Download the `dist.zip` file of a release and extract its contents to a folder
2) Start ABAP program `/UI5/UI5_REPOSITORY_LOAD` on the system where the plugin should be deployed to
3) Set a name for the final UI5 repository (max. 15 characters long) e.g. `ZFLPLOGONINFO`  
  ![image](https://user-images.githubusercontent.com/35834861/123605137-ccf05e00-d7fb-11eb-9d0b-39e70e6c1036.png)
4) Choose the downloaded folder from step 1
5) Enter a description for the app
6) Enter a package location (e.g. `$TMP`)
7) Enter a transport request (if needed)
8) Press `upload` to upload the app  
  ![image](https://user-images.githubusercontent.com/35834861/123605538-3c664d80-d7fc-11eb-9da7-c63f80fa3c74.png)

## Activating the plugins on the ABAP system (>= S/4HANA 1809)
### Creating new plugin definition
1) Start transaction `/UI2/FLP_CONF_DEF`
2) Create new entry at node *Define FLP Plugins*  
   ![image](https://user-images.githubusercontent.com/35834861/123606454-31f88380-d7fd-11eb-9bcf-75916e59016c.png)  
   > **Note**: The URL part is normally not needed as the plugin repository can be found via the Component ID 
3) Save the entry (Customizing request needed)

### Activating the plugin
1) Start transaction `/UI2/FLP_SYS_CONF`
2) Create new entry at node *FLP PLugins*  
  ![image](https://user-images.githubusercontent.com/35834861/123604091-cdd4c000-d7fa-11eb-9415-cd909ae94a61.png)
3) Save the entry (Customizing request needed)

