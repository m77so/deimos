import * as fs from 'fs'
import * as iconv from 'iconv-lite'
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
}
export interface Station {
  id: number
  name: string
  kana: string
  lineIds: Array<number>
}
export interface OutputJSON {
  lineNames: Array<string>
  stationNames: Array<string>
  lines: Array<Line>
  stations: Array<Station>
}
const output: OutputJSON = {
  lineNames: [],
  stationNames: [],
  lines: [],
  stations: []
}
const dataSD = fs.readFileSync('./resource/mars_sd.dat')

const recordsNumSD = dataSD.length / 28
for (let r = 0; r < recordsNumSD; ++r) {
  const offset = 28 * r
  let cur = offset
  let record: Array<any> = []
  record.push(dataSD.readUInt8(cur++))
  record.push(dataSD.readInt16LE(cur++))
  cur++
  record.push(dataSD.readUInt8(cur++))
  record.push(
    iconv.decode(dataSD.slice(cur, cur + 14), 'cp932').replace(/ /g, '')
  )
  cur += 15
  record.push(
    iconv.decode(dataSD.slice(cur, cur + 9), 'cp932').replace(/ /g, '')
  )
  if (!output.lines[record[0]]) {
    output.lines[record[0]] = {
      id: record[0],
      name: record[3],
      kana: record[4],
      src: '',
      dest: '',
      stations: [],
      stationIds: [],
      kms: [],
      akms: [],
      dupLineStationIds: [],
      chiho: false
    }
    output.lineNames[record[0]] = record[3]
  } else if (record[0] > 0) {
    if (output.stationNames.includes(record[3])) {
      const id = output.stationNames.indexOf(record[3])
      output.stations[id].lineIds.push(record[0])
      const lineIds = output.stations[id].lineIds
      for (let lineId of lineIds) {
        if (!output.lines[lineId].dupLineStationIds.includes(id)) {
          output.lines[lineId].dupLineStationIds.push(id)
        }
      }
    } else {
      const nextId = output.stations.length
      output.stations.push({
        id: nextId,
        name: record[3],
        kana: record[4],
        lineIds: [record[0]]
      })
      output.stationNames.push(record[3])
    }
    const line = output.lines[record[0]]
    const stationId = output.stationNames.indexOf(record[3])
    line.stations.push(record[3])
    line.kms.push(record[1])
    line.stationIds.push(stationId)
  }
}

const dataNN = fs.readFileSync('./resource/mars_nn.dat')
const recordsNum = dataNN.length / 8
let datann = []

for (let r = 0; r < recordsNum; ++r) {
  const offset = 8 * r
  let cur = offset
  let record: Array<any> = []
  record.push(dataNN.readInt16LE(cur))
  cur += 2
  record.push(dataNN.readInt16LE(cur))
  cur += 2
  record.push(dataNN.readInt16LE(cur))
  cur += 2
  record.push(dataNN.readInt16LE(cur))
  const id = output.lines[record[0]].kms.indexOf(record[1])
  output.lines[record[0]].akms[id] = record[2]
}
for (let line of output.lines) {
  const index = [...Array(line.stations.length).keys()].sort(
    (a, b) => line.kms[a] - line.kms[b]
  )
  const kms = index.map(i => line.kms[i])
  const stations = index.map(i => line.stations[i]) || ['']
  const stationIds = index.map(i => line.stationIds[i]) || [-1]
  const akms = index.map(i => line.akms[i] || 0)
  line.kms = kms
  line.stations = stations
  line.stationIds = stationIds
  line.akms = akms
  line.src = stations[0]
  line.dest = stations[stations.length - 1]
}
output.lines[0] = {
  id: 0,
  name: '',
  kana: '',
  stations: [''],
  stationIds: [-1],
  kms: [0],
  akms: [0],
  dupLineStationIds: [-1],
  src: '',
  dest: '',
  chiho: false
}
const chihoLines = fs
  .readFileSync('./resource/chihoLines.txt', 'utf-8')
  .split('\n')
chihoLines.forEach(chihoLine => {
  output.lines.forEach(line => {
    if (line.name.includes(chihoLine)) {
      line.chiho = true
    }
  })
})
console.log(
  `import {OutputJSON} from './dataInterface'
export const data:OutputJSON = ${JSON.stringify(output, null, '  ')}`
)
