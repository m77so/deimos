import { Action } from 'redux'
import { textFunction, Route, RouteEdge } from './route'
import { fare, FareResponse } from './fare'
export {RouteEdge}
enum ActionNames {
  TEXT = 'route/text'
}

interface TextAction extends Action {
  type: ActionNames.TEXT
  text: string
}

export const changeText = (text: string): TextAction => ({
  type: ActionNames.TEXT,
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
  duplicatedKomaru: boolean
  via: string[],
  route: Route,
  fare: FareResponse
}

export type RouteActions = TextAction

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
  route: new Route(),
  fare: new FareResponse()
}

export default function reducer(
  state: RouteState = initialState,
  action: RouteActions
): RouteState {
  let copyState = Object.assign({}, state)
  switch (action.type) {
    case ActionNames.TEXT:
      
      copyState = textFunction(copyState, action.text)
      copyState.fare = fare(copyState.route)
      break
    default:
  }
  return copyState
}
