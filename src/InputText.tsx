import * as React from 'react'
import './App.css'
interface Props {
  value: string
//  onKeyDown: Function
}
interface State {}
class InputText extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
  }

  render(): JSX.Element {
    return (
      <input
        type="text"
      //  onKeyDown={() => this.props.onKeyDown()}
        value={this.props.value}
      />
    )
  }
}

export default InputText
