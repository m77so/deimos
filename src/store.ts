import counter, { RouteActions, RouteState } from './counter/module'
import { createStore, combineReducers, Action } from 'redux'

export default createStore(
  combineReducers({
    counter
  })
)

export type ReduxState = {
  counter: RouteState
}

export type ReduxAction = RouteActions | Action
