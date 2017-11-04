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

export interface CounterState {
  source: string,
  destination: string
}

export type CounterActions = SourceAction | DestinationAction

const initialState: CounterState = { source: '此方', destination: '彼方' }

export default function reducer(
  state: CounterState = initialState,
  action: CounterActions
): CounterState {
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
