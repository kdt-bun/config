import JSON5 from 'json5'
import { ensureObject } from '../config'

export type JsonReviver = (key: string, value: any) => any

export interface JsonParserOptions {
    reviver?: JsonReviver
}

export function json({ reviver }: JsonParserOptions = {}) {
    return (content: string) => ensureObject(JSON5.parse(content, reviver))
}
