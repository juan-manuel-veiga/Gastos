/**
 * csvParser.ts
 *
 * Reads bank statement CSVs that contain the columns:
 *   FECHA  (date)
 *   CONCEPTO  (description)
 *   DEBITO  (amount)
 *
 * Column names are matched case-insensitively and accent-insensitively.
 * Rows where DEBITO is empty or zero are skipped (credits / non-debit lines).
 *
 * Separator: auto-detected (comma, semicolon, tab, pipe).
 * Dates: dd/mm/yyyy · yyyy-mm-dd · dd-mm-yyyy · dd/mm/yy
 * Amounts: European (1.234,56) · US (1,234.56) · plain (500) · negative (-200)
 */

export interface ParsedRow {
  date: string      // ISO yyyy-MM-dd
  title: string
  amount: number    // always positive
  rawLine: string
}

export interface ParseResult {
  rows: ParsedRow[]
  skipped: number
  errors: string[]
  detectedColumns: { date: number; description: number; amount: number }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function parseBankCSV(csvText: string): ParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) {
    return {
      rows: [], skipped: 0,
      errors: ['Archivo vacío'],
      detectedColumns: { date: 0, description: 1, amount: 2 },
    }
  }

  const separator = detectSeparator(lines[0])
  const allRows   = lines.map((l) => splitCSVLine(l, separator))

  // Find the header row that contains FECHA, CONCEPTO and DEBITO
  const headerIdx = findRequiredHeaderRow(allRows)

  if (headerIdx < 0) {
    return {
      rows: [], skipped: lines.length,
      errors: ['No se encontraron las columnas FECHA, CONCEPTO y DEBITO en el archivo.'],
      detectedColumns: { date: 0, description: 1, amount: 2 },
    }
  }

  const headerRow = allRows[headerIdx]
  const cols      = resolveRequiredColumns(headerRow)

  // cols will always be valid here because findRequiredHeaderRow already
  // confirmed all three exist, but guard anyway
  if (cols.date < 0 || cols.description < 0 || cols.amount < 0) {
    return {
      rows: [], skipped: lines.length,
      errors: ['No se encontraron las columnas FECHA, CONCEPTO y DEBITO en el archivo.'],
      detectedColumns: { date: 0, description: 1, amount: 2 },
    }
  }

  const dataRows = allRows.slice(headerIdx + 1)
  const rows:   ParsedRow[] = []
  let skipped = 0

  for (const cells of dataRows) {
    const rawDate   = cells[cols.date]?.trim()   ?? ''
    const rawTitle  = cells[cols.description]?.trim() ?? ''
    const rawAmount = cells[cols.amount]?.trim() ?? ''

    // Skip rows where DEBITO is blank (those are credits / headers / totals)
    if (!rawAmount) { skipped++; continue }

    const date = parseDate(rawDate)
    if (!date) { skipped++; continue }

    const title = cleanTitle(rawTitle)
    if (!title) { skipped++; continue }

    const amount = parseAmount(rawAmount)
    if (amount === null || amount === 0) { skipped++; continue }

    rows.push({
      date,
      title,
      amount: Math.abs(amount),
      rawLine: cells.join(separator),
    })
  }

  return { rows, skipped, errors: [], detectedColumns: cols }
}

// ─── Separator detection ──────────────────────────────────────────────────────

function detectSeparator(firstLine: string): string {
  const candidates: Record<string, number> = {
    ',':  (firstLine.match(/,/g)  ?? []).length,
    ';':  (firstLine.match(/;/g)  ?? []).length,
    '\t': (firstLine.match(/\t/g) ?? []).length,
    '|':  (firstLine.match(/\|/g) ?? []).length,
  }
  return Object.entries(candidates).sort((a, b) => b[1] - a[1])[0][0]
}

// ─── CSV line splitter (handles quoted fields) ────────────────────────────────

function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = []
  let current  = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

// ─── Normalize header cell for comparison ────────────────────────────────────

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^A-Z0-9]/g, '')       // strip non-alphanumeric
}

// ─── Find the row that has FECHA + CONCEPTO + DEBITO ─────────────────────────

function findRequiredHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const normalized = rows[i].map(normalizeHeader)
    const hasDate    = normalized.some((h) => h === 'FECHA')
    const hasDesc    = normalized.some((h) => h === 'CONCEPTO')
    const hasDebit   = normalized.some((h) => h === 'DEBITO')
    if (hasDate && hasDesc && hasDebit) return i
  }
  return -1
}

// ─── Resolve exact column indices ─────────────────────────────────────────────

function resolveRequiredColumns(
  header: string[]
): { date: number; description: number; amount: number } {
  const normalized = header.map(normalizeHeader)
  return {
    date:        normalized.indexOf('FECHA'),
    description: normalized.indexOf('CONCEPTO'),
    amount:      normalized.indexOf('DEBITO'),
  }
}

// ─── Date parsing ─────────────────────────────────────────────────────────────

function parseDate(raw: string): string | null {
  if (!raw) return null
  const s = raw.trim().replace(/\./g, '/').replace(/-/g, '/')

  // yyyy/mm/dd
  let m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/)
  if (m) return toISO(Number(m[1]), Number(m[2]), Number(m[3]))

  // dd/mm/yyyy  (Latin American default)
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return toISO(Number(m[3]), Number(m[2]), Number(m[1]))

  // dd/mm/yy
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (m) {
    const year = Number(m[3]) + (Number(m[3]) < 50 ? 2000 : 1900)
    return toISO(year, Number(m[2]), Number(m[1]))
  }

  // yyyy-mm-dd (ISO / timestamp)
  m = raw.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m) return toISO(Number(m[1]), Number(m[2]), Number(m[3]))

  return null
}

function toISO(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12) return null
  if (day   < 1 || day   > 31) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}`
}

// ─── Amount parsing ───────────────────────────────────────────────────────────

function parseAmount(raw: string): number | null {
  if (!raw || raw === '-' || raw === '') return null
  let s = raw.trim().replace(/\s/g, '')

  // Strip currency symbols / letter codes
  s = s.replace(/[$€£¥]/g, '').replace(/\b[A-Z]{3}\b/g, '').trim()

  if (!s || s === '-' || s === '+') return null

  const hasBoth = s.includes('.') && s.includes(',')

  if (hasBoth) {
    // Whichever separator comes last is the decimal separator
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.') // European: 1.234,56
    } else {
      s = s.replace(/,/g, '')                    // US: 1,234.56
    }
  } else if (/,\d{1,2}$/.test(s)) {
    // Comma as decimal: 500,50
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    // Plain number or dot-decimal
    s = s.replace(/,/g, '')
  }

  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

// ─── Title cleaning ───────────────────────────────────────────────────────────

function cleanTitle(raw: string): string {
  return raw
    .replace(/^["']|["']$/g, '')   // strip wrapping quotes
    .replace(/\s+/g, ' ')          // collapse whitespace
    .trim()
    .slice(0, 120)                  // generous cap — concepto can be long
}
