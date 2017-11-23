import { Action } from 'redux'
import { textFunction, Route, RouteEdge, RouteNodeType } from './route'
import { fare, FareResponse } from './fare'
export { RouteEdge }
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
  source: string
  destination: string
  sourceValid: boolean
  destinationValid: boolean
  text: string
  completionStation: string[]
  completionLine: string[]
  lastInputHalfway: boolean
  duplicatedKomaru: boolean
  via: string[]
  route: Route
  fare: FareResponse
}

export type RouteActions = TextAction | NextAction

const initialState: RouteState = {
  source: '',
  destination: '',
  sourceValid: false,
  destinationValid: false,
  text: '',
  via: [],
  duplicatedKomaru: false,
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
      copyState = textFunction(
        copyState,
        `${state.text
          .replace(/^\s+|\s+$/g, '')
          .replace(/\s+/g, ' ')
          .split(' ')
          .slice(0, state.lastInputHalfway ? -1 : 99999)
          .join(' ')} ${action.text}`,
        action.line ? RouteNodeType.LINE : RouteNodeType.STATION
      )
      copyState.fare = fare(copyState.route)
      break
    case ActionNames.TEXT:
      copyState = textFunction(copyState, action.text)
      copyState.fare = fare(copyState.route)
      break
    default:
  }
  return copyState
}
