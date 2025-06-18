import type { Opts } from 'minimist'
import type { ConfigSource } from '../types'
import { type AnyObject, omit } from '@kdt-bun/utils'
import minimist from 'minimist'
import { getUnflattener, type GetUnflattenerOptions } from '../utils'

export interface ArgvSourceOptions extends Opts {
    argv?: string[]
    unflatten?: GetUnflattenerOptions
}

export class ArgvSource implements ConfigSource {
    public readonly name = 'argv'

    protected readonly argv: string[]
    protected readonly minimistOptions: Opts
    protected readonly unflattener: (obj: AnyObject) => AnyObject

    public constructor({ argv = process.argv.slice(2), unflatten = true, ...minimistOptions }: ArgvSourceOptions = {}) {
        this.argv = argv
        this.minimistOptions = minimistOptions
        this.unflattener = getUnflattener(unflatten, { delimiter: '.' })
    }

    public load() {
        return this.unflattener(omit(minimist(this.argv, this.minimistOptions), '_', '--'))
    }
}
