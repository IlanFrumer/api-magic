import fs from 'fs/promises';
import path from 'path';
import { resolveConfig, format } from 'prettier';

export async function writeFileFormatted(
  output: string,
  basename: string,
  source: string
) {
  const filepath = path.resolve(output, basename);
  await fs.mkdir(output, { recursive: true });
  const prettierConfig = await resolveConfig(filepath);
  const formatted = format(source, { filepath, ...prettierConfig });
  await fs.writeFile(filepath, formatted);
}

export async function writeFile(
  output: string,
  basename: string,
  source: string
) {
  const filepath = path.resolve(output, basename);
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(filepath, source);
}
