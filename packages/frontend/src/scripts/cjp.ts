import { replace, json2Dict } from "@/scripts/generator"
import type { TextData } from "@/scripts/generator"

import jsonCommon from "@/cjp-filter/common.json"
import jsonPNoun from "@/cjp-filter/propernoun.json"
import jsonKana from "@/cjp-filter/kana.json"
import jsonKanji from "@/cjp-filter/kanji.json"
import jsonEmoji from "@/cjp-filter/emoji.json"

export const generate = (text: string = "") => {
  let data: TextData = { text, replaced: [] }

  data = replace(data, json2Dict(jsonEmoji))
  data = replace(data, json2Dict(jsonPNoun))
  data = replace(data, json2Dict(jsonCommon))
  data = replace(data, json2Dict(jsonKana))
  data = replace(data, json2Dict(jsonKanji))

  return data.text
}

export default { generate }