import { data } from './data'
import { Route } from './Route'
import shortestRoute from './shortestRoute'
import NextPops from './NextPops'
import {TextRouteNode, TextRouteNodeDuplicate, TextRouteNodeUnknown, RouteNodeType } from './TextRouteNode'

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
  const suffix = word.slice(-1) || ''
  if (specialSuffix.indexOf(suffix) > -1) {
    word = word.slice(0, -1)
  }
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

export default class TextRoute extends Route {
  constructor(text: string = '', lastNodeType: RouteNodeType = RouteNodeType.DUPLICATED) {
    super(text, lastNodeType)
    if (text !== '') {
      this.textFunction(text, lastNodeType)
    }
  }
textFunction(
    text: string,
    finalNodeType: RouteNodeType = RouteNodeType.DUPLICATED
  ) {
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
        const res = shortestRoute(data.stations[startIndex], data.stations[endIndex])
        this.edges = res.edges
        this.stations = res.stations
        return
      }
    }
    
    // nextの初期化　最初は全ての可能性がある
    for (let i = 0, l = data.stations.length; i < l; ++i) {
      next.stations[i] = i
    }
    for (let i = 1, l = data.lines.length; i < l; ++i) {
      next.lines[i - 1] = i
    }
  
    let textRoute: TextRouteNode[] = [] // TextBoxのWord分割したもの　Wordに意味を与える
    this.textRoute = textRoute
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
        ({ lastNodeType, type, stationId, lineId } = detectWordType(word, next, new NextPops()))
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
          unknown.nextFromLine = new NextPops()
        } else {
          unknown.setLastTextNode(textRoute[i - 1])
        }
        textRoute.push(unknown)
        break
      }
  
      if (type === RouteNodeType.DUPLICATED) {
        textRoute.push(
          new TextRouteNodeDuplicate(
            data.stations[stationId],
            data.lines[lineId],
            this.nextPopsStation(stationId),
            this.nextPopsLine(lineId)
          )
        )
        return 
      }
  
      // DUPは処理をしない
      if (type === RouteNodeType.LINE) {
        this.nextLine(lineId)
      } else {
        this.nextStation(stationId)
      }
    }
    return
  }
}