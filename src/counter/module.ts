import { Action } from 'redux'
import { textFunction, RouteNodeType } from './util'
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
}

export type RouteActions = TextAction

const initialState: RouteState = {
  source: '',
  destination: '',
  sourceValid: false,
  destinationValid: false,
  text: '',

  completionLine: [],
  completionStation: []
}

export default function reducer(
  state: RouteState = initialState,
  action: RouteActions
): RouteState {
  const copyState = Object.assign({}, state)
  switch (action.type) {
    case ActionNames.TEXT:
      copyState.text = action.text
      const res = textFunction(state, action.text)
      const stations = res.route.filter(
        e =>
          e.type === RouteNodeType.STATION ||
          e.type === RouteNodeType.DUPLICATED
      )
      copyState.completionLine = res.next.lines
      copyState.completionStation = res.next.stations
      if (stations.length > 0) {
        copyState.source = stations[0].value.name
      }
      if (stations.length > 1) {
        copyState.destination = stations[stations.length - 1].value.name
      }
      break
    default:
  }
  return copyState
}
