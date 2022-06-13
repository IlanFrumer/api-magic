// @ts-check
require('dotenv/config');

/** @type {import('./src/generate').GeneratorOptions} */
const options = {
  output: 'test/',
  api: [
    {
      container: 'test',
      host: process.env.API_URL,
      swagger: '/api-json',
    },
  ],
};

module.exports = options;
