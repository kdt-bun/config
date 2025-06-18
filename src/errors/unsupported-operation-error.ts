import { BaseError } from '@kdt-bun/utils'

export class UnsupportedOperationError extends BaseError {
    public declare readonly operation?: string

    public withOperation(operation: string) {
        return this.withValue('operation', operation)
    }
}
