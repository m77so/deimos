import { RouteState } from './module'
import { Line, Station } from './dataInterface'
import { data } from './data'
import { pregQuote } from './util'
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
  routedStations: { [key: number]: number } // stationId をKeyとしてもつ　6の字，9の字用
  constructor() {
    this.stations = []
    this.edges = []
    this.unroutableEdges = []
    this.routedStations = {}
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
      if (lineTemp[lineId] === undefined) {
        lineTemp[lineId] = 1
      } else {
        lineTemp[lineId] += 1
      }
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
/*
* 最安経路を導出する
* 大都市近郊区間用
*/
export const shortestRoute = (start: Station, end: Station): Route => {
  const distList: { [key: number]: number } = {} // 距離リスト
  const stationSrcList: { [key: number]: number } = {} // その駅がどこから来たか
  const lineSrcList: { [key: number]: number } = {} // その駅がどの路線で来たか
  distList[start.id] = 0
  stationSrcList[start.id] = -1
  lineSrcList[start.id] = -1
  const sortedListByDistStationIds: number[] = [start.id]
  let resRoute: Route = new Route()
  for (
    let sortedListByDistStationIdsIndex = 0;
    sortedListByDistStationIds[sortedListByDistStationIdsIndex] !== end.id ;
    ++sortedListByDistStationIdsIndex
  ) {
    const srcStation = data.stations[sortedListByDistStationIds[sortedListByDistStationIdsIndex]]
    srcStation.lineIds.forEach(lineId => {
      const line = data.lines[lineId]
      const checkStationsLineIndexes: number[] = []
      const srcStationLineIndex = line.stationIds.indexOf(srcStation.id)
      // 複数路線もつ駅かendの駅しかnodeにならない
      const nodeStationLineIndexes = line.dupLineStationIds.map(id => line.stationIds.indexOf(id))
      if (end.lineIds.includes(lineId)) {
        nodeStationLineIndexes.push(line.stationIds.indexOf(end.id))
      }
      let smallerIndex = -1
      let largerIndex = 99999
      for (let index of nodeStationLineIndexes) {
        if (index < srcStationLineIndex) {
          smallerIndex = Math.max(index, smallerIndex)
        } else if (index > srcStationLineIndex) {
          largerIndex = Math.min(index, largerIndex)
        }
      }
      if (largerIndex < 9999) {
        checkStationsLineIndexes.push(largerIndex)
      }
      if (smallerIndex > -1) {
        checkStationsLineIndexes.push(smallerIndex)
      }
      for (let index of checkStationsLineIndexes) {
        let km = distList[srcStation.id]
        const checkStationId = line.stationIds[index]
        if (line.chiho) {
          km += Math.abs(line.akms[index] - line.akms[srcStationLineIndex])
        } else {
          km += Math.abs(line.kms[index] - line.kms[srcStationLineIndex])
        }
        if (distList[checkStationId] === undefined || distList[checkStationId] > km) {
          distList[checkStationId] = km
          stationSrcList[checkStationId] = srcStation.id
          lineSrcList[checkStationId] = lineId
          // 以下は
          // distSortedArray.push(checkStationId).sort((a,b)=>distList[a]-distList[b])
          // と等価だが挿入ソートでO(n)
          let i = sortedListByDistStationIdsIndex
          while (distList[sortedListByDistStationIds[i]] < km && ++i < sortedListByDistStationIds.length) {
            continue
          }
          sortedListByDistStationIds.splice(i, 0, checkStationId)
        }
      }
    })
  }
  let walkbackId = end.id
  const resStartStationIds = []
  const resEndStationIds = []
  const resLines = []
  while (walkbackId !== start.id) {
    resStartStationIds.push(stationSrcList[walkbackId])
    resEndStationIds.push(walkbackId)
    resLines.push(lineSrcList[walkbackId])
    walkbackId = stationSrcList[walkbackId]
  }
  resRoute.stations.push(start)
  for (let i = resEndStationIds.length - 1; i >= 0; --i) {
    resRoute.pushEdge(resStartStationIds[i], resEndStationIds[i], resLines[i])
    resRoute.stations.push(data.stations[resEndStationIds[i]])
  }
  return resRoute
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
  console.log(state)
  return state
}
