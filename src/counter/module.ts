import { Action } from 'redux'

enum ActionNames {
  SOURCE = 'counter/source',
  DESTINATION = 'counter/decrement'
}

interface SourceAction extends Action {
  type: ActionNames.SOURCE
  station: string
}
export const setSourceStation = (station: string): SourceAction => ({
  type: ActionNames.SOURCE,
  station: station
})

interface DestinationAction extends Action {
  type: ActionNames.DESTINATION
  station: string
}

export const setDestinationStation = (station: string): DestinationAction => ({
  type: ActionNames.DESTINATION,
  station: station
})

export interface RouteState {
  source: string,
  destination: string,
  sourceValid: boolean,
  destinationValid: boolean
}

export type RouteActions = SourceAction | DestinationAction

const initialState: RouteState = { source: '此方', destination: '彼方', sourceValid: false, destinationValid: false }

export default function reducer(
  state: RouteState = initialState,
  action: RouteActions
): RouteState {
  const copyState = Object.assign({}, state)
  switch (action.type) {
    case ActionNames.SOURCE:
      copyState.source = action.station
      break
    case ActionNames.DESTINATION:
      copyState.destination = action.station
      break
    default:
      
  }
  return copyState
}
