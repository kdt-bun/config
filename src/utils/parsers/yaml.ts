import type { Args } from '@kdt-bun/utils'
import YAML from 'yaml'
import { ensureObject } from '../config'

export type YamlParserOptions = NonNullable<Args<typeof YAML.parse>[2]>

export function yaml(options: YamlParserOptions = {}) {
    return (content: string) => ensureObject(YAML.parse(content, options))
}
