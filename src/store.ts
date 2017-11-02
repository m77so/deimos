import { createStore, combineReducers, Action } from 'redux'
import route, { RouteState, RouteActions } from './modules/route'
export default createStore(
  combineReducers({
    route
  })
)

export type ReduxState = {
  route: RouteState
}

export type ReduxAction = RouteActions | Action
