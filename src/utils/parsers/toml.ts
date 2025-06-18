import TOML from 'toml'
import { ensureObject } from '../config'

export function toml() {
    return (content: string) => ensureObject(TOML.parse(content))
}
