import { Line, Station } from './dataInterface'
import { data } from './data'
import NextPops from './NextPops'
enum Direction {
  UP, // 上りを表す　キロ数が減る
  DOWN
}

export default class RouteEdge {
  line: Line
  startIndex: number
  endIndex: number
  start: Station
  end: Station
  next: NextPops
  get direction(): Direction {
    return this.startIndex > this.endIndex ? Direction.UP : Direction.DOWN
  }
  constructor() {
    this.next = { lines: [], stations: [] }
  }
  fromStationId(startStationId: number, endStationId: number, lineId: number = -1): RouteEdge {
    this.start = data.stations[startStationId]
    this.end = data.stations[endStationId]
    lineId = lineId === -1 ? this.start.lineIds.filter(id => this.end.lineIds.includes(id))[0] : lineId
    this.line = data.lines[lineId]
    this.startIndex = this.line.stationIds.indexOf(startStationId)
    this.endIndex = this.line.stationIds.indexOf(endStationId)
    return this
  }
  fromLineIndex(startStationIndex: number, endStationIndex: number, lineId: number): RouteEdge {
    this.startIndex = startStationIndex
    this.endIndex = endStationIndex
    this.line = data.lines[lineId]
    this.start = data.stations[this.line.stationIds[this.startIndex]]
    this.end = data.stations[this.line.stationIds[this.endIndex]]
    return this
  }
}