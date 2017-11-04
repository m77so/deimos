import { Counter } from './Counter'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { setDestinationStation, setSourceStation } from './module'
import { ReduxAction, ReduxState } from '../store'

export class ActionDispatcher {
  constructor(private dispatch: (action: ReduxAction) => void) {}

  public setSource(station: string) {
    this.dispatch(setSourceStation(station))
  }

  public setDestination(station: string) {
    this.dispatch(setDestinationStation(station))
  }
}

export default connect(
  (state: ReduxState) => ({ value: state.counter }),
  (dispatch: Dispatch<ReduxAction>) => ({
    actions: new ActionDispatcher(dispatch)
  })
)(Counter)
