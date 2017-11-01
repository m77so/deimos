import { createStore, combineReducers, Action } from 'redux'

export default createStore(
  combineReducers({
    route
  })
)

export type ReduxState = {
  counter: RouteState
}

export type ReduxAction = RouteActions | Action
