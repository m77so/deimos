import * as React from 'react'
import { RouteState } from './module'
import RouteEdge from './RouteEdge'
import { ActionDispatcher } from './Container'
import { Route } from './route'
import { calcType, FareResponse } from './fare'
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
interface FareProps {
  fare: FareResponse
}
class FareComponent extends React.Component<FareProps, {}> {
  render() {
    let calcTypeJaStrings: string[] = []
    calcTypeJaStrings[calcType.HokkaidoKansen] = '北海道・幹線'
    calcTypeJaStrings[calcType.HondoChiho] = '本州３社・地方交通線'
    calcTypeJaStrings[calcType.HondoKansen] = '本州３社・幹線'
    calcTypeJaStrings[calcType.KyushuKansen] = '九州・幹線'
    calcTypeJaStrings[calcType.ShikokuKansen] = '四国・幹線'
    const calcTypeJa = calcTypeJaStrings[this.props.fare.calcType] || '日本語未定義'
    return (
      <p>
        営業キロ：{this.props.fare.km / 10}キロ、 運賃計算キロ：{this.props.fare.akm / 10}キロ、 運賃：{
          this.props.fare.fare
        }円、 計算方式：{calcTypeJa}
      </p>
    )
  }
}
export class App extends React.Component<Props, {}> {
  render() {
  
    return (
      <div>
        入力経路
        <RoutePreviewComponent route={this.props.value.route} />
        <FareComponent fare={this.props.value.fare} />
        <input
          type="text"
          id="textBox"
          value={this.props.value.text}
          onChange={event => this.props.actions.changeText(event.target.value)}
        />
        {this.props.value.duplicatedKomaru.length > 0 ? (
          <div>
            {this.props.value.duplicatedKomaru[0]}は駅ですか？路線ですか？駅なら末尾にsか駅，路線なら末尾にlをつけてください．<br />
            <button onClick={event => this.props.actions.changeText(this.props.value.text + '駅')}>
              これは駅です
            </button>
            <button onClick={event => this.props.actions.changeText(this.props.value.text + 'l')}>
              これは路線です
            </button>
          </div>
        ) : (
          ''
        )}
        <div>
          ほかん
          <ul className="completion">
            { this.props.value.completionLine.slice(0, 30).map(str => {
              return (
                <li key={str + '線'} onClick={event => this.props.actions.setNextPop(true, str)}>
                  路線：{str}
                </li>
              )
            })}
            {this.props.value.completionStation.slice(0, 300).map(str => {
              return (
                <li key={'s' + str} onClick={event => this.props.actions.setNextPop(false, str)}>
                  {str}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    )
  }
}
