import * as React from 'react'
import { RouteState } from './module'
import { ActionDispatcher } from './Container'

interface Props {
  value: RouteState
  actions: ActionDispatcher
}

export class Counter extends React.Component<Props, {}> {
  render() {
    return (
      <div>
        <p>
          source: {this.props.value.source}
          {this.props.value.sourceValid ? '✓' : '☓'}
        </p>
        <p>destination: {this.props.value.destination}{this.props.value.destinationValid ? '✓' : '☓'}</p>
        <input
          type="text"
          value={this.props.value.source}
          onChange={event => this.props.actions.setSource(event.target.value)}
        />
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
