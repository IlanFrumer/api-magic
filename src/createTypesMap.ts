import { isReference, extractDef } from './extractDef';
import type { OpenAPIV3 } from 'openapi-types';

const ARGS_REGEX = /\{([a-z]+)\}/gi;

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

function entries<T>(object?: T) {
  return (object ? Object.entries(object) : []) as Entries<T>;
}

export function createTypesMap(data: OpenAPIV3.Document, container: string) {
  const Types = new Map<string, string>();
  const Interfaces = new Map<string, string[]>();
  const Paths: string[] = [];

  for (const [path, pathItem] of entries(data.paths)) {
    if (path === 'undefined') {
      console.warn(`GENERATOR: bad path ${JSON.stringify(pathItem, null, 2)}`);
      continue;
    }

    const methods = new Map([
      ['get', pathItem?.get],
      ['post', pathItem?.post],
      ['patch', pathItem?.patch],
      ['delete', pathItem?.delete],
      ['options', pathItem?.options],
    ]);

    for (const [method, opts] of methods.entries()) {
      if (!opts) continue;
      let ref: string | null = null;
      let postRef: string | null = null;
      for (let status in opts.responses) {
        let res = opts.responses[status];

        if (!isReference(res) && /^2\d\d/.test(status) && res.content) {
          const schema = res.content['application/json']['schema'];
          ref = schema ? extractDef(schema) : null;
        }
      }

      if (opts.requestBody && !isReference(opts.requestBody)) {
        const schema = opts.requestBody.content['application/json'].schema;
        postRef = schema ? extractDef(schema) : null;
      }

      const args: string[] = [];
      const entry =
        '`' +
        path.replace(ARGS_REGEX, (m, v) => {
          args.push(v + ': Arg');
          return '$' + m;
        }) +
        '`';

      let postGeneric = 'never';
      if (postRef != null) {
        args.push(`data: ${container}.${postRef}`);
        postGeneric = `${container}.${postRef}`;
      }

      const name =
        method +
        path
          .replace(/-/g, '/')
          .replace(
            /\/\{?([0-9a-z_]+)\}?/gi,
            (_, m1) => m1[0].toUpperCase() + m1.slice(1)
          )
          .replace(/^\/$/, 'Root')
          .replace(/\/$/, '');

      const params = postRef == null ? [entry] : [entry, 'data'];

      const generic =
        ref == null ? 'unknown' : ref === 'Blob' ? ref : `${container}.${ref}`;

      const config = generic === 'Blob' ? ",{responseType: 'blob'}" : '';

      Paths.push(`
        export const ${name} = (${args.join(', ')}) =>
          api.${method}<${postGeneric}, AxiosResponse<${generic}>>(${params.join(
        ', '
      )}${config})
        `);
    }
  }

  for (let [node, schema] of entries(data.components?.schemas)) {
    if (isReference(schema)) continue;
    if (!schema.type && schema.allOf) {
      node = `${node} extends ${extractDef(schema.allOf[0], false)}`;
      schema = schema.allOf[1];
    }

    if (isReference(schema)) continue;
    if (schema.type === 'string' && schema.enum) {
      Types.set(node, schema.enum.map((val) => `"${val}"`).join(' | '));
    } else if (schema.type === 'object' && schema.properties) {
      const props: string[] = [];
      Interfaces.set(node, props);
      for (const [prop, def] of entries(schema.properties)) {
        if (prop.startsWith('$')) continue;
        const type = extractDef(def);
        props.push(`${prop}: ${type}`);
      }
    }
  }

  const types = Array.from(Types.entries())
    .map(([a, b]) => `export type ${a} = ${b}`)
    .join('\n\n');

  const interfaces = Array.from(Interfaces.entries())
    .map(([a, b]) => `export interface ${a} { ${b.join(' ; ')} }`)
    .join('\n\n');

  const paths = Paths.join('\n');

  return { types, interfaces, paths };
}
