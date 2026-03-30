const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        files: ["app.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "script",
            globals: {
                ...globals.browser
            }
        },
        rules: {
            "no-unused-vars": [
                "error",
                {
                    vars: "local",
                    args: "after-used",
                    argsIgnorePattern: "^_"
                }
            ]
        }
    }
];
