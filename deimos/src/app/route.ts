import { RouteState } from './module'
import { Line, Station } from './dataInterface'
import { data } from './data'
interface NextPops {
  stations: number[]
  lines: number[]
}
const nullNextPops: NextPops = {
  stations: [],
  lines: []
}
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
  constructor() {
    this.stations = []
    this.edges = []
    this.unroutableEdges = []
  }

  ngStations(lineId: number, stationId: number): number[] {
    // 路線(lineId)をstationId駅を起点として利用するときに，乗車済みでその路線で直接行けない駅はどれ?
    // stationIdsで返します．
    const stationIndex = data.lines[lineId].stationIds.indexOf(stationId)
    if (stationIndex === -1) {
      return []
    }
    return [...this.edges, ...this.unroutableEdges]
      .filter(e => e.line.id === lineId)
      .map(e => {
        if (stationIndex <= e.startIndex && stationIndex <= e.endIndex) {
          return e.line.stationIds.slice(Math.min(e.startIndex, e.endIndex))
        } else {
          return e.line.stationIds.slice(0, Math.max(e.startIndex, e.endIndex) + 1)
        }
      })
      .reduce((a, b) => a.concat(b), [])
  }

  pushEdge(edge: RouteEdge) {
    this.edges.push(edge)
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
          this.unroutableEdges.push({
            line: targetLine,
            startIndex: targetLine.stationIds.indexOf(startStationId),
            endIndex: targetLine.stationIds.indexOf(endStationId),
            start: data.stations[startStationId],
            end: data.stations[endStationId],
            direction: Direction.DOWN
          })
        }
      }
    }
    console.log(this)
  }
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
  rail.dupLineStationIds
    .filter(id => !ngStations.includes(id))
    .forEach(id => data.stations[id].lineIds.forEach(lineId => (lineTemp[lineId] = 1)))
  const lines = Object.keys(lineTemp).map(id => ~~id)
  return {
    stations: stations,
    lines: lines
  }
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

  const lines = station.lineIds

  const stations = Object.keys(stationTemp).map(id => ~~id)
  return {
    stations: stations,
    lines: lines
  }
}
const unique = function() {
  let seen = {}
  return function(element: number) {
    return !(element in seen) && (seen[element] = 1)
  }
}
export const textFunction = (
  state: RouteState,
  text: string,
  lastNodeType: RouteNodeType = RouteNodeType.DUPLICATED
): RouteState => {
  const words = text
    .replace(/^\s+/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')

  let next: NextPops = {
    stations: [2],
    lines: [2]
  }
  for (let i = 0, l = data.stations.length; i < l; ++i) {
    next.stations[i] = i
  }
  for (let i = 1, l = data.lines.length; i < l; ++i) {
    next.lines[i - 1] = i
  }

  let textRoute: TextRouteNode[] = [] // TextBoxのWord分割したもの　Wordに意味を与える
  let route: Route = new Route()
  let sourceStation: Station | null = null
  const specialSuffix = 'SsＳｓ駅LlＬｌ'
  let type: RouteNodeType | null = null
  for (let i = 0; i < words.length; ++i) {
    let word = words[i]
    if (word === '' || specialSuffix.indexOf(word) > -1) {
      break
    }
    const suffix = word.slice(-1) || ''
    if (specialSuffix.indexOf(suffix) > -1) {
      word = word.slice(0, -1)
    }

    const stationIndex = data.stationNames.indexOf(word)
    const lineIndex = data.lineNames.indexOf(word)
    const stationFlag = next.stations.includes(stationIndex)
    const lineFlag = next.lines.includes(lineIndex)

    type = stationFlag
      ? lineFlag ? RouteNodeType.DUPLICATED : RouteNodeType.STATION
      : lineFlag ? RouteNodeType.LINE : null

    if (type === RouteNodeType.DUPLICATED) {
      if (i === words.length - 1 && lastNodeType !== RouteNodeType.DUPLICATED) {
        type = lastNodeType
        if (lastNodeType === RouteNodeType.LINE) {
          words[i] += 'L'
        } else {
          words[i] += '駅'
        }
      } else {
        type =
          'SsＳｓ駅'.indexOf(suffix) > -1
            ? RouteNodeType.STATION
            : 'LlＬｌ'.indexOf(suffix) > -1 ? RouteNodeType.LINE : type
      }
    }
    if (sourceStation === null && type !== null) {
      if (textRoute.length === 0) {
        if (type === RouteNodeType.STATION) {
          sourceStation = data.stations[stationIndex]
        }
      } else {
        if (textRoute[0].type === RouteNodeType.LINE) {
          sourceStation = data.stations[stationIndex]
        } else if (type === RouteNodeType.STATION) {
          textRoute[0].type = RouteNodeType.LINE
          sourceStation = data.stations[stationIndex]
        } else if (type === RouteNodeType.LINE || type === RouteNodeType.DUPLICATED) {
          textRoute[0].type = RouteNodeType.STATION
          sourceStation = data.stations[textRoute[0].value.id] // route[0].value で取れるのにinterfaceが邪魔
        }
      }
      if (sourceStation !== null) {
        route.stations[0] = sourceStation
      }
    }
    if (type === RouteNodeType.STATION) {
      textRoute.push({
        type: RouteNodeType.STATION,
        value: data.stations[stationIndex],
        station: data.stations[stationIndex],
        line: null
      })
    } else if (type === RouteNodeType.LINE) {
      textRoute.push({
        type: RouteNodeType.LINE,
        value: data.lines[lineIndex],
        station: null,
        line: data.lines[lineIndex]
      })
    } else if (type === RouteNodeType.DUPLICATED) {
      textRoute.push({
        type: RouteNodeType.DUPLICATED,
        value: data.stations[stationIndex],
        station: data.stations[stationIndex],
        line: data.lines[lineIndex]
      })
    }
    // ☓DUPの判定処理を書く　DUPはめんどくさいので一旦滅ぼす

    if (type === RouteNodeType.STATION) {
      route.stations.push(data.stations[stationIndex])
      while (
        route.stations.length > 1 &&
        route.stations[route.stations.length - 1].id === route.stations[route.stations.length - 2].id
      ) {
        route.stations.pop()
      }
      // 駅　路線　駅
      // 駅　駅
      // 駅　路線　路線 ←未対応
      if (route.stations.length >= 2) {
        if (textRoute[textRoute.length - 2].type === RouteNodeType.LINE) {
          // 駅　路線　駅　となる場合
          // nextの現在のアルゴリズムに置いてその路線は直前の駅である保証がある
          const line = textRoute[textRoute.length - 2].line!
          const startStationId = route.stations[route.stations.length - 2].id
          const endStationId = route.stations[route.stations.length - 1].id
          const start = data.stations[startStationId]
          const end = data.stations[endStationId]
          const startLineStationId = line.stationIds.indexOf(startStationId)
          const endLineStationId = line.stationIds.indexOf(endStationId)
          const direction = startLineStationId > endLineStationId ? Direction.UP : Direction.DOWN
          route.pushEdge({
            line: line,
            start: start,
            end: end,
            startIndex: startLineStationId,
            endIndex: endLineStationId,
            direction: direction
          })
        } else if (textRoute[textRoute.length - 2].type === RouteNodeType.STATION) {
          // 駅　駅　となる場合
          const startStationId = route.stations[route.stations.length - 2].id
          const endStationId = route.stations[route.stations.length - 1].id
          const start = data.stations[startStationId]
          const end = data.stations[endStationId]
          const lines = start.lineIds.filter(id => end.lineIds.includes(id))
          const line: Line = data.lines[lines[0]]
          const startLineStationId = line.stationIds.indexOf(startStationId)
          const endLineStationId = line.stationIds.indexOf(endStationId)
          const direction = startLineStationId > endLineStationId ? Direction.UP : Direction.DOWN
          route.pushEdge({
            line: line,
            start: start,
            end: end,
            startIndex: startLineStationId,
            endIndex: endLineStationId,
            direction: direction
          })
        }
      }
    }
    if (type === RouteNodeType.STATION) {
      const nextpop = nextPopsStation(stationIndex, route)
      next.lines = nextpop.lines
      next.stations = nextpop.stations
    } else if (type === RouteNodeType.LINE) {
      const nextpop = nextPopsLine(lineIndex, route)
      next.lines = sourceStation !== null ? nextpop.lines : [] // srcが空の時、路線の次には駅がくるため
      next.stations = nextpop.stations
    } else if (type === RouteNodeType.DUPLICATED) {
      const nextFromStation = nextPopsStation(stationIndex, route)
      const nextFromLine = nextPopsLine(lineIndex, route)
      next.lines = nextFromStation.lines.concat(nextFromLine.lines).filter(unique())
      next.stations = nextFromStation.stations.concat(nextFromLine.stations).filter(unique())
    }
    if (stationFlag) {
      for (let ii = 0, j = next.stations.length; ii < j; ++ii) {
        if (next.stations[ii] === stationIndex) {
          next.stations.splice(ii, 1)
          break
        }
      }
    }
  }
  state.duplicatedKomaru = false
  for (let n of textRoute) {
    if (n.type === RouteNodeType.DUPLICATED) {
      state.duplicatedKomaru = true
      break
    }
  }
  if (type === null && words.length > 0) {
    const word = words[words.length - 1]
    const match = word.match(/^[\u3040-\u309F]+/)
    let prefix: RegExp
    if (match !== null) {
      prefix = new RegExp(`^${match[0]}`)
      state.completionLine = next.lines
        .filter(lineId => data.lines[lineId].kana.match(prefix) !== null)
        .map(lineId => data.lineNames[lineId])
      state.completionStation = next.stations
        .filter(staId => data.stations[staId].kana.match(prefix) !== null)
        .map(lineId => data.stationNames[lineId])
    } else {
      prefix = new RegExp(`^${word}`)
      state.completionLine = next.lines
        .filter(lineId => data.lines[lineId].name.match(prefix) !== null)
        .map(lineId => data.lineNames[lineId])
      state.completionStation = next.stations
        .filter(staId => data.stations[staId].name.match(prefix) !== null)
        .map(lineId => data.stationNames[lineId])
    }
    state.lastInputHalfway = true
  } else {
    state.completionLine = next.lines.map(lineId => data.lineNames[lineId])
    state.completionStation = next.stations.map(staId => data.stationNames[staId])
    state.lastInputHalfway = false
  }
  state.via = []
  for (let i = 0; i < route.edges.length; ++i) {
    state.via.push('路線:' + route.edges[i].line.name)
    state.via.push('駅:' + route.stations[i + 1].name)
  }
  state.source = sourceStation !== null ? sourceStation.name : ''
  state.destination = route.stations.length > 1 ? route.stations[route.stations.length - 1].name : ''
  state.route = route
  state.text = words.join(' ')
  return state
}
