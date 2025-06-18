import { BaseError } from '@kdt-bun/utils'

export class ResolveConfigError extends BaseError {
    public declare readonly source?: string

    public withSource(source: string) {
        return this.withValue('source', source)
    }
}
