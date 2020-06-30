/*global process */
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

module.exports = function(grunt) {
    "use strict";
    grunt.loadNpmTasks("grunt-nwabap-ui5uploader");

    grunt.initConfig({
        nwabap_ui5uploader: {
            options: {
                conn: {
                    server: process.env.UI5_TASK_NWABAP_DEPLOYER__SERVER,
                    useStrictSSL: false,
                    client: process.env.UI5_TASK_NWABAP_DEPLOYER__CLIENT,
                    language: "EN"
                },
                auth: {
                    user: process.env.UI5_TASK_NWABAP_DEPLOYER__USER,
                    pwd: process.env.UI5_TASK_NWABAP_DEPLOYER__PASSWORD
                }
            },
            dev: {
                options: {
                    ui5: {
                        package: "$TMP",
                        create_transport: false,
                        transport_use_user_match: false,
                        transport_use_locked: false,
                        bspcontainer: "ZFLPLOGONINFO",
                        transportno: process.env.UI5_TASK_NWABAP_DEPLOYER__TKORRNO,
                        bspcontainer_text: "Logon Information Plugin for FLP",
                        calc_appindex: true
                    },
                    resources: {
                        cwd: "dist",
                        src: "**/*.*"
                    }
                }
            }
        }
    });

    grunt.registerTask("default", ["nwabap_ui5uploader"]);
};
