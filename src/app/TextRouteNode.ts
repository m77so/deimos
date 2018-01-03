import { Station, Line } from './dataInterface'
import { data } from './data'
import { pregQuote } from './util'
import NextPops from './NextPops'

export enum RouteNodeType {
  STATION,
  LINE,
  DUPLICATED,
  UNKNOWN
}
export class TextRouteNodeStation {
  textType: RouteNodeType.STATION
  nodeType: RouteNodeType.STATION
  station: Station
  nextFromStation: NextPops
  get value() {
    return this.station
  }
  constructor(station: Station) {
    this.station = station
    this.nextFromStation = new NextPops()
    this.textType = RouteNodeType.STATION
    this.nodeType = RouteNodeType.STATION
  }
}
export class TextRouteNodeLine {
  textType: RouteNodeType.LINE
  nodeType: RouteNodeType.LINE
  line: Line
  nextFromLine: NextPops
  get value() {
    return this.line
  }
  constructor(line: Line) {
    this.line = line
    this.nextFromLine = new NextPops()
    this.textType = RouteNodeType.LINE
    this.nodeType = RouteNodeType.LINE
  }
}
export class TextRouteNodeDuplicate {
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
export class TextRouteNodeUnknown {
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
    this._nextFromLine = new NextPops()
    this._nextFromStation = new NextPops()
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
