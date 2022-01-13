// @ts-check

/** @type {import('./src/generate').GeneratorOptions} */
const options = {
  output: 'test/',
  api: [
    {
      container: 'test',
      host: 'VITE_API_URL',
      swagger: '/api-json',
    },
  ],
};

module.exports = options;
