import * as React from 'react'
import './App.css'
import InputText from './InputText'

const logo = require('./logo.svg')
enum InputBoxType {
  SOURCE,
  DESTINATION
}
interface Props {}
interface State {
  stations: Map<InputBoxType, string>
}
class App extends React.Component<Props, State> {
  renderInputBox(i: InputBoxType) {
    if (this.state.stations.has(i)) {
      return <InputText value={this.state.stations.get(i) || ''} />
    } else {
      return <InputText value="" />
    }
  }
  render(): JSX.Element {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        発駅:{this.renderInputBox(InputBoxType.SOURCE)}→着駅:{this.renderInputBox(InputBoxType.DESTINATION)}
      </div>
    )
  }
}

export default App
