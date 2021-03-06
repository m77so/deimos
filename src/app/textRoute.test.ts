import TextRoute from './TextRoute'
it('駅　路線　駅', () => {
  const res = new TextRoute('敦賀 北陸 金沢')
  expect(res.edges.length).toBe(1)
  expect(res.edges[0].line.name).toBe('北陸')
})
it('駅　路線　路線　駅', () => {
  const res = new TextRoute('敦賀 北陸 北陸新幹線 糸魚川')
  expect(res.edges.length).toBe(2)
  expect(res.edges.map(edge => edge.line.name).join('')).toBe('北陸北陸新幹線')
})
it('路線　駅　駅', () => {
  const res  = new TextRoute('北陸 米原 岐阜')
  expect(res.edges.length).toBe(1)
  expect(res.edges.map(edge => edge.line.name).join('')).toBe('東海道')
})