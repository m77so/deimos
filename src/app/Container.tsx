import { App } from './App'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { changeText, setNextPop } from './module'
import { ReduxAction, ReduxState } from '../store'

export class ActionDispatcher {
  constructor(private dispatch: (action: ReduxAction) => void) {}

  public changeText(text: string) {
    this.dispatch(changeText(text))
  }
  public setNextPop(line: boolean, text: string) {
    this.dispatch(setNextPop(line, text))
  }
}

export default connect(
  (state: ReduxState) => ({ value: state.counter }),
  (dispatch: Dispatch<ReduxAction>) => ({
    actions: new ActionDispatcher(dispatch)
  })
)(App)
