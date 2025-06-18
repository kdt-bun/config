import type { ConfigSource, ContentParser } from '../types'
import { type AnyObject, type Awaitable, isString, resolveOptions, type UrlLike, withRetry, type WithRetryOptions, withTimeout } from '@kdt-bun/utils'
import { RemoteConfigError, UnsupportedOperationError } from '../errors'

export const DEFAULT_URL_KEYS = ['configUrl', 'config_url', 'config-url', 'CONFIG_URL', 'CONFIG-URL']

export type RemoteParserResolver = (url: UrlLike, content: string, parser: ContentParser) => ContentParser

export interface RemoteSourceBasicAuth {
    username: string
    password: string
}

export interface RemoteSourceOptions {
    url?: UrlLike
    urlKeys?: string[] | boolean
    auth?: RemoteSourceBasicAuth
    timeout?: number
    retry?: (WithRetryOptions<unknown> & { enabled?: boolean }) | boolean
    fetch?: typeof fetch
    request?: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }
    deserialize?: (data: string) => Awaitable<string>
    override?: boolean
    resolveParser?: RemoteParserResolver
}

export class RemoteSource implements ConfigSource {
    public readonly name = 'remote'
    public readonly override?: boolean

    protected readonly url?: UrlLike
    protected readonly urlKeys: string[] | boolean
    protected readonly resolveParser: RemoteParserResolver

    public constructor(protected readonly parser: ContentParser, protected readonly options: RemoteSourceOptions = {}) {
        this.override = options.override
        this.url = options.url
        this.urlKeys = options.urlKeys ?? true
        this.resolveParser = options.resolveParser ?? ((_, __, parser) => parser)
    }

    public load(): never {
        throw new UnsupportedOperationError('RemoteSource does not support synchronous loading')
    }

    public async loadAsync(resolvedConfig: AnyObject) {
        const url = this.getConfigUrl(resolvedConfig)

        if (!url) {
            return {}
        }

        return this.getFetch(url, this.options)().then((content) => this.resolveParser(url, content, this.parser)(content))
    }

    protected async handleResponse(response: Response) {
        const body = await response.text()

        if (!response.ok) {
            throw new RemoteConfigError('Failed to fetch remote config').withStatus(`${response.status} ${response.statusText}`).withBody(body).withHeaders(Object.fromEntries(response.headers.entries()))
        }

        return body
    }

    protected getFetch(url: UrlLike, { auth, fetch = globalThis.fetch, timeout = 10_000, retry = true, request = {}, deserialize = (r) => r }: RemoteSourceOptions = {}) {
        const { enabled: enabledRetry = true, ...retryOptions } = resolveOptions(retry) || { enabled: false }

        if (auth) {
            request.headers ??= {}
            request.headers['Authorization'] = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
        }

        const fetchWithTimeout = async () => {
            return withTimeout(fetch(url, request), timeout, 'Remote fetch timed out').then((response) => this.handleResponse(response)).then((r) => deserialize(r))
        }

        if (enabledRetry) {
            return async () => withRetry(fetchWithTimeout, retryOptions)
        }

        return fetchWithTimeout
    }

    protected getConfigUrl(resolvedConfig: AnyObject) {
        const urlKeys = this.urlKeys === true ? DEFAULT_URL_KEYS : this.urlKeys

        if (!urlKeys || urlKeys.length === 0) {
            return this.url
        }

        for (const key of urlKeys) {
            if (key in resolvedConfig && isString(resolvedConfig[key])) {
                return resolvedConfig[key]
            }
        }

        return this.url
    }
}
