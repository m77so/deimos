
import { Station } from './dataInterface'
import { data } from './data'
import { Route } from './Route'
/*
* 最安経路を導出する
* 大都市近郊区間用
*/
export default function shortestRoute (start: Station, end: Station): Route {
  const distList: { [key: number]: number } = {} // 距離リスト
  const stationSrcList: { [key: number]: number } = {} // その駅がどこから来たか
  const lineSrcList: { [key: number]: number } = {} // その駅がどの路線で来たか
  distList[start.id] = 0
  stationSrcList[start.id] = -1
  lineSrcList[start.id] = -1
  const sortedListByDistStationIds: number[] = [start.id]
  let resRoute: Route = new Route()
  for (
    let sortedListByDistStationIdsIndex = 0;
    sortedListByDistStationIds[sortedListByDistStationIdsIndex] !== end.id;
    ++sortedListByDistStationIdsIndex
  ) {
    const srcStation = data.stations[sortedListByDistStationIds[sortedListByDistStationIdsIndex]]
    srcStation.lineIds.forEach(lineId => {
      const line = data.lines[lineId]
      const checkStationsLineIndexes: number[] = []
      const srcStationLineIndex = line.stationIds.indexOf(srcStation.id)
      // 複数路線もつ駅かendの駅しかnodeにならない
      const nodeStationLineIndexes = line.dupLineStationIds.map(id => line.stationIds.indexOf(id))
      if (end.lineIds.includes(lineId)) {
        nodeStationLineIndexes.push(line.stationIds.indexOf(end.id))
      }
      let smallerIndex = -1
      let largerIndex = 99999
      for (let index of nodeStationLineIndexes) {
        if (index < srcStationLineIndex) {
          smallerIndex = Math.max(index, smallerIndex)
        } else if (index > srcStationLineIndex) {
          largerIndex = Math.min(index, largerIndex)
        }
      }
      if (largerIndex < 9999) {
        checkStationsLineIndexes.push(largerIndex)
      }
      if (smallerIndex > -1) {
        checkStationsLineIndexes.push(smallerIndex)
      }
      for (let index of checkStationsLineIndexes) {
        let km = distList[srcStation.id]
        const checkStationId = line.stationIds[index]
        if (line.chiho) {
          km += Math.abs(line.akms[index] - line.akms[srcStationLineIndex])
        } else {
          km += Math.abs(line.kms[index] - line.kms[srcStationLineIndex])
        }
        if (distList[checkStationId] === undefined || distList[checkStationId] > km) {
          distList[checkStationId] = km
          stationSrcList[checkStationId] = srcStation.id
          lineSrcList[checkStationId] = lineId
          // 以下は
          // distSortedArray.push(checkStationId).sort((a,b)=>distList[a]-distList[b])
          // と等価だが挿入ソートでO(n)
          let i = sortedListByDistStationIdsIndex
          while (distList[sortedListByDistStationIds[i]] < km && ++i < sortedListByDistStationIds.length) {
            continue
          }
          sortedListByDistStationIds.splice(i, 0, checkStationId)
        }
      }
    })
  }
  let walkbackId = end.id
  const resStartStationIds = []
  const resEndStationIds = []
  const resLines = []
  while (walkbackId !== start.id) {
    resStartStationIds.push(stationSrcList[walkbackId])
    resEndStationIds.push(walkbackId)
    resLines.push(lineSrcList[walkbackId])
    walkbackId = stationSrcList[walkbackId]
  }
  resRoute.stations.push(start)
  for (let i = resEndStationIds.length - 1; i >= 0; --i) {
    resRoute.pushEdge(resStartStationIds[i], resEndStationIds[i], resLines[i])
    resRoute.stations.push(data.stations[resEndStationIds[i]])
  }
  return resRoute
}
