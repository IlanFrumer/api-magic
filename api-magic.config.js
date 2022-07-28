// @ts-check
require('dotenv/config');

/** @type {import('./src').GeneratorOptions} */
const options = {
  output: 'test/',
  api: [
    {
      container: 'test',
      host: process.env.API_URL ?? '',
      swagger: '/swagger/v1/swagger.json',
      auth: {
        username: process.env.API_USERNAME ?? '',
        password: process.env.API_PASSWORD ?? '',
      },
    },
  ],
};

module.exports = options;
