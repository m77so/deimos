import * as textFunction from './textFunction'
import { initialState } from './module'
it('駅　路線　駅', () => {
  const res = textFunction.default(initialState, '敦賀　北陸　金沢')
  expect(res.route.edges.length).toBe(1)
  expect(res.route.edges[0].line.name).toBe('北陸')
  expect(res.text).toBe('敦賀 北陸 金沢')
})
