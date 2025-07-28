// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended")
const reactNativePlugin = require("eslint-plugin-react-native")

module.exports = defineConfig([
  expoConfig,
  {
    plugins: {
      "react-native": reactNativePlugin,
    },
    rules: {
      "react-native/no-unused-styles": "warn",
    },
  },
  eslintPluginPrettierRecommended,
  {
    rules: {
      "prettier/prettier": [
        "error",
        {
          semi: false,
          singleQuote: false,
          tabWidth: 2,
        },
      ],
    },
  },
  {
    ignores: ["dist/*"],
  },
])
