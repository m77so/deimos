import { Action } from 'redux'

enum ActionNames {
  SET_DEST = 'SET_DEST_STATION',
  SET_SRC = 'SET_SRC_STATION',
  CHANGE_LINE = 'CHANGE_LINE'
}

interface SetDestAction extends Action {
  type: ActionNames.SET_DEST
  station: string
}
export const setDestStation = (station: string): SetDestAction => ({
  type: ActionNames.SET_DEST,
  station: station
})

interface SetSrcAction extends Action {
  type: ActionNames.SET_SRC
  station: string
}
export const setSrcStation = (station: string): SetSrcAction => ({
  type: ActionNames.SET_SRC,
  station: station
})
export interface RouteState {
  source: string,
  destination: string,
  via: Array<string>
}
const initialState: RouteState = {
  source: '',
  destination: '',
  via: []
}

export type RouteActions = SetDestAction | SetSrcAction
export default function reducer(state: RouteState = initialState, action: RouteActions ) {
  switch (action.type) {
    case ActionNames.SET_SRC:
      return Object.assign({}, state, {
        source: action.station
      })
    case ActionNames.SET_DEST:
      return Object.assign({}, state, {
        destination: action.station
      })
    default:
      return state
  }
}