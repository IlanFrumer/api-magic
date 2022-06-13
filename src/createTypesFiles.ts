import { OpenAPIV3 } from 'openapi-types';
import { createTypesMap } from './createTypesMap';
import { writeFile, writeFileFormatted } from './writeFile';

export type createTypesFilesProps = {
  data: OpenAPIV3.Document;
  container: string;
  host: string;
  output: string;
  header: string;
};

export async function createTypesFiles({
  data,
  container,
  host,
  output,
  header,
}: createTypesFilesProps) {
  const { types, interfaces, paths } = createTypesMap(data, container);

  // Generate Types
  const sourceTypes = [header, types, interfaces].join('\n\n');
  await writeFileFormatted(output, `${container}.types.ts`, sourceTypes);

  // Generate Api
  const imports = `
      import Axios, {AxiosResponse} from 'axios';
      import * as ${container} from './${container}.types';
      const baseURL = '${host}';
      const api = Axios.create({ baseURL });

      type Arg = string | number;

      ${paths}

      export * from './${container}.types';
      export { api as axios }
  `;

  const sourceApi = [header, imports].join('\n\n');
  await writeFileFormatted(output, `${container}.api.ts`, sourceApi);

  return container;
}

export type createIndexFilesProps = {
  containers: string[];
  output: string;
};

export async function createIndexFiles({
  output,
  containers,
}: createIndexFilesProps) {
  // Generate index
  const index = containers
    .map((container) => `export * as ${container} from './${container}.api';`)
    .join('\n');
  await writeFileFormatted(output, `index.ts`, index);

  // Generate .gitignore
  await writeFile(output, `.gitignore`, '*.ts');
}
