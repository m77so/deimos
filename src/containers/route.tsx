import { Route } from '../components/route'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { ReduxAction, ReduxState } from '../store'
import { setSrcStation, setDestStation } from '../modules/route'
export class ActionDispatcher {
  constructor(private dispatch: (action: ReduxAction) => void) {}

  public setSrcStation(station: string) {
    this.dispatch(setSrcStation(station))
  }

  public setDestStation(station: string) {
    this.dispatch(setDestStation(station))
  }
}

export default connect(
  (state: ReduxState) => ({
    route: state.route
  }),
  (dispatch: Dispatch<ReduxAction>) => ({
    actions: new ActionDispatcher(dispatch)
  })
)(Route)
