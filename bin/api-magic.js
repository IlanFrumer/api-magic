#!/usr/bin/env node
const { generate } = require('../lib');
const { resolve } = require('path');

const config = resolve('api-magic.config.js');
async function main() {
  try {
    const conf = require(config);
    await generate(conf);
  } catch (e) {
    console.log(`GENERATOR: failed to load api-magic.config.js`);
    process.exit(1);
  }
}

main();
