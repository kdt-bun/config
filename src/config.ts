import type { ConfigSchema, ConfigSource } from './types'
import { type AnyObject, deepMerge, type DeepMergeOptions, tap } from '@kdt-bun/utils'
import { ParseConfigError, ResolveConfigError } from './errors'

export interface ConfigOptions extends DeepMergeOptions {
    sources?: ConfigSource[]
    defaults?: AnyObject
}

export class Config<T> {
    protected readonly sources: Set<ConfigSource>
    protected readonly defaults: AnyObject
    protected readonly deepMergeOptions: DeepMergeOptions

    public constructor(protected readonly schema: ConfigSchema<T>, { sources = [], defaults = {}, ...deepMergeOptions }: ConfigOptions = {}) {
        this.sources = new Set(sources)
        this.defaults = defaults
        this.deepMergeOptions = deepMergeOptions
    }

    public addSource(source: ConfigSource): this {
        return tap(this, () => this.sources.add(source))
    }

    public parse() {
        const config = this.resolve()

        try {
            return this.schema.parse(config)
        } catch (error) {
            throw new ParseConfigError('Failed to parse config', { cause: error }).withConfig(config)
        }
    }

    public async parseAsync() {
        const config = await this.resolveAsync()

        try {
            return await this.schema.parseAsync?.(config) ?? this.schema.parse(config)
        } catch (error) {
            throw new ParseConfigError('Failed to parse config', { cause: error }).withConfig(config)
        }
    }

    protected resolve() {
        let config: AnyObject = this.defaults

        for (const source of this.sources) {
            try {
                config = this.merge(source, config, source.load(config))
            } catch (error) {
                throw new ResolveConfigError('Failed to resolve config', { cause: error }).withSource(source.name)
            }
        }

        return config
    }

    protected async resolveAsync() {
        let config: AnyObject = this.defaults

        for (const source of this.sources) {
            try {
                config = this.merge(source, config, await source.loadAsync?.(config) ?? source.load(config))
            } catch (error) {
                throw new ResolveConfigError('Failed to resolve config', { cause: error }).withSource(source.name)
            }
        }

        return config
    }

    protected merge(source: ConfigSource, config: AnyObject, sourceConfig: AnyObject) {
        if (source.override ?? true) {
            return deepMerge(config, sourceConfig, this.deepMergeOptions)
        }

        return deepMerge(sourceConfig, config, this.deepMergeOptions)
    }
}
