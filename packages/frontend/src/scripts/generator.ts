export type TextData = {
  text: string
  replaced: ReplaceHistory[]
}

type ReplaceHistory = {
  begin: number
  end: number
}

export type Dict = {
  match: RegExp
  replace: string
}[]

export const replace = (origData: TextData, dict: Dict): TextData => {
  const data: TextData = { ...origData }

  dict.forEach(word => {
    const match = data.text.match(word.match) || []
    const extra = data.text.split(word.match)
    let cursor = extra[0].length
    let processed = false

    const replaced = match.map((str, i) => {
      const cursorEnd = cursor + str.length - 1

      // 以前に置換した範囲と被ってるかどうか
      if (
        data.replaced.some(
          (hist: ReplaceHistory) =>
            (hist.begin <= cursor && cursor <= hist.end) ||
            (hist.begin <= cursorEnd && cursorEnd <= hist.end)
        )
      ) {
        cursor += str.length + extra[i + 1].length
        return str
      } else {
        // 変換前後で文字列長が等しいかどうか
        if (str.length === word.replace.length) {
          data.replaced.push({ begin: cursor, end: cursorEnd })
        } else {
          // ずらす
          const diff = word.replace.length - str.length
          data.replaced = data.replaced.map((hist: ReplaceHistory) =>
            cursor < hist.begin
              ? { begin: hist.begin + diff, end: hist.end + diff }
              : hist
          )
          data.replaced.push({ begin: cursor, end: cursorEnd + diff })
        }
        cursor += word.replace.length + extra[i + 1].length
        processed = true
        return word.replace
      }
    })

    if (processed) {
      const interleave = <T>([x, ...xs]: T[], ys: T[] = []): T[] =>
        x === undefined ? ys : [x, ...interleave(ys, xs)]

      data.text = interleave(extra, replaced).join("")
    }
  })

  return data
}

export const json2Dict = (obj: { [key: string]: string }): Dict => {
  const dict: Dict = []
  for (const key in obj) {
    try {
      dict.push({
        match: new RegExp(key, "g"),
        replace: obj[key],
      })
    } catch {}
  }
  return dict
}