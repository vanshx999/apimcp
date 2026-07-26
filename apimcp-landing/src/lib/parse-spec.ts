import { load as parseYaml } from 'js-yaml'

export function tryParseSpec(text: string): any {
  try {
    return JSON.parse(text)
  } catch {}
  try {
    return parseYaml(text)
  } catch {}
  return null
}

export function jsonUrl(url: string): string {
  return url.replace(/\.ya?ml$/i, '.json')
}
