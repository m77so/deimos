import { Action } from 'redux'
import { Route } from './Route'
import TextRoute from './TextRoute'
import { fare, FareResponse } from './fare'
enum ActionNames {
  TEXT = 'route/text',
  NEXT = 'route/next'
}

interface TextAction extends Action {
  type: ActionNames.TEXT
  text: string
}

export const changeText = (text: string): TextAction => ({
  type: ActionNames.TEXT,
  text: text
})
interface NextAction extends Action {
  type: ActionNames.NEXT
  line: boolean
  text: string
}

export const setNextPop = (line: boolean, text: string): NextAction => ({
  type: ActionNames.NEXT,
  line: line,
  text: text
})
export interface RouteState {
  source: string // 始発駅が入る　あんまり使ってない
  destination: string // 着駅が入る　あんまり使ってない
  text: string // 入力欄
  completionStation: string[] // 補完リスト・駅名
  completionLine: string[] // 補完リスト・路線名
  lastInputHalfway: boolean // 最後の要素が入力中途か判定　補完ボタンを押した時に除去するかどうか
  duplicatedKomaru: string[] // 駅か路線かわからなくて困った時
  route: Route // 経路
  fare: FareResponse // 運賃
}

export type RouteActions = TextAction | NextAction

export const initialState: RouteState = {
  source: '',
  destination: '',
  text: '',
  duplicatedKomaru: [],
  completionLine: [],
  completionStation: [],
  lastInputHalfway: false,
  route: new Route(),
  fare: new FareResponse()
}

export default function reducer(state: RouteState = initialState, action: RouteActions): RouteState {
  let copyState = Object.assign({}, state)
  switch (action.type) {
    case ActionNames.NEXT:
      copyState.route.next(action.line,action.text)
      copyState.text = copyState.route.generateText('')
      copyState.fare = fare(copyState.route)
      break
    case ActionNames.TEXT:
      copyState.text = action.text
      .replace(/^\s+/g, '')
      .replace(/\s+/g, ' ')
      copyState.route = new TextRoute(action.text)
      copyState.fare = fare(copyState.route)
      break
    default:
  }
  const completions = copyState.route.getCompletion()
  copyState.completionLine = completions.line
  copyState.completionStation = completions.station
  return copyState
}
