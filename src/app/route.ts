import { Line, Station } from './dataInterface'
import { data } from './data'
export enum RouteNodeType {
  STATION,
  LINE,
  DUPLICATED
}
export interface TextRouteNode {
  type: RouteNodeType
  value: Line | Station
  line: Line | null
  station: Station | null
}
enum Direction {
  UP, // 上りを表す　キロ数が減る
  DOWN
}
export interface RouteEdge {
  line: Line
  direction: Direction
  startIndex: number
  endIndex: number
  start: Station
  end: Station
}
export class Route {
  stations: Station[]
  edges: RouteEdge[]
  unroutableEdges: RouteEdge[]
  routedStations: { [key: number]: number } // stationId をKeyとしてもつ　6の字，9の字用
  constructor(text: string = '') {
    this.stations = []
    this.edges = []
    this.unroutableEdges = []
    this.routedStations = {}
    if (text !== '') {
      console.error('hoge')
      // textFunction(text)
    }
  }

  ngStations(lineId: number, stationId: number): number[] {
    // 路線(lineId)をstationId駅を起点として利用するときに，乗車済みでその路線で直接行けない駅はどれ?
    // stationIdsで返します．
    const stationIndex = data.lines[lineId].stationIds.indexOf(stationId)
    if (stationIndex === -1) {
      return []
    }
    const line = data.lines[lineId]
    let ngStationIds: number[] = [stationId]
    // 一度来たことのある駅からこれ以上移動はできない
    if (this.routedStations[stationId] === 2) {
      return line.stationIds
    }
    // 他の路線で訪れたことのある駅以遠を行けなくする
    for (let i = stationIndex - 1; i >= 0; --i) {
      const checkStationId = line.stationIds[i]
      if (this.routedStations[checkStationId] > 0) {
        ngStationIds = ngStationIds.concat(line.stationIds.slice(0, i))
        break
      }
    }
    for (let i = stationIndex + 1; i < line.stationIds.length; ++i) {
      const checkStationId = line.stationIds[i]
      if (this.routedStations[checkStationId] > 0) {
        ngStationIds = ngStationIds.concat(line.stationIds.slice(i + 1))
        break
      }
    }
    // 自路線で乗車済みの辺の処理
    return [...this.edges, ...this.unroutableEdges]
      .filter(e => e.line.id === lineId)
      .map(e => {
        if (stationIndex <= e.startIndex && stationIndex <= e.endIndex) {
          // 起点≦エッジ端ーーエッジ端　な時
          return e.line.stationIds.slice(Math.min(e.startIndex, e.endIndex) + 1)
        } else if (stationIndex >= e.startIndex && stationIndex >= e.endIndex) {
          // エッジ端ーーエッジ端≦起点　な時
          return e.line.stationIds.slice(0, Math.max(e.startIndex, e.endIndex))
        } else {
          // エッジ端ー起点ーエッジ端　な時
          return e.line.stationIds
        }
      })
      .reduce((a, b) => a.concat(b), ngStationIds)
  }
  pushEdge(startStationId: number, endStationId: number, lineId: number = -1) {
    const start = data.stations[startStationId]
    const end = data.stations[endStationId]
    const lines = lineId === -1 ? start.lineIds.filter(id => end.lineIds.includes(id))[0] : lineId
    const line: Line = data.lines[lines]
    const startLineStationId = line.stationIds.indexOf(startStationId)
    const endLineStationId = line.stationIds.indexOf(endStationId)
    const direction = startLineStationId > endLineStationId ? Direction.UP : Direction.DOWN
    this._pushEdge({
      line: line,
      start: start,
      end: end,
      startIndex: startLineStationId,
      endIndex: endLineStationId,
      direction: direction
    })
  }
  private _pushEdge(edge: RouteEdge) {
    this.edges.push(edge)
    const edgeMinIndex = Math.min(edge.startIndex, edge.endIndex)
    const edgeMaxIndex = Math.max(edge.startIndex, edge.endIndex)
    edge.line.stationIds.slice(edgeMinIndex, edgeMaxIndex + 1).forEach(stationId => {
      this.routedStations[stationId] = this.routedStations[stationId] === undefined ? 1 : 2
    })
    if (edge.line.mapZairai.length > 0) {
      const edgeStartIndex = Math.min(edge.startIndex, edge.endIndex)
      const edgeEndIndex = Math.max(edge.startIndex, edge.endIndex)
      for (let zairai of edge.line.mapZairai) {
        if (edgeStartIndex < zairai.endIndex && edgeEndIndex > zairai.startIndex) {
          const startIndex = Math.max(edgeStartIndex, zairai.startIndex)
          const endIndex = Math.min(edgeEndIndex, zairai.endIndex)
          const startStationId = edge.line.stationIds[startIndex]
          const endStationId = edge.line.stationIds[endIndex]
          const targetLine = data.lines[zairai.targetLine]
          const unroutableEdge: RouteEdge = {
            line: targetLine,
            startIndex: targetLine.stationIds.indexOf(startStationId),
            endIndex: targetLine.stationIds.indexOf(endStationId),
            start: data.stations[startStationId],
            end: data.stations[endStationId],
            direction: Direction.DOWN
          }
          unroutableEdge.line.stationIds.slice(edgeMinIndex, edgeMaxIndex + 1).forEach(stationId => {
            this.routedStations[stationId] = 1
          })
          this.unroutableEdges.push(unroutableEdge)
        }
      }
    }
  }
}
