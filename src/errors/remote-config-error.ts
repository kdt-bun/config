import { BaseError } from '@kdt-bun/utils'

export class RemoteConfigError extends BaseError {
    public declare readonly status?: string
    public declare readonly body?: string
    public declare readonly headers?: Record<string, string>
    public declare readonly url?: string

    public withStatus(status: string) {
        return this.withValue('status', status)
    }

    public withBody(body: string) {
        return this.withValue('body', body)
    }

    public withHeaders(headers: Record<string, string>) {
        return this.withValue('headers', headers)
    }

    public withUrl(url: string) {
        return this.withValue('url', url)
    }
}
