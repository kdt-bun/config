import type { Options } from 'camelcase'
import { resolveOptions, transform } from '@kdt-bun/utils'
import camelCase from 'camelcase'
import { unflatten as _unflatten, type UnflattenOptions as BaseUnflattenOptions } from 'flat'

export type CamelcaseOptions = Options & {
    enabled?: boolean
    exclude?: string[]
}

export interface UnflattenOptions extends BaseUnflattenOptions {
    camelcase?: CamelcaseOptions | boolean
}

export function createUnflattener({ camelcase = {}, ...options }: UnflattenOptions = {}) {
    const { enabled: enabledCamelcase = true, exclude: excludedCamelcaseKeys = [], ...camelcaseOptions } = resolveOptions(camelcase) || { enabled: false }

    const transformKey = (key: string) => {
        if (enabledCamelcase && !excludedCamelcaseKeys.includes(key)) {
            key = camelCase(key, camelcaseOptions)
        }

        return options.transformKey?.(key) ?? key
    }

    return <T, R>(obj: T): R => _unflatten(obj, { delimiter: '__', object: false, overwrite: true, ...options, transformKey })
}

export type GetUnflattenerOptions = UnflattenOptions & { enabled?: boolean } | boolean

export function getUnflattener(options: GetUnflattenerOptions = true, defaultOptions: UnflattenOptions = {}) {
    return transform({ enabled: true, ...defaultOptions, ...(resolveOptions(options) || { enabled: false }) }, ({ enabled, ...options }) => (enabled ? createUnflattener(options) : (obj) => obj))
}
