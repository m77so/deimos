import * as shortestRoute from './shortestRoute'
import { data } from './data'
import { Route } from './route'
const testFunction = (start: string, end: string): Route => {
  const startStation = data.stations[data.stationNames.indexOf(start)]
  const endStation = data.stations[data.stationNames.indexOf(end)]
  return shortestRoute.default(startStation, endStation)
}
it('隣駅の最短検索', () => {
  const s = testFunction('西金沢', '野々市')
  expect(s.edges.filter(edge => edge.line.name !== '北陸').length).toBe(0)
  expect(s.edges.length).toBe(1)
})
it('同一路線の最短検索', () => {
  const s = testFunction('金沢', '芦原温泉')
  expect(s.edges.filter(edge => edge.line.name === '北陸').length).toBeGreaterThan(0)
  expect(s.edges.filter(edge => edge.line.name !== '北陸').length).toBe(0)
})
it('開始駅、終点駅が一致するか', () => {
  const stations = ['西金沢', '野々市', '法隆寺', '大聖寺', '南小倉']
  for (const stationA of stations) {
    for (const stationB of stations) {
      if (stationA !== stationB) {
        const s = testFunction(stationA, stationB)
        expect(s.stations[0].name).toBe(stationA)
        expect(s.stations[s.stations.length - 1].name).toBe(stationB)
      }
    }
  }
})
