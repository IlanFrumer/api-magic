import { OpenAPIV3 } from 'openapi-types';

declare module 'openapi-types' {
  namespace OpenAPIV3 {
    interface ReferenceObject {
      nullable?: boolean;
      format?: string;
    }
  }
}

const REF_PREFIX = '#/components/schemas/';

export const isReference = (
  o: OpenAPIV3.ReferenceObject | any
): o is OpenAPIV3.ReferenceObject => {
  return !!(o as OpenAPIV3.ReferenceObject).$ref;
};

export function extractDef(
  def: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
  extra = true
) {
  let type: string;

  if (isReference(def)) {
    type = def.$ref.replace(REF_PREFIX, '');
  } else if (def.allOf) {
    type = `(${def.allOf.map((d) => extractDef(d)).join(' & ')})`;
  } else if (def.oneOf) {
    type = `(${def.oneOf.map((d) => extractDef(d)).join(' | ')})`;
  } else {
    switch (def.type) {
      case 'array':
        type = `${extractDef(def.items)}[]`;
        break;
      case 'integer':
        type = def.enum ? def.enum.join(' | ') : 'number';
        break;
      case 'string':
        type = def.format === 'binary' ? 'Blob' : 'string';
        type = def.enum ? def.enum.map((val) => `"${val}"`).join(' | ') : type;
        break;
      case 'number':
      case 'boolean':
        type = def.type;
        break;
      case 'object':
        if (def.additionalProperties)
          type =
            typeof def.additionalProperties === 'boolean'
              ? 'boolean'
              : extractDef(def.additionalProperties);
        else type = 'any';
        break;
      default:
        if (def.nullable) type = 'null';
        else if (JSON.stringify(def) === '{}') type = 'any';
        else throw new Error(`Unknown definition: ${JSON.stringify(def)}`);
    }
  }

  if (extra) {
    if (def.nullable && type != 'null') type += '| null';
    if (def.format && def.format !== 'binary') type += `/* ${def.format} */`;
  }

  return type;
}
