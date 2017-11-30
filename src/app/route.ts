import { Line, Station } from './dataInterface'
import { data } from './data'
import textFunction, { TextRouteNode, TextRouteNodeLine, TextRouteNodeStation } from './textFunction'
import NextPops from './NextPops'
export enum RouteNodeType {
  STATION,
  LINE,
  DUPLICATED,
  UNKNOWN
}
enum Direction {
  UP, // 上りを表す　キロ数が減る
  DOWN
}
export class RouteEdge {
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
interface GetCompletionInterface {
  line: string[]
  station: string[]
}

export class Route {
  stations: Station[]
  edges: RouteEdge[]
  unroutableEdges: RouteEdge[]
  routedStations: { [key: number]: number } // stationId をKeyとしてもつ　6の字，9の字用
  textRoute: TextRouteNode[]

  constructor(text: string = '', lastNodeType: RouteNodeType = RouteNodeType.DUPLICATED) {
    this.stations = []
    this.edges = []
    this.unroutableEdges = []
    this.routedStations = {}
    this.textRoute = []
    if (text !== '') {
      this.ttFunction(text, lastNodeType)
    }
  }
  ttFunction(text: string = '', lastNodeType: RouteNodeType = RouteNodeType.DUPLICATED) {
    const res = textFunction(text, this, lastNodeType)
    this.edges = res.edges
    this.stations = res.stations
    this.textRoute = res.textRoute
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
    const edge = new RouteEdge().fromStationId(startStationId, endStationId, lineId)
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
          const unroutableEdge: RouteEdge = new RouteEdge().fromLineIndex(startIndex, endIndex, zairai.targetLine)
          unroutableEdge.line.stationIds.slice(edgeMinIndex, edgeMaxIndex + 1).forEach(stationId => {
            this.routedStations[stationId] = 1
          })
          this.unroutableEdges.push(unroutableEdge)
        }
      }
    }
  }
  getCompletion(): GetCompletionInterface {
    if (this.textRoute.length === 0) {
      return {
        station: data.stationNames,
        line: data.lineNames
      }
    }
    const textRouteLastNode = this.textRoute[this.textRoute.length - 1]
    const merge = (a: number[], b: number[]) => {
      let temp = {}
      for (let i of [...a, ...b]) {
        temp[i] = 1
      }
      return Object.keys(temp).map(v => ~~v)
    }

    let completionStation: string[] = []
    let completionLines: string[] = []

    if (
      textRouteLastNode.nodeType === RouteNodeType.DUPLICATED ||
      textRouteLastNode.nodeType === RouteNodeType.UNKNOWN
    ) {
      completionLines = merge(textRouteLastNode.nextFromLine.lines, textRouteLastNode.nextFromStation.lines).map(
        id => data.lineNames[id]
      )
      completionStation = merge(
        textRouteLastNode.nextFromLine.stations,
        textRouteLastNode.nextFromStation.stations
      ).map(id => data.stationNames[id])
    } else if (textRouteLastNode.nodeType === RouteNodeType.LINE) {
      completionLines = textRouteLastNode.nextFromLine.lines.map(id => data.lineNames[id])
      completionStation = textRouteLastNode.nextFromLine.stations.map(id => data.stationNames[id])
    } else if (textRouteLastNode.nodeType === RouteNodeType.STATION) {
      completionLines = textRouteLastNode.nextFromStation.lines.map(id => data.lineNames[id])
      completionStation = textRouteLastNode.nextFromStation.stations.map(id => data.stationNames[id])
    }
    return {
      station: completionStation,
      line: completionLines
    }
  }
  nextPopsLine(lineIndex: number): NextPops {
    const rail = data.lines[lineIndex]
    if (rail === undefined) {
      return new NextPops()
    }
    const srcStation = this.stations[this.stations.length - 1]
    const ngStations = srcStation !== undefined ? this.ngStations(lineIndex, srcStation.id) : []
    const stations = rail.stationIds.filter(id => !ngStations.includes(id))
    let lineTemp: { [key: number]: number } = {}
    rail.dupLineStationIds.filter(id => !ngStations.includes(id)).forEach(id =>
      data.stations[id].lineIds.forEach(lineId => {
        lineTemp[lineId] = lineTemp[lineId] === undefined ? 1 : lineTemp[lineId] + 1
      })
    )

    const lines = Object.keys(lineTemp)
      .map(id => ~~id)
      .filter(
        id =>
          lineTemp[id] === 1 &&
          id !== lineIndex &&
          // 遷移先からまだ移動できること
          (srcStation === undefined || this.ngStations(id, srcStation.id).length < data.lines[id].stationIds.length)
      )
    return new NextPops(stations, lines)
  }

  nextPopsStation = (stationId: number): NextPops => {
    let station = data.stations[stationId]
    if (station === undefined) {
      return new NextPops()
    }
    let stationTemp: { [key: number]: number[] } = {}
    station.lineIds.forEach(lineId => {
      const ngStations = this.ngStations(lineId, stationId)
      data.lines[lineId].stationIds.forEach(st => {
        if (ngStations.includes(st)) {
          return
        }
        if (stationTemp[st] === undefined) {
          stationTemp[st] = []
        }
        stationTemp[st].push(lineId)
      })
    })
    const lines = station.lineIds.filter(
      id => this.ngStations(id, station.id).length < data.lines[id].stationIds.length // 遷移先からまだ移動できること
    )
    const stations = Object.keys(stationTemp).map(id => ~~id)
    return {
      stations: stations,
      lines: lines
    }
  }
  next(lineFlag: boolean, text: string) {
    // update textRoute
    let lastTextRoute = this.textRoute[this.textRoute.length - 1]
    if (this.textRoute.length > 0 && lastTextRoute.nodeType === RouteNodeType.UNKNOWN) {
      this.textRoute.splice(-1, 1)
    }
    if (lineFlag) {
      const lineId = data.lineNames.indexOf(text)
      this.textRoute.push(new TextRouteNodeLine(data.lines[lineId], this.nextPopsLine(lineId)))
    } else {
      const stationId = data.stationNames.indexOf(text)
      this.textRoute.push(new TextRouteNodeStation(data.stations[stationId]))
    }
    // update Edge
    const textRouteNode = this.textRoute[this.textRoute.length - 1]
    console.log(textRouteNode)
    if (textRouteNode.nodeType === RouteNodeType.STATION) {
      this.stations.push(data.stations[textRouteNode.station.id])
      // 駅　路線　駅
      // 駅　駅
      if (this.stations.length >= 2) {
        const textRouteMinus1 = this.textRoute[this.textRoute.length - 2]
        if (textRouteMinus1.nodeType === RouteNodeType.LINE) {
          // 駅　路線　駅　となる場合
          const line = textRouteMinus1.line
          const startStationId = this.stations[this.stations.length - 2].id
          const endStationId = this.stations[this.stations.length - 1].id
          this.pushEdge(startStationId, endStationId, line.id)
        } else if (textRouteMinus1.nodeType === RouteNodeType.STATION) {
          // 駅　駅　となる場合
          const startStationId = this.stations[this.stations.length - 2].id
          const endStationId = this.stations[this.stations.length - 1].id
          this.pushEdge(startStationId, endStationId)
        }
      }
    } else if (textRouteNode.nodeType === RouteNodeType.LINE && this.stations.length >= 2) {
      const textRouteMinus1 = this.textRoute[this.stations.length - 1]
      if (textRouteMinus1.nodeType === RouteNodeType.LINE) {
        // 駅　路線　路線
        const middleStationId = textRouteMinus1.nextFromLine.stations.filter(id =>
          data.stations[id].lineIds.includes(textRouteNode.line.id)
        )[0]
        this.stations.push(data.stations[middleStationId])
        const line = textRouteMinus1.line
        const startStationId = this.stations[this.stations.length - 2].id
        const endStationId = this.stations[this.stations.length - 1].id
        this.pushEdge(startStationId, endStationId, line.id)
      }
    }
    // 次候補　駅はEdge生成後にNG判定を行う
    if (textRouteNode.nodeType === RouteNodeType.STATION) {
      textRouteNode.nextFromStation = this.nextPopsStation(textRouteNode.station.id)
    }
  }

  generateText(text: string): string {
    return this.textRoute
      .map(n => {
        if (n.nodeType === RouteNodeType.LINE) {
          return n.value.name + '線'
        } else if (n.nodeType === RouteNodeType.STATION) {
          return n.value.name + '駅'
        }
        return ''
      })
      .join(' ')
  }
}
