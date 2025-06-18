import type { ConfigSchema, ContentParser } from './types'
import { isArray, isNullish, isString, resolveOptions, transform } from '@kdt-bun/utils'
import { Config, type ConfigOptions } from './config'
import { InvalidConfigFileError } from './errors'
import { ArgvSource, type ArgvSourceOptions, DEFAULT_PATH_KEYS, DEFAULT_URL_KEYS, EnvSource, type EnvSourceOptions, type FileParserResolver, FileSource, type FileSourceOptions, RemoteSource, type RemoteSourceOptions } from './sources'
import { json, type JsonParserOptions, searchConfigPath, type SearchConfigPathOptions, toml, yaml, type YamlParserOptions } from './utils'

export interface DefineConfigParserOptions {
    json?: JsonParserOptions
    yaml?: YamlParserOptions
}

export interface DefineConfigRemoteConfig extends RemoteSourceOptions {
    url: string
    parser?: ContentParser
}

export interface DefineConfigFileConfig extends Omit<FileSourceOptions, 'path' | 'pathKeys'> {
    path: SearchConfigPathOptions | string
    parser?: ContentParser
}

export interface ConfigPathKeysOptions extends Omit<FileSourceOptions, 'path' | 'pathKeys' | 'resolveParser'> {
    keys?: string[]
    parser?: ContentParser
}

export interface ConfigUrlKeysOptions extends Omit<RemoteSourceOptions, 'url' | 'urlKeys' | 'resolveParser'> {
    keys?: string[]
    parser?: ContentParser
}

export interface DefineConfigOptions extends ConfigOptions {
    argv?: ArgvSourceOptions | boolean
    env?: EnvSourceOptions | boolean
    remotes?: Array<DefineConfigRemoteConfig | string>
    files?: Array<DefineConfigFileConfig | string>
    extensions?: string[]
    parsers?: DefineConfigParserOptions
    configPathKeys?: ConfigPathKeysOptions | string[] | boolean
    configUrlKeys?: ConfigUrlKeysOptions | string[] | boolean
}

export function defineConfig<T>(schema: ConfigSchema<T>, { argv = true, env = true, remotes = [], files = [], extensions, parsers = {}, configPathKeys = true, configUrlKeys = false, ...configOptions }: DefineConfigOptions = {}) {
    const config = new Config(schema, configOptions)
    const jsonParser = json(parsers.json)
    const yamlParser = yaml(parsers.yaml)
    const tomlParser = toml()

    const parsersMap = new Map<string, ContentParser>([
        ['.json5', jsonParser],
        ['.json', jsonParser],
        ['.yaml', yamlParser],
        ['.yml', yamlParser],
        ['.toml', tomlParser],
    ])

    const getParser = (path: string) => {
        for (const [ext, parser] of parsersMap) {
            if (path.endsWith(ext)) {
                return parser
            }
        }

        throw new InvalidConfigFileError('No parser found').withPath(path)
    }

    extensions ??= [...parsersMap.keys()]

    if (remotes.length > 0) {
        for (const remote of remotes) {
            const { url, parser = jsonParser, ...options } = transform(resolveOptions(remote), (options) => (isString(options) ? { url: options } : options))

            if (url) {
                config.addSource(new RemoteSource(parser, { url, ...options }))
            }
        }
    }

    if (files.length > 0) {
        for (const file of files) {
            const { path: pathOrSearchConfig, parser, ...options } = transform(resolveOptions(file), (options) => (isString(options) ? { path: { name: options, extensions } } : options))
            const path = isString(pathOrSearchConfig) ? pathOrSearchConfig : searchConfigPath(pathOrSearchConfig)

            if (isNullish(path)) {
                throw new InvalidConfigFileError('No config file found')
            }

            config.addSource(new FileSource(parser ?? getParser(path), { path, ...options, pathKeys: false }))
        }
    }

    if (env) {
        config.addSource(new EnvSource(resolveOptions(env)))
    }

    if (argv) {
        config.addSource(new ArgvSource(resolveOptions(argv)))
    }

    if (configPathKeys) {
        const { keys = DEFAULT_PATH_KEYS, parser, ...options } = transform(resolveOptions(configPathKeys), (options) => (isArray(options) ? { keys: options } : options))

        if (keys.length > 0) {
            const resolveParser: FileParserResolver = (path) => {
                return parser ?? getParser(path)
            }

            config.addSource(new FileSource(jsonParser, { override: false, ...options, path: undefined, pathKeys: keys, resolveParser }))
        }
    }

    if (configUrlKeys) {
        const { keys = DEFAULT_URL_KEYS, parser, ...options } = transform(resolveOptions(configUrlKeys), (options) => (isArray(options) ? { keys: options } : options))

        if (keys.length > 0) {
            config.addSource(new RemoteSource(parser ?? jsonParser, { override: false, ...options, url: undefined, urlKeys: keys }))
        }
    }

    return config
}
