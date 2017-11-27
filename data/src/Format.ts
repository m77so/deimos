import { start } from 'repl'
import * as fs from 'fs'
import * as iconv from 'iconv-lite'
import { MapZairai, Line, Station, OutputJSON, Companies } from './dataInterface'
const companyHash: { [key: string]: Companies } = {
  JR北: Companies.JRH,
  JR東: Companies.JRE,
  JR海: Companies.JRC,
  JR西: Companies.JRW,
  JR四: Companies.JRS,
  JR九: Companies.JRQ
}
const output: OutputJSON = {
  lineNames: [],
  stationNames: [],
  lines: [],
  stations: []
}
const dataSD = fs.readFileSync('./resource/MARS_SD.DAT')
/**
 * 半角カタカナを全角ひらがなに変換
 * https://qiita.com/hrdaya/items/291276a5a20971592216
 * @param {String} str 変換したい文字列
 */
const hankana2zenkana = function (str: string) {
  const kanaMap: {[key: string] :string} = {
      'ｶﾞ': 'が', 'ｷﾞ': 'ぎ', 'ｸﾞ': 'ぐ', 'ｹﾞ': 'げ', 'ｺﾞ': 'ご',
      'ｻﾞ': 'ざ', 'ｼﾞ': 'じ', 'ｽﾞ': 'ず', 'ｾﾞ': 'ぜ', 'ｿﾞ': 'ぞ',
      'ﾀﾞ': 'だ', 'ﾁﾞ': 'ぢ', 'ﾂﾞ': 'づ', 'ﾃﾞ': 'で', 'ﾄﾞ': 'ど',
      'ﾊﾞ': 'ば', 'ﾋﾞ': 'び', 'ﾌﾞ': 'ぶ', 'ﾍﾞ': 'べ', 'ﾎﾞ': 'ぼ',
      'ﾊﾟ': 'ぱ', 'ﾋﾟ': 'ぴ', 'ﾌﾟ': 'ぷ', 'ﾍﾟ': 'ぺ', 'ﾎﾟ': 'ぽ',
      'ｱ': 'あ', 'ｲ': 'い', 'ｳ': 'う', 'ｴ': 'え', 'ｵ': 'お',
      'ｶ': 'か', 'ｷ': 'き', 'ｸ': 'く', 'ｹ': 'け', 'ｺ': 'こ',
      'ｻ': 'さ', 'ｼ': 'し', 'ｽ': 'す', 'ｾ': 'せ', 'ｿ': 'そ',
      'ﾀ': 'た', 'ﾁ': 'ち', 'ﾂ': 'つ', 'ﾃ': 'て', 'ﾄ': 'と',
      'ﾅ': 'な', 'ﾆ': 'に', 'ﾇ': 'ぬ', 'ﾈ': 'ね', 'ﾉ': 'の',
      'ﾊ': 'は', 'ﾋ': 'ひ', 'ﾌ': 'ふ', 'ﾍ': 'へ', 'ﾎ': 'ほ',
      'ﾏ': 'ま', 'ﾐ': 'み', 'ﾑ': 'む', 'ﾒ': 'め', 'ﾓ': 'も',
      'ﾔ': 'や', 'ﾕ': 'ゆ', 'ﾖ': 'よ',
      'ﾗ': 'ら', 'ﾘ': 'り', 'ﾙ': 'る', 'ﾚ': 'れ', 'ﾛ': 'ろ',
      'ﾜ': 'わ', 'ｦ': 'を', 'ﾝ': 'ん',
      'ｧ': 'ぁ', 'ｨ': 'ぃ', 'ｩ': 'ぅ', 'ｪ': 'ぇ', 'ｫ': 'ぉ',
      'ｯ': 'っ', 'ｬ': 'ゃ', 'ｭ': 'ゅ', 'ｮ': 'ょ',
      '｡': '。', '､': '、', 'ｰ': 'ー', '｢': '「', '｣': '」', '･': '・'
  };

  const reg = new RegExp('(' + Object.keys(kanaMap).join('|') + ')', 'g');
  return str
          .replace(reg, function (match) {
              return kanaMap[match];
          })
          .replace(/ﾞ/g, '゛')
          .replace(/ﾟ/g, '゜');
};
const recordsNumSD = dataSD.length / 28
for (let r = 0; r < recordsNumSD; ++r) {
  const offset = 28 * r
  let cur = offset
  let record: Array<any> = []
  record.push(dataSD.readUInt8(cur++))
  record.push(dataSD.readInt16LE(cur++))
  cur++
  record.push(dataSD.readUInt8(cur++))
  record.push(
    iconv.decode(dataSD.slice(cur, cur + 14), 'cp932').replace(/ /g, '')
  )
  cur += 15
  record.push(
    iconv.decode(dataSD.slice(cur, cur + 9), 'cp932').replace(/ /g, '')
  )
  if (!output.lines[record[0]]) {
    output.lines[record[0]] = {
      id: record[0],
      name: record[3],
      kana: hankana2zenkana( record[4]),
      src: '',
      dest: '',
      stations: [],
      stationIds: [],
      kms: [],
      akms: [],
      dupLineStationIds: [],
      chiho: false,
      company: [],
      mapZairai: []
    }
    output.lineNames[record[0]] = record[3]
  } else if (record[0] > 0) {
    if (output.stationNames.includes(record[3])) {
      const id = output.stationNames.indexOf(record[3])
      output.stations[id].lineIds.push(record[0])
      const lineIds = output.stations[id].lineIds
      for (let lineId of lineIds) {
        if (!output.lines[lineId].dupLineStationIds.includes(id)) {
          output.lines[lineId].dupLineStationIds.push(id)
        }
      }
    } else {
      const nextId = output.stations.length
      output.stations.push({
        id: nextId,
        name: record[3],
        kana: hankana2zenkana( record[4]),
        lineIds: [record[0]],
        company: []
      })
      output.stationNames.push(record[3])
    }
    const line = output.lines[record[0]]
    const stationId = output.stationNames.indexOf(record[3])
    line.stations.push(record[3])
    line.kms.push(record[1])
    line.stationIds.push(stationId)
  }
}

