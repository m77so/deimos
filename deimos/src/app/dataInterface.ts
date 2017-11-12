export interface MapZairai {
  startIndex: number
  endIndex: number
  targetLine: number
}
export interface Line {
  id: number
  name: string
  kana: string
  src: string
  dest: string
  stations: Array<string>
  stationIds: Array<number>
  kms: Array<number>
  akms: Array<number>
  dupLineStationIds: Array<number>
  chiho: boolean
  company: number[]
  mapZairai: MapZairai[]
}
export interface Station {
  id: number
  name: string
  kana: string
  lineIds: Array<number>
  company: number[]
}
export interface OutputJSON {
  lineNames: Array<string>
  stationNames: Array<string>
  lines: Array<Line>
  stations: Array<Station>
}
export enum Companies {
  JRH,
  JRE,
  JRC,
  JRW,
  JRS,
  JRQ
}