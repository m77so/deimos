import * as shortestRoute from './shortestRoute'
import { data } from './data'
it('same line', () => {
  const startStation = data.stations[data.stationNames.indexOf('金沢')]
  const endStation = data.stations[data.stationNames.indexOf('芦原温泉')]
  const s = shortestRoute.default(startStation, endStation)
  expect(s.stations[0].name).toBe('金沢')
})