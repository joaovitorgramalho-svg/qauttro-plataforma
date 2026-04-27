/**
 * Parses any sheet into a { [id]: name } map of attendants.
 * Tries named columns first, then auto-detects by data type (number col + string col).
 */
export function parseFuncionarios(rows) {
  const map = {}
  if (!rows || rows.length === 0) return map

  const keys = Object.keys(rows[0])
  console.log('[funcionarios] columns:', keys)

  // 1) Try known column names (case-insensitive)
  const findKey = (...candidates) =>
    keys.find(k => candidates.some(c => k.toUpperCase().replace(/[^A-Z]/g, '') === c.toUpperCase()))

  let idKey = findKey('CDFUN', 'CDFUNRE', 'CODIGO', 'COD', 'ID', 'CDATENDENTE')
  let nameKey = findKey('NOMEFUN', 'NOME', 'NOMEFUNCIONARIO', 'NOMEATENDENTE', 'NAME', 'FUNCIONARIO', 'ATENDENTE')

  // 2) Auto-detect: first column whose first cell resolves to a positive integer = id,
  //    first column whose first cell is a non-trivial string = name.
  //    Accepts Excel numeric cells (number) AND string cells that look like integers ("27")
  //    because some Excel configurations export numeric codes as text.
  if (!idKey || !nameKey) {
    for (const key of keys) {
      const val = rows[0][key]
      const asNum = Number(val)
      if (!idKey && val !== null && val !== undefined && val !== '' && !isNaN(asNum) && Number.isInteger(asNum) && asNum > 0) {
        idKey = key
      } else if (!nameKey && typeof val === 'string' && val.trim().length > 1) {
        nameKey = key
      }
      if (idKey && nameKey) break
    }
  }

  // 3) Fallback: first two columns regardless of type
  if (!idKey) idKey = keys[0]
  if (!nameKey) nameKey = keys[1]

  console.log('[funcionarios] using id:', idKey, '| name:', nameKey)

  for (const row of rows) {
    const id = row[idKey]
    const name = row[nameKey]
    if (id !== undefined && id !== null && name) {
      const numId = Number(id)
      if (!isNaN(numId) && numId > 0) {
        map[numId] = String(name).trim()
      }
    }
  }

  return map
}
