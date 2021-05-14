# flp-systeminfo-plugin
Fiori Launchpad Plugin for 
- displaying ABAP system info
- changing language
  - via Dropdown of all installed languages in the system (works only if the SICF service /sap/bc/adt is active and user has authority to use it)
  - from(to) German to(from) English
- changing the client
  - via Dropdown of all available clients in the system (works only if the SICF service /sap/bc/adt is active and user has authority to use it)
  - or via direkt input via Popup input dialog (if above service is not active)

## Setup
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

## Testing
```
$ npm run start
```

## Deployment to ABAP System
```
$ npm run deploy
```
