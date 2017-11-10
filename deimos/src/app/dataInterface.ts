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
  company: string[]
}
export interface Station {
  id: number
  name: string
  kana: string
  lineIds: Array<number>
  company: string[]
}
export interface OutputJSON {
  lineNames: Array<string>
  stationNames: Array<string>
  lines: Array<Line>
  stations: Array<Station>
}