import * as React from 'react'
import { RouteState, RouteEdge } from './module'
import { ActionDispatcher } from './Container'
import { Route } from './route'
import './App.css'

interface Props {
  value: RouteState
  actions: ActionDispatcher
}
interface RailProps {
  edge: RouteEdge
}
interface StationProps {
  value: string
}
class Rail extends React.Component<RailProps, {}> {
  render() {
    const edge = this.props.edge
    const km = Math.abs(edge.line.kms[edge.startIndex] - edge.line.kms[edge.endIndex])
    return (
      <div className="railWrapper">
        <div className={`rail ${edge.line.chiho ? 'railChiho' : ''}`}>{this.props.edge.line.name}</div>
        <div className="comment">{km / 10}km</div>
      </div>
    )
  }
}
class StationComponent extends React.Component<StationProps, {}> {
  render() {
    return <div className="station">{this.props.value}</div>
  }
}
interface RoutePreviewProps {
  route: Route
}
class RoutePreviewComponent extends React.Component<RoutePreviewProps, {}> {
  render() {
    let components: JSX.Element[] = []
    const edges = this.props.route.edges
    const stations = this.props.route.stations
    let keyCounter = 99000
    if (stations.length > 0) {
      components.push(<StationComponent value={stations[0].name} key={keyCounter++} />)
      edges.map((edge, index) => {
        const station = stations[index + 1]
        components.push(<Rail edge={edge} key={keyCounter++} />)
        components.push(<StationComponent value={station.name} key={keyCounter++} />)
      })
    } else {
      components.push(<span>{'　'}</span>)
    }
    return <div className="routePreview">{components}</div>
  }
}
export class App extends React.Component<Props, {}> {
  render() {
    return (
      <div>
        入力経路
        <RoutePreviewComponent route={this.props.value.route} />
        <p>
          営業キロ：{this.props.value.km / 10}キロ、運賃計算キロ：{this.props.value.akm / 10}キロ、運賃：{this.props.value.fare}円
        </p>
        <input
          type="text"
          id="textBox"
          value={this.props.value.text}
          onChange={event => this.props.actions.changeText(event.target.value)}
        />
        {this.props.value.duplicatedKomaru ? (
          <div>路線名と駅名で同じ名前のやつがあると判定するのがめんどくさいので，駅なら末尾にsか駅，路線なら末尾にlをつけてください．そのうち頑張って実装します．</div>
        ) : (
          ''
        )}
        <div>
          ほかん
          <ul>
            {this.props.value.completionLine.slice(0, 30).map(str => {
              return <li key={'l' + str}>LINE:{str}</li>
            })}
            {this.props.value.completionStation.slice(0, 300).map(str => {
              return <li key={'s' + str}>{str}</li>
            })}
          </ul>
        </div>
      </div>
    )
  }
}
