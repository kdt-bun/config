import { type AnyObject, BaseError } from '@kdt-bun/utils'

export class ParseConfigError extends BaseError {
    public declare readonly config?: AnyObject

    public withConfig(config: AnyObject) {
        return this.withValue('config', config)
    }
}
