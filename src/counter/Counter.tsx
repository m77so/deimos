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
        <p>
          via: {this.props.value.via.join(',')}
        </p>
        <p>
          destination: {this.props.value.destination}
          {this.props.value.destinationValid ? '✓' : '☓'}
        </p>
        <input
          type="text"
          value={this.props.value.text}
          onChange={event => this.props.actions.changeText(event.target.value)}
        />
        <div>
          ほかん
          <ul>
            {this.props.value.completionLine.slice(0,30).map(str => {
              return <li key={'l' + str}>LINE:{str}</li>
            })}
            {this.props.value.completionStation.slice(0,30).map(str => {
              return <li key={'s' + str}>{str}</li>
            })}
          </ul>
        </div>
      </div>
    )
  }
}
