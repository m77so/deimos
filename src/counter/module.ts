import { Action } from 'redux'

enum ActionNames {
  SOURCE = 'route/source',
  DESTINATION = 'route/decrement',
  TEXT = 'route/text'
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

interface TextAction extends Action {
  type: ActionNames.TEXT
  text: string
}

export const changeText = (text: string): TextAction => ({
  type: ActionNames.TEXT,
  text: text
})
export interface RouteState {
  source: string,
  destination: string,
  sourceValid: boolean,
  destinationValid: boolean,
  text: string
}

export type RouteActions = SourceAction | DestinationAction | TextAction

const initialState: RouteState = { 
  source: '金沢', destination: '福井', sourceValid: false, destinationValid: false, text: '金沢 福井' 
}

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
    case ActionNames.TEXT:
      copyState.text = action.text
      const textArray = action.text.split(' ')
      if (textArray[0].length > 0 ) {
        copyState.source = textArray[0]
      }
      if (textArray.length > 1 ) {
        copyState.destination = textArray[1]
      }
      break
    default:
      
  }
  return copyState
}
