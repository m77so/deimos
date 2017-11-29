import { Station, Line } from './dataInterface'
import { data } from './data'
import { pregQuote } from './util'
import { Route, RouteNodeType } from './route'
import shortestRoute from './shortestRoute'

class TextRouteNodeStation {
  textType: RouteNodeType.STATION
  nodeType: RouteNodeType.STATION
  station: Station
  nextFromStation: NextPops
  get value() {
    return this.station
  }
  constructor(station: Station, next: NextPops) {
    this.station = station
    this.nextFromStation = next
    this.textType = RouteNodeType.STATION
    this.nodeType = RouteNodeType.STATION
  }
}
class TextRouteNodeLine {
  textType: RouteNodeType.LINE
  nodeType: RouteNodeType.LINE
  line: Line
  nextFromLine: NextPops
  get value() {
    return this.line
  }
  constructor(line: Line, next: NextPops) {
    this.line = line
    this.nextFromLine = next
    this.textType = RouteNodeType.LINE
    this.nodeType = RouteNodeType.LINE
  }
}
class TextRouteNodeDuplicate {
  textType: RouteNodeType.DUPLICATED // テキストとして評価される時はDUP
  nodeType: RouteNodeType // その後の評価で駅か路線か判断不能か
  line: Line
  station: Station
  value: Station | Line
  nextFromStation: NextPops
  nextFromLine: NextPops
  constructor(station: Station, line: Line, nextFromStation: NextPops, nextFromLine: NextPops) {
    this.line = line
    this.station = station
    this.value = station
    this.nextFromLine = nextFromLine
    this.nextFromStation = nextFromStation
    this.textType = RouteNodeType.DUPLICATED
    this.nodeType = RouteNodeType.DUPLICATED
  }
}
class TextRouteNodeUnknown {
  textType: RouteNodeType.UNKNOWN
  nodeType: RouteNodeType.UNKNOWN
  text: string
  _nextFromStation: NextPops
  _nextFromLine: NextPops
  prefix: RegExp
  constructor(text: string) {
    this.text = text
    this.textType = RouteNodeType.UNKNOWN
    this.nodeType = RouteNodeType.UNKNOWN
    const match = this.text.match(/^[\u3040-\u309F]+/)
    this.prefix = match !== null ? new RegExp(`^${match[0]}`) : new RegExp(`^${pregQuote(this.text)}`)
  }
  setLastTextNode(lastTextRouteNode: TextRouteNode) {
    switch (lastTextRouteNode.nodeType) {
      case RouteNodeType.STATION:
        this.nextFromStation = lastTextRouteNode.nextFromStation
        break
      case RouteNodeType.LINE:
        this.nextFromLine = lastTextRouteNode.nextFromLine
        break
      case RouteNodeType.DUPLICATED:
        this.nextFromLine = lastTextRouteNode.nextFromLine
        this.nextFromStation = lastTextRouteNode.nextFromStation
        break
      default:
    }
  }
  set nextFromLine(next: NextPops) {
    this._nextFromLine = this.nextFilter(next)
  }
  set nextFromStation(next: NextPops) {
    this._nextFromStation = this.nextFilter(next)
  }
  get nextFromStation() {
    return this._nextFromStation
  }
  get nextFromLine() {
    return this._nextFromLine
  }
  nextFilter(next: NextPops): NextPops {
    next.lines = next.lines.filter(i => data.lines[i].kana.match(this.prefix) !== null)
    next.stations = next.stations.filter(i => data.stations[i].kana.match(this.prefix) !== null)
    return next
  }
}
export type TextRouteNode = TextRouteNodeDuplicate | TextRouteNodeLine | TextRouteNodeStation | TextRouteNodeUnknown
export interface NextPops {
  stations: number[]
  lines: number[]
}
const nullNextPops: NextPops = {
  stations: [],
  lines: []
}
const nextPopsLine = (lineIndex: number, route: Route): NextPops => {
  const rail = data.lines[lineIndex]
  if (rail === undefined) {
    return nullNextPops
  }
  const srcStation = route.stations[route.stations.length - 1]
  const ngStations = srcStation !== undefined ? route.ngStations(lineIndex, srcStation.id) : []
  const stations = rail.stationIds.filter(id => !ngStations.includes(id))
  let lineTemp: { [key: number]: number } = {}
  rail.dupLineStationIds.filter(id => !ngStations.includes(id)).forEach(id =>
    data.stations[id].lineIds.forEach(lineId => {
      lineTemp[lineId] = lineTemp[lineId] === undefined ? 1 : lineTemp[lineId] + 1
    })
  )
  
  const lines = Object.keys(lineTemp)
    .map(id => ~~id)
    .filter(id =>
      lineTemp[id] === 1 &&
      id !== lineIndex &&
      // 遷移先からまだ移動できること
      (srcStation === undefined || route.ngStations(id, srcStation.id).length < data.lines[id].stationIds.length)
    )
  return { stations: stations, lines: lines }
}
const nextPopsStation = (stationId: number, route: Route): NextPops => {
  let station = data.stations[stationId]
  if (station === undefined) {
    return nullNextPops
  }
  let stationTemp: { [key: number]: number[] } = {}
  station.lineIds.forEach(lineId => {
    const ngStations = route.ngStations(lineId, stationId)
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
    id => route.ngStations(id, station.id).length < data.lines[id].stationIds.length // 遷移先からまだ移動できること
  )
  const stations = Object.keys(stationTemp).map(id => ~~id)
  return {
    stations: stations,
    lines: lines
  }
}
interface DetectWordTypeInterface {
  lastNodeType: RouteNodeType | null
  type: RouteNodeType
  stationId: number
  lineId: number
}
const detectWordType = (
  word: string,
  nextFromStation: NextPops | null,
  nextFromLine: NextPops | null
): DetectWordTypeInterface => {
  const stationId = data.stationNames.indexOf(word)
  const lineId = data.lineNames.indexOf(word)
  let stationFlag = false
  let lineFlag = false
  let srcNodeType: RouteNodeType | null = null
  const nexts = [nextFromLine, nextFromStation]
  const types = [RouteNodeType.LINE, RouteNodeType.STATION]
  nexts.forEach((next, index) => {
    if (next !== null) {
      if (stationId !== -1 && next.stations.includes(stationId)) {
        stationFlag = true
        srcNodeType = srcNodeType === null ? types[index] : RouteNodeType.DUPLICATED
      }
      if (lineId !== -1 && next.lines.includes(lineId)) {
        lineFlag = true
        srcNodeType = srcNodeType === null || srcNodeType === types[index] ? types[index] : RouteNodeType.DUPLICATED
      }
    }
  })

  const suffix = word.slice(-1) || ''
  if (specialSuffix.indexOf(suffix) > -1) {
    word = word.slice(0, -1)
  }
  let type = stationFlag
    ? lineFlag ? RouteNodeType.DUPLICATED : RouteNodeType.STATION
    : lineFlag ? RouteNodeType.LINE : RouteNodeType.UNKNOWN
  if (type === RouteNodeType.DUPLICATED) {
    type =
      'SsＳｓ駅'.indexOf(suffix) > -1
        ? RouteNodeType.STATION
        : 'LlＬｌ'.indexOf(suffix) > -1 ? RouteNodeType.LINE : type
  }
  return { lastNodeType: srcNodeType, type: type, stationId: stationId, lineId: lineId }
}

const specialSuffix = 'SsＳｓ駅LlＬｌ'

export default function textFunction(
  text: string,
  initialRoute: Route = new Route(),
  finalNodeType: RouteNodeType = RouteNodeType.DUPLICATED
): Route {
  const words = text.replace(/\s+$/g, '').split(' ')
  let next: NextPops = {
    stations: [2],
    lines: [2]
  }
  // とりあえず
  if (words.length >= 3 && words[1] === '最短') {
    const startIndex = data.stationNames.indexOf(words[0])
    const endIndex = data.stationNames.indexOf(words[2])
    if (startIndex > -1 && endIndex > -1) {
      return shortestRoute(data.stations[startIndex], data.stations[endIndex])
    }
  }
  const route: Route = new Route()
  // nextの初期化　最初は全ての可能性がある
  for (let i = 0, l = data.stations.length; i < l; ++i) {
    next.stations[i] = i
  }
  for (let i = 1, l = data.lines.length; i < l; ++i) {
    next.lines[i - 1] = i
  }

  let textRoute: TextRouteNode[] = [] // TextBoxのWord分割したもの　Wordに意味を与える
  for (let i = 0; i < words.length; ++i) {
    let word = words[i]
    if (word === '' || specialSuffix.indexOf(word) > -1) {
      break
    }
    let lastNodeType: RouteNodeType | null = null
    let type: RouteNodeType = RouteNodeType.UNKNOWN
    let stationId: number = -1
    let lineId: number = -1
    if (i === 0) {
      ({ lastNodeType, type, stationId, lineId } = detectWordType(word, next, null))
    } else {
      const lastTextRouteNode = textRoute[i - 1]
      switch (lastTextRouteNode.textType) {
        case RouteNodeType.STATION:
          ({ lastNodeType, type, stationId, lineId } = detectWordType(word, lastTextRouteNode.nextFromStation, null))
          break
        case RouteNodeType.LINE:
          ({ lastNodeType, type, stationId, lineId } = detectWordType(word, null, lastTextRouteNode.nextFromLine))
          break
        case RouteNodeType.DUPLICATED:
          ({ lastNodeType, type, stationId, lineId } = detectWordType(
            word,
            lastTextRouteNode.nextFromStation,
            lastTextRouteNode.nextFromLine
          ))
          break
        default:
      }
      if (lastTextRouteNode.textType === RouteNodeType.DUPLICATED && lastNodeType !== null) {
        lastTextRouteNode.nodeType = lastNodeType
      }
    }
    if (type === RouteNodeType.UNKNOWN) {
      const unknown = new TextRouteNodeUnknown(word)
      if (i === 0) {
        unknown.nextFromStation = next
      } else {
        unknown.setLastTextNode(textRoute[i - 1])
      }
      textRoute.push(unknown)
      break
    }

    if (type === RouteNodeType.STATION) {
      textRoute.push(new TextRouteNodeStation(data.stations[stationId], nextPopsStation(stationId, route)))
    } else if (type === RouteNodeType.LINE) {
      textRoute.push(new TextRouteNodeLine(data.lines[lineId], nextPopsLine(lineId, route)))
    } else if (type === RouteNodeType.DUPLICATED) {
      textRoute.push(
        new TextRouteNodeDuplicate(
          data.stations[stationId],
          data.lines[lineId],
          nextPopsStation(stationId, route),
          nextPopsLine(lineId, route)
        )
      )
    }
    // DUPは処理をしない
    const textRouteNode = textRoute[i]
    if (textRouteNode.nodeType === RouteNodeType.STATION) {
      route.stations.push(data.stations[textRouteNode.station.id])
      while (
        route.stations.length > 1 &&
        route.stations[route.stations.length - 1].id === route.stations[route.stations.length - 2].id
      ) {
        route.stations.pop()
      }
      // 駅　路線　駅
      // 駅　駅
      if (route.stations.length >= 2) {
        const textRouteMinus1 = textRoute[i - 1]
        if (textRouteMinus1.nodeType === RouteNodeType.LINE) {
          // 駅　路線　駅　となる場合
          const line = textRouteMinus1.line
          const startStationId = route.stations[route.stations.length - 2].id
          const endStationId = route.stations[route.stations.length - 1].id
          route.pushEdge(startStationId, endStationId, line.id)
        } else if (textRouteMinus1.nodeType === RouteNodeType.STATION) {
          // 駅　駅　となる場合
          const startStationId = route.stations[route.stations.length - 2].id
          const endStationId = route.stations[route.stations.length - 1].id
          route.pushEdge(startStationId, endStationId)
        }
      }
    } else if (textRouteNode.nodeType === RouteNodeType.LINE && i >= 1) {
      const textRouteMinus1 = textRoute[i - 1]
      if (textRouteMinus1.nodeType === RouteNodeType.LINE) {
        // 駅　路線　路線
        const middleStationId = textRouteMinus1.nextFromLine.stations.filter(id =>
          data.stations[id].lineIds.includes(textRouteNode.line.id)
        )[0]
        route.stations.push(data.stations[middleStationId])
        const line = textRouteMinus1.line
        const startStationId = route.stations[route.stations.length - 2].id
        const endStationId = route.stations[route.stations.length - 1].id
        route.pushEdge(startStationId, endStationId, line.id)
      }
    }
  }

  return route
}
