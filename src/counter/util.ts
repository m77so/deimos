import { RouteState } from './module'
import { data, Line, Station } from './data'
interface NextPops {
  stations: string[]
  lines: string[]
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
}
enum Direction {
  UP,
  DOWN
}
interface RouteEdge {
  line: Line
  direction: Direction
  startKm: number
  endKm: number
  start: Station
  end: Station
}
interface Route {
  stations: Station[]
  edges: RouteEdge[]
}
const nextPopsLine = (lineIndex: number): NextPops => {
  const rail = data.lines[lineIndex]
  if (rail === undefined) {
    return nullNextPops
  }

  const stations = rail.stations
  let lineTemp = {}
  rail.dupLineStationIds.forEach(id => data.stations[id].lineIds.forEach(lineId => (lineTemp[lineId] = 1)))
  const lines = Object.keys(lineTemp).map(lineId => data.lineNames[+lineId])
  return {
    stations: stations,
    lines: lines
  }
}
const nextPopsStation = (stationIndex: number): NextPops => {
  const station = data.stations[stationIndex]
  if (station === undefined) {
    return nullNextPops
  }
  const lines = station.lineIds.map(id => data.lineNames[id])
  let stationTemp = {}
  station.lineIds.forEach(id =>
    data.lines[id].stations.forEach(st => {
      stationTemp[st] = 1
    })
  )
  const stations = Object.keys(stationTemp)
  return {
    stations: stations,
    lines: lines
  }
}
const unique = function() {
  let seen = {}
  return function(element: string) {
    return !(element in seen) && (seen[element] = 1)
  }
}

export const textFunction = (state: RouteState, text: string): RouteState => {
  const words = text
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')
  let next: NextPops = {
    stations: data.stationNames,
    lines: data.lineNames
  }

  let textRoute: TextRouteNode[] = []
  let route: Route = {
    stations: [],
    edges: []
  }
  let sourceStation: Station | null = null
  for (let i = 0; i < words.length; ++i) {
    let word = words[i]
    const suffix = word.slice(-1) || ''
    if ('SsＳｓLlＬｌ'.indexOf(suffix) > -1) {
      word = word.slice(0, -1)
    }
    const stationFlag = next.stations.includes(word)
    const lineFlag = next.lines.includes(word)
    const stationIndex = stationFlag ? data.stationNames.indexOf(word) : -1
    const lineIndex = lineFlag ? data.lineNames.indexOf(word) : -1
    let type: RouteNodeType | null = stationFlag
      ? lineFlag ? RouteNodeType.DUPLICATED : RouteNodeType.STATION
      : lineFlag ? RouteNodeType.LINE : null
    if (type === RouteNodeType.DUPLICATED) {
      type =
        'SsＳｓ'.indexOf(suffix) > -1 ? RouteNodeType.STATION : 'LlＬｌ'.indexOf(suffix) > -1 ? RouteNodeType.LINE : type
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
    if ((stationFlag || lineFlag) && !(stationFlag && lineFlag)) {
      textRoute.push({
        type: stationFlag ? RouteNodeType.STATION : RouteNodeType.LINE,
        value: stationFlag ? data.stations[stationIndex] : data.lines[lineIndex]
      })
    } else if (stationFlag && lineFlag) {
      textRoute.push({
        type: RouteNodeType.DUPLICATED,
        value: data.stations[stationIndex]
      })
    }
    if (stationFlag || lineFlag) {
      const nextFromStation = nextPopsStation(stationIndex)
      const nextFromLine = nextPopsLine(lineIndex)
      next.lines =
        sourceStation === null || type === RouteNodeType.DUPLICATED
          ? nextFromStation.lines.concat(nextFromLine.lines).filter(unique())
          : []
      next.stations = nextFromStation.stations.concat(nextFromLine.stations).filter(unique())
    }
    if (stationFlag) {
      for (let ii = 0, j = next.stations.length, k = data.stationNames[stationIndex]; ii < j; ++ii) {
        if (next.stations[ii] === k) {
          next.stations.splice(ii, 1)
          break
        }
      }
    }
  }
  state.completionLine = next.lines
  state.completionStation = next.stations
  state.via = textRoute.map(e => e.value.name)
  state.source = sourceStation !== null ? sourceStation.name : ''
  state.text = text
  return state
}
