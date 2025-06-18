import type { ConfigSource } from '../types'
import { resolve } from 'node:path'
import { type AnyObject, hasPrefix, resolveOptions } from '@kdt-bun/utils'
import { config, type DotenvConfigOptions } from 'dotenv'
import { getUnflattener, type GetUnflattenerOptions } from '../utils'

export interface DotEnvOptions extends Omit<DotenvConfigOptions, 'processEnv'> {
    enabled?: boolean
    ignoreOnErrors?: boolean
}

export interface EnvSourceOptions {
    env?: NodeJS.ProcessEnv
    prefix?: string
    stripPrefix?: boolean
    unflatten?: GetUnflattenerOptions
    dotenv?: DotEnvOptions | boolean
}

export class EnvSource implements ConfigSource {
    public readonly name = 'env'

    protected readonly env: NodeJS.ProcessEnv
    protected readonly prefix: string
    protected readonly stripPrefix: boolean
    protected readonly unflattener: (obj: AnyObject) => AnyObject

    public constructor({ env = process.env, prefix = 'APP_', stripPrefix = true, unflatten = true, dotenv = true }: EnvSourceOptions = {}) {
        this.env = this.getEnv(env, resolveOptions(dotenv) || { enabled: false })
        this.prefix = prefix
        this.stripPrefix = stripPrefix
        this.unflattener = getUnflattener(unflatten)
    }

    public load() {
        if (this.prefix.length === 0) {
            return this.unflattener(this.env)
        }

        const config: AnyObject = {}

        for (const [key, value] of Object.entries(this.env)) {
            if (hasPrefix(key, this.prefix)) {
                config[this.stripPrefix ? key.slice(this.prefix.length) : key] = value
            }
        }

        return this.unflattener(config)
    }

    protected getEnv(env: NodeJS.ProcessEnv, { enabled = true, ignoreOnErrors = true, path = this.getDefaultDotEnvPaths(), ...options }: DotEnvOptions = {}) {
        if (!enabled) {
            return env
        }

        const dotenv = config({ path, ...options, processEnv: {} })

        if (dotenv.error && !ignoreOnErrors) {
            throw dotenv.error
        }

        return { ...dotenv.parsed, ...env }
    }

    protected getDefaultDotEnvPaths() {
        return ['.env.local', `.env.${process.env.NODE_ENV?.toLowerCase() ?? 'development'}`, '.env'].map((path) => resolve(process.cwd(), path))
    }
}
