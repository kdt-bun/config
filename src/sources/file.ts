import type { ConfigSource, ContentParser } from '../types'
import { existsSync, readFileSync } from 'node:fs'
import { type AnyObject, bufferToString, isBufferLike, isString, transform } from '@kdt-bun/utils'
import { InvalidConfigFileError } from '../errors'

export const DEFAULT_PATH_KEYS = ['configPath', 'config_path', 'config-path', 'CONFIG_PATH', 'CONFIG-PATH']

export type FileParserResolver = (path: string, content: string, parser: ContentParser) => ContentParser

export interface FileSourceOptions {
    override?: boolean
    path?: string
    pathKeys?: string[] | boolean
    encoding?: BufferEncoding
    resolveParser?: FileParserResolver
}

export class FileSource implements ConfigSource {
    public readonly override?: boolean
    public readonly name = 'file'

    protected readonly path?: string
    protected readonly pathKeys: string[] | boolean
    protected readonly encoding?: BufferEncoding
    protected readonly resolveParser: FileParserResolver

    public constructor(protected readonly parser: ContentParser, { override, path, pathKeys = true, encoding = 'utf8', resolveParser = (_, __, parser) => parser }: FileSourceOptions = {}) {
        this.override = override
        this.path = path
        this.pathKeys = pathKeys
        this.encoding = encoding
        this.resolveParser = resolveParser
    }

    public load(resolvedConfig: AnyObject) {
        const path = this.getConfigPath(resolvedConfig)

        if (!path) {
            return {}
        }

        const content = this.getConfigFileContent(path)

        try {
            return this.resolveParser(path, content, this.parser)(content)
        } catch (error) {
            throw new InvalidConfigFileError('Failed to parse config file', { cause: error }).withPath(path)
        }
    }

    protected getConfigFileContent(path: string) {
        if (!existsSync(path)) {
            throw new InvalidConfigFileError('Config file does not exist').withPath(path)
        }

        try {
            return transform(readFileSync(path, this.encoding), (content) => (isBufferLike(content) ? bufferToString(content) : content))
        } catch (error) {
            throw new InvalidConfigFileError('Failed to read config file', { cause: error }).withPath(path)
        }
    }

    protected getConfigPath(resolvedConfig: AnyObject) {
        const pathKeys = this.pathKeys === true ? DEFAULT_PATH_KEYS : this.pathKeys

        if (!pathKeys || pathKeys.length === 0) {
            return this.path
        }

        for (const key of pathKeys) {
            if (key in resolvedConfig && isString(resolvedConfig[key])) {
                return resolvedConfig[key]
            }
        }

        return this.path
    }
}
