import { RouteState } from './module'
import { Station } from './dataInterface'
import { data } from './data'
import { pregQuote } from './util'
import { Route, RouteNodeType, TextRouteNode } from './route'
import shortestRoute from './shortestRoute'
interface NextPops {
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
    .filter(
      id =>
        lineTemp[id] === 1 &&
        id !== lineIndex &&
        route.ngStations(id, srcStation.id).length < data.lines[id].stationIds.length // 遷移先からまだ移動できること
    )
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
  const lines = station.lineIds.filter(
    id => route.ngStations(id, station.id).length < data.lines[id].stationIds.length // 遷移先からまだ移動できること
  )
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
export default function textFunction(
  state: RouteState,
  text: string,
  lastNodeType: RouteNodeType = RouteNodeType.DUPLICATED
): RouteState {
  const words = text
    .replace(/^\s+/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')
  let next: NextPops = {
    stations: [2],
    lines: [2]
  }
  // とりあえず
  if (words.length >= 3 && words[1] === '最短') {
    const startIndex = data.stationNames.indexOf(words[0])
    const endIndex = data.stationNames.indexOf(words[2])
    if (startIndex > -1 && endIndex > -1) {
      state.text = text
      state.route = shortestRoute(data.stations[startIndex], data.stations[endIndex])
      state.completionLine = []
      state.completionStation = []
      return state
    }
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

    const stationId = data.stationNames.indexOf(word)
    const lineId = data.lineNames.indexOf(word)
    const stationFlag = next.stations.includes(stationId)
    const lineFlag = next.lines.includes(lineId)

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
          sourceStation = data.stations[stationId]
        }
      } else {
        if (textRoute[0].type === RouteNodeType.LINE) {
          sourceStation = data.stations[stationId]
        } else if (type === RouteNodeType.STATION) {
          textRoute[0].type = RouteNodeType.LINE
          sourceStation = data.stations[stationId]
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
        value: data.stations[stationId],
        station: data.stations[stationId],
        line: null
      })
    } else if (type === RouteNodeType.LINE) {
      textRoute.push({
        type: RouteNodeType.LINE,
        value: data.lines[lineId],
        station: null,
        line: data.lines[lineId]
      })
    } else if (type === RouteNodeType.DUPLICATED) {
      textRoute.push({
        type: RouteNodeType.DUPLICATED,
        value: data.stations[stationId],
        station: data.stations[stationId],
        line: data.lines[lineId]
      })
    }
    // ☓DUPの判定処理を書く　DUPはめんどくさいので一旦滅ぼす

    if (type === RouteNodeType.STATION) {
      route.stations.push(data.stations[stationId])
      while (
        route.stations.length > 1 &&
        route.stations[route.stations.length - 1].id === route.stations[route.stations.length - 2].id
      ) {
        route.stations.pop()
      }
      // 駅　路線　駅
      // 駅　駅
      if (route.stations.length >= 2) {
        if (textRoute[textRoute.length - 2].type === RouteNodeType.LINE) {
          // 駅　路線　駅　となる場合
          // nextの現在のアルゴリズムに置いてその路線は直前の駅である保証がある
          const line = textRoute[textRoute.length - 2].line!
          const startStationId = route.stations[route.stations.length - 2].id
          const endStationId = route.stations[route.stations.length - 1].id
          route.pushEdge(startStationId, endStationId, line.id)
        } else if (textRoute[textRoute.length - 2].type === RouteNodeType.STATION) {
          // 駅　駅　となる場合
          const startStationId = route.stations[route.stations.length - 2].id
          const endStationId = route.stations[route.stations.length - 1].id
          route.pushEdge(startStationId, endStationId)
        }
      }
    } else if (type === RouteNodeType.LINE) {
      if (textRoute[textRoute.length - 2].type === RouteNodeType.LINE) {
        // 駅　路線　路線
        const middleStations = next.stations.filter(id => data.stations[id].lineIds.includes(lineId))
        const middleStationId = middleStations[0]
        route.stations.push(data.stations[middleStationId])
        const line = textRoute[textRoute.length - 2].line!
        const startStationId = route.stations[route.stations.length - 2].id
        const endStationId = route.stations[route.stations.length - 1].id
        route.pushEdge(startStationId, endStationId, line.id)
      }
    }
    if (type === RouteNodeType.STATION) {
      const nextpop = nextPopsStation(stationId, route)
      next.lines = nextpop.lines
      next.stations = nextpop.stations
    } else if (type === RouteNodeType.LINE) {
      const nextpop = nextPopsLine(lineId, route)
      next.lines = sourceStation !== null ? nextpop.lines : [] // srcが空の時、路線の次には駅がくるため
      next.stations = nextpop.stations
    } else if (type === RouteNodeType.DUPLICATED) {
      const nextFromStation = nextPopsStation(stationId, route)
      const nextFromLine = nextPopsLine(lineId, route)
      next.lines = nextFromStation.lines.concat(nextFromLine.lines).filter(unique())
      next.stations = nextFromStation.stations.concat(nextFromLine.stations).filter(unique())
    }
    if (stationFlag) {
      for (let ii = 0, j = next.stations.length; ii < j; ++ii) {
        if (next.stations[ii] === stationId) {
          next.stations.splice(ii, 1)
          break
        }
      }
    }
  }
  state.duplicatedKomaru = []
  for (let n of textRoute) {
    if (n.type === RouteNodeType.DUPLICATED) {
      state.duplicatedKomaru.push(n.value.name)
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
      prefix = new RegExp(`^${pregQuote(word)}`)
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
  state.source = sourceStation !== null ? sourceStation.name : ''
  state.destination = route.stations.length > 1 ? route.stations[route.stations.length - 1].name : ''
  state.route = route
  state.text = words.join(' ')
  return state
}
