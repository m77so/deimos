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
export interface RouteNode {
  type: RouteNodeType
  value: Line | Station
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
interface TextFunctionResponse {
  route: RouteNode[]
  next: NextPops
}
export const textFunction = (state: RouteState, text: string): TextFunctionResponse => {
  const words = text
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')
  let next: NextPops = {
    stations: data.stationNames,
    lines: data.lineNames
  }

  let route: RouteNode[] = []
  let sourceStation: Station | null = null
  for (let i = 0; i < words.length; ++i) {
    const word = words[i]
    const stationFlag = next.stations.includes(word)
    const lineFlag = next.lines.includes(word)
    const stationIndex = stationFlag ? data.stationNames.indexOf(word) : -1
    const lineIndex = lineFlag ? data.lineNames.indexOf(words[i]) : -1
    const type: RouteNodeType | null = stationFlag
      ? lineFlag ? RouteNodeType.DUPLICATED : RouteNodeType.STATION
      : lineFlag ? RouteNodeType.LINE : null
    if (sourceStation === null) {
      if (route.length === 0) {
        if (type === RouteNodeType.LINE) {
          sourceStation = data.stations[stationIndex]
        }
      } else {
        if (route[0].type === RouteNodeType.LINE) {
          sourceStation = data.stations[stationIndex]
        } else if (type === RouteNodeType.STATION) {
          route[0].type = RouteNodeType.LINE
          sourceStation = data.stations[stationIndex]
        } else if (type === RouteNodeType.LINE) {
          route[0].type = RouteNodeType.STATION
          sourceStation = data.stations[route[0].value.id] // route[0].value で取れるのにinterfaceが邪魔
        }
      }
    }
    if ((stationFlag || lineFlag) && !(stationFlag && lineFlag)) {
      route.push({
        type: stationFlag ? RouteNodeType.STATION : RouteNodeType.LINE,
        value: stationFlag ? data.stations[stationIndex] : data.lines[lineIndex]
      })
    } else if (stationFlag && lineFlag) {
      route.push({
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

  return { next: next, route: route }
}
