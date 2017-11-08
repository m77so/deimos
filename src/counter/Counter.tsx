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
        <p>営業キロ：{this.props.value.km/10}キロ、運賃計算キロ：{this.props.value.akm/10}キロ、運賃：{this.props.value.fare}円</p>
        <input
          type="text"
          value={this.props.value.text}
          onChange={event => this.props.actions.changeText(event.target.value)}
        />
        { 
        (this.props.value.duplicatedKomaru)?
          <div>路線名と駅名で同じ名前のやつがあると判定するのがめんどくさいので，駅なら末尾にsか駅，路線なら末尾にlをつけてください．そのうち頑張って実装します．</div> : ''}
        <div>
          ほかん
          <ul>
            {this.props.value.completionLine.slice(0,30).map(str => {
              return <li key={'l' + str}>LINE:{str}</li>
            })}
            {this.props.value.completionStation.slice(0,300).map(str => {
              return <li key={'s' + str}>{str}</li>
            })}
          </ul>
        </div>
      </div>
    )
  }
}
