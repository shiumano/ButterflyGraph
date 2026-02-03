export default [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
        rules: {
            "no-cond-assign": ["error", "always"],
            "no-constant-binary-expression": "warn",
            "no-fallthrough": "warn",
            "eqeqeq": "warn",
            "no-var": "warn",
            "prefer-const": "warn",
            "no-template-curly-in-string": "warn",
            "no-shadow": "warn",
            "curly": ["warn", "multi-line"],
            "for-direction": "error",
            "semi": ["warn", "always"],
            "quotes": ["warn", "double"],
            "no-restricted-syntax": [
                "error",
                {
                    "selector": "ImportDeclaration[source.value=/^\\..*(?<!\\.js)$/]",
                    "message": "importには '.js' が必要です。"
                }
            ],
            "no-restricted-imports": [
                "error",
                {
                    "patterns": [{
                        "group": ["@*"],
                        "message": "ブラウザ環境ではエイリアス（@coreなど）は使えません。相対パス（../../）で記述してください。"
                    }]
                }
            ]
        }
    }
];
