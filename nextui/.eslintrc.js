/* eslint-disable unicorn/prefer-module */

module.exports = {
    "extends": [
        "../.eslintrc.json",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:jsx-control-statements/recommended",
        "plugin:jest/recommended",
        "plugin:import/recommended"
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "plugins": [
        "jsx-control-statements",
        "react"
    ],
    "settings": {
        "react": {
            "pragma": "React",
            "version": "17.0.0"
        },
        "import/resolver": {
            "node": {
                "paths": [ __dirname ],
                "extensions": [
                    ".js",
                    ".jsx",
                    ".mjs"
                ]
            }
        }
    },
    "env": {
        "jsx-control-statements/jsx-control-statements": true
    },
    "rules": {
        "node/no-unsupported-features/es-syntax": 0,
        "no-console": 0,
        "react/jsx-no-undef": [ 2, { "allowGlobals": true } ],
        "node/no-missing-import": 0,
        "import/order": [
            "error",
            {
                "pathGroups": [
                    {
                        "pattern": "lib/**",
                        "group": "external",
                        "position": "after"
                    },
                    {
                        "pattern": "hooks/**",
                        "group": "external",
                        "position": "after"
                    },
                    {
                        "pattern": "components/**",
                        "group": "external",
                        "position": "after"
                    }
                ],
                "groups": [
                    "builtin",
                    "external",
                    "internal",
                    "parent",
                    "sibling",
                    "index",
                    "object"
                ]
            }
        ]
    }
};
