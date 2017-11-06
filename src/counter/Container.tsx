import { Counter } from './Counter'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { changeText } from './module'
import { ReduxAction, ReduxState } from '../store'

export class ActionDispatcher {
  constructor(private dispatch: (action: ReduxAction) => void) {}

  public changeText(text: string) {
    this.dispatch(changeText(text))
  }
}

export default connect(
  (state: ReduxState) => ({ value: state.counter }),
  (dispatch: Dispatch<ReduxAction>) => ({
    actions: new ActionDispatcher(dispatch)
  })
)(Counter)
