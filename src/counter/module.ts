import { Action } from 'redux'
import { textFunction, Route } from './route'
import {fare} from './fare'
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
  fare: number,
  km: number,
  akm: number
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
  fare: 0,
  km: 0,
  akm: 0
}

export default function reducer(
  state: RouteState = initialState,
  action: RouteActions
): RouteState {
  let copyState = Object.assign({}, state)
  switch (action.type) {
    case ActionNames.TEXT:
      
      copyState = textFunction(copyState, action.text)
      const fareRes = fare(copyState.route)
      copyState.akm = fareRes.akm
      copyState.km = fareRes.km
      copyState.fare = fareRes.fare
      break
    default:
  }
  return copyState
}
