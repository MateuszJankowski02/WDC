const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    include: ["**/*.test.js"],
    environment: "node",
    globals: true,
  },
});
