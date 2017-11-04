import * as React from 'react'
import { CounterState } from './module'
import { ActionDispatcher } from './Container'

interface Props {
  value: CounterState
  actions: ActionDispatcher
}

export class Counter extends React.Component<Props, {}> {
  render() {
    return (
      <div>
        <p>source: {this.props.value.source}</p>
        <p>destination: {this.props.value.destination}</p>
        <button onClick={() => this.props.actions.setSource('hoge')}>
          Increment 3
        </button>
        <button onClick={() => this.props.actions.setDestination('fuga')}>
          Decrement 2
        </button>
      </div>
    )
  }
}
