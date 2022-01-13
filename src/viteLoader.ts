import yargs from 'yargs';
import { resolveConfig } from 'vite';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('mode', {
    alias: 'm',
    type: 'string',
  })
  .parseSync();

const mode = argv.mode ?? undefined;

export async function viteLoader(env: string) {
  const config = await resolveConfig({ mode }, 'build');
  const val = config.env[env];
  if (typeof val !== 'string')
    throw new Error(
      `Enviroment variable (${env}) missing for mode (${config.mode})`
    );
  return val;
}