const dataNN = fs.readFileSync('./resource/MARS_NN.DAT')
const recordsNum = dataNN.length / 8

for (let r = 0; r < recordsNum; ++r) {
  const offset = 8 * r
  let cur = offset
  let record: Array<any> = []
  record.push(dataNN.readInt16LE(cur))
  cur += 2
  record.push(dataNN.readInt16LE(cur))
  cur += 2
  record.push(dataNN.readInt16LE(cur))
  cur += 2
  record.push(dataNN.readInt16LE(cur))
  const id = output.lines[record[0]].kms.indexOf(record[1])
  output.lines[record[0]].akms[id] = record[2]
}
for (let line of output.lines) {
  const index = [...Array(line.stations.length).keys()].sort(
    (a, b) => line.kms[a] - line.kms[b]
  )
  const kms = index.map(i => line.kms[i])
  const stations = index.map(i => line.stations[i]) || ['']
  const stationIds = index.map(i => line.stationIds[i]) || [-1]
  const akms = index.map(i => line.akms[i] || 0)
  line.kms = kms
  line.stations = stations
  line.stationIds = stationIds
  line.akms = akms
  line.src = stations[0]
  line.dest = stations[stations.length - 1]
}
output.lines[0] = {
  id: 0,
  name: '',
  kana: '',
  stations: [''],
  stationIds: [-1],
  kms: [0],
  akms: [0],
  dupLineStationIds: [-1],
  src: '',
  dest: '',
  chiho: false,
  company: [],
  mapZairai: []
}

// 地方路線情報を付記
const chihoLines = fs
  .readFileSync('./resource/chihoLines.txt', 'utf-8')
  .split('\n')
chihoLines.forEach(chihoLine => {
  output.lines.forEach(line => {
    if (line.name.includes(chihoLine)) {
      line.chiho = true
    }
  })
})

// 会社情報を付記
interface CompanyOwnData{
  entire: string[]
  partial: {[key: string]: string[]}
}
const companyJSONData = JSON.parse(fs.readFileSync('./resource/company.json','utf8'))
for( let companyName of Object.keys(companyJSONData)){
  const companyCode = companyHash[companyName]
  const data = companyJSONData[companyName]
  const c: CompanyOwnData = Object.assign({},data)
  output.lineNames.forEach((lineName,lineId) =>{
    let line = output.lines[lineId]
    for(let i=0;i<c.entire.length;++i){
      if (lineName.indexOf(c.entire[i])===0){
        output.lines[lineId].company.push(companyCode)
        output.lines[lineId].stationIds.forEach(stationId=>{
          let companyList = output.stations[stationId].company
          if(!companyList.includes(companyCode)){
            companyList.push(companyCode)
          }
        })
        return
      }
    }
    for(let partialLineName of Object.keys(c.partial)) {
      if(lineName.indexOf(partialLineName)===0){
        for(let i=0; i<c.partial[partialLineName].length/2; ++i){
          let startIndex = line.stations.indexOf(c.partial[partialLineName][i*2])
          let endIndex = line.stations.indexOf(c.partial[partialLineName][i*2+1])
          ; [startIndex, endIndex] = [Math.min(startIndex,endIndex), Math.max(startIndex,endIndex)]
          if (startIndex<0 || endIndex<0){
            continue
          }
          for(let index=startIndex;index<=endIndex;++index){
            line.company[index] = companyCode
          }
          const stationIds = line.stationIds.slice(startIndex,endIndex+1)
          stationIds.forEach(stationId=>{
            let companyList = output.stations[stationId].company
            if(!companyList.includes(companyCode)){
              companyList.push(companyCode)
            }
          })
        }
      }
    }
    if(line.company.length<1){
      line.company.push(-1)
    }
  })
}
interface ShinzaiInterface {
  src: string
  dest: string
  line1: string
  line2: string
}
const dataShinzai = JSON.parse(fs.readFileSync('./resource/shinzai.json','utf8'))
const shinzais: ShinzaiInterface[] = Object.assign([],dataShinzai)

for(let shinzai of shinzais){
  const shin = output.lines[output.lineNames.indexOf(shinzai.line2)]
  const zai = output.lines[output.lineNames.indexOf(shinzai.line1)]
  let startIndex = shin.stations.indexOf(shinzai.src)
  let endIndex = shin.stations.indexOf(shinzai.dest)
  shin.mapZairai.push({
    startIndex: Math.min(startIndex,endIndex),
    endIndex: Math.max(startIndex,endIndex),
    targetLine: zai.id
  })
  startIndex = zai.stations.indexOf(shinzai.src)
  endIndex = zai.stations.indexOf(shinzai.dest)
  zai.mapZairai.push({
    startIndex: Math.min(startIndex,endIndex),
    endIndex: Math.max(startIndex,endIndex),
    targetLine: shin.id
  })
}
console.log(
  `import {OutputJSON} from './dataInterface'
export const data:OutputJSON = ${JSON.stringify(output, null, '  ')}`
)
