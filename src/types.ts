import type { AnyObject } from '@kdt-bun/utils'

export interface ConfigSchema<T> {
    parse: (input: AnyObject) => T
    parseAsync?: (input: AnyObject) => Promise<T>
}

export interface ConfigSource {
    name: string
    override?: boolean
    load: (resolvedConfig: AnyObject) => AnyObject
    loadAsync?: (resolvedConfig: AnyObject) => Promise<AnyObject>
}

export type ContentParser = (content: string) => AnyObject
