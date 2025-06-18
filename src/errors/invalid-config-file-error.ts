import { BaseError } from '@kdt-bun/utils'

export class InvalidConfigFileError extends BaseError {
    public declare readonly path?: string

    public withPath(path: string) {
        return this.withValue('path', path)
    }
}
