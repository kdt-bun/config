import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { isPlainObject } from '@kdt-bun/utils'
import { ParseConfigError } from '../errors'

export function ensureObject(value: unknown) {
    if (!isPlainObject(value)) {
        throw new ParseConfigError('Not a valid object')
    }

    return value
}

export interface SearchConfigPathOptions {
    name: string
    extensions: string[]
    cwd?: string
}

export function searchConfigPath(options: SearchConfigPathOptions) {
    const { name, extensions, cwd = process.cwd() } = options

    for (const ext of extensions) {
        const path = resolve(cwd, `${name}${ext}`)

        if (existsSync(path)) {
            return path
        }
    }

    return null
}
