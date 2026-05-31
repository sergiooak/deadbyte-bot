const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const TIMEAPI_URL = 'https://timeapi.io/api/Time/current/coordinate'
const USER_AGENT = 'DeadByte-Bot/4.0 (WhatsApp bot; github.com/sergiooak/deadbyte-bot)'

export interface GeocodedLocation {
  displayName: string
  lat: number
  lon: number
}

export interface TimeResult {
  location: GeocodedLocation
  timeZone: string
  dateTime: string
  time: string
  hour: number
  minute: number
  dayOfWeek: string
  utcOffsetMinutes: number
}

export function getUtcOffsetMinutes(timeZone: string, date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    timeZoneName: 'shortOffset'
  }).formatToParts(date)
  const offsetStr = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0'
  const match = offsetStr.match(/GMT([+-])(\d+)(?::(\d+))?/)
  if (!match) return 0
  const sign = match[1] === '+' ? 1 : -1
  const hours = parseInt(match[2], 10)
  const minutes = parseInt(match[3] ?? '0', 10)
  return sign * (hours * 60 + minutes)
}

export function formatUtcOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-'
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`
}

/**
 * Returns the clock emoji closest to the given hour and minute.
 * Covers full hours (🕐–🕛) and half hours (🕜–🕧).
 */
export function clockEmoji(hour: number, minute: number): string {
  const useHalf = minute >= 15 && minute < 45
  // When minutes >= 45 round up to next hour
  const displayHour = minute >= 45 ? (hour + 1) % 24 : hour
  const h12 = displayHour % 12 || 12

  if (useHalf) {
    // 🕜 U+1F55C = 1:30 … 🕦 U+1F566 = 11:30, 🕧 U+1F567 = 12:30
    return h12 === 12 ? '\u{1F567}' : String.fromCodePoint(0x1f55c + h12 - 1)
  }
  // 🕐 U+1F550 = 1:00 … 🕚 U+1F55A = 11:00, 🕛 U+1F55B = 12:00
  return h12 === 12 ? '\u{1F55B}' : String.fromCodePoint(0x1f550 + h12 - 1)
}

export async function geocodeLocation(query: string): Promise<GeocodedLocation | null> {
  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '0')

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8' }
  })

  if (!response.ok) return null

  const results = (await response.json()) as Array<{ display_name: string; lat: string; lon: string }>
  if (!results.length) return null

  const [first] = results
  return {
    displayName: first.display_name,
    lat: parseFloat(first.lat),
    lon: parseFloat(first.lon)
  }
}

export async function getTimeAtCoordinates(lat: number, lon: number): Promise<Omit<TimeResult, 'location'> | null> {
  const url = new URL(TIMEAPI_URL)
  url.searchParams.set('latitude', lat.toFixed(6))
  url.searchParams.set('longitude', lon.toFixed(6))

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT }
  })

  if (!response.ok) return null

  const data = (await response.json()) as {
    timeZone: string
    dateTime: string
    time: string
    hour: number
    minute: number
    dayOfWeek: string
  }

  return {
    timeZone: data.timeZone,
    dateTime: data.dateTime,
    time: data.time,
    hour: data.hour,
    minute: data.minute,
    dayOfWeek: data.dayOfWeek,
    utcOffsetMinutes: getUtcOffsetMinutes(data.timeZone)
  }
}

export function buildShortLocationName(displayName: string): string {
  // Nominatim returns long names like "São Paulo, Região Imediata de São Paulo, ..."
  // Take the first two comma-separated parts for a concise label
  const parts = displayName.split(',').map((p) => p.trim())
  return parts.slice(0, 2).join(', ')
}

export async function getTimeForLocation(query: string): Promise<TimeResult | null> {
  const location = await geocodeLocation(query)
  if (!location) return null

  const timeData = await getTimeAtCoordinates(location.lat, location.lon)
  if (!timeData) return null

  return { location, ...timeData }
}
