import * as fs from 'fs'
import * as iconv from 'iconv-lite'
export interface Line{
  id: number
  name: string
  kana: string
  src: string
  dest: string
  stations: Array<string>
  stationIds: Array<number>
  kms: Array<number>
  akms: Array<number>
  dupLineStationIds: Array<number>
}
export interface Station{
  id: number
  name: string
  kana: string
  lineIds: Array<number>
}
export interface OutputJSON{
  lineNames: Array<string>
  stationNames: Array<string>
  lines: Array<Line>
  stations: Array<Station>
}
const output : OutputJSON = {lineNames:[],stationNames:[],lines:[],stations:[]}
fs.readFile('./resource/mars_sd.dat',(err,data)=>{
  const recordsNum = data.length/28
  let datasd: Array<any> = []
  let stations : Map<string,string> = new Map()
  let lines : Map<number,string> = new Map()
  for(let r=0;r<recordsNum;++r){
    const offset = 28*r
    let cur = offset
    let record:Array<any> = []
    record.push(data.readUInt8(cur++))
    record.push(data.readUInt16LE(cur++))
    cur++
    record.push(data.readUInt8(cur++))
    record.push(iconv.decode(data.slice(cur,cur+14),'cp932').replace(/ /g,''))
    cur+=15
    record.push(iconv.decode(data.slice(cur,cur+9),'cp932').replace(/ /g,''))
    if(!output.lines[record[0]]){
      output.lines[record[0]]={
        id: record[0],
        name: record[3],
        kana: record[4],
        src: "",
        dest: "",
        stations: [],
        stationIds: [],
        kms: [],
        akms: [],
        dupLineStationIds: []
      }
      output.lineNames[record[0]]=record[3]
    }else if(record[0]>0){
      if(output.stationNames.includes(record[3])){
        const id = output.stationNames.indexOf(record[3])
        output.stations[id].lineIds.push(record[0])
        const lineIds = output.stations[id].lineIds
        for(let line of lineIds){
          !output.lines[line].dupLineStationIds.includes(id) && output.lines[line].dupLineStationIds.push(id)
        }
      }else{
        const nextId = output.stations.length
        output.stations.push({
          id: nextId,
          name: record[3],
          kana: record[4],
          lineIds: [record[0]]
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


  fs.readFile('./resource/mars_nn.dat',(err,data)=>{
    const recordsNum = data.length/8
    let datann = []

    for(let r=0;r<recordsNum;++r){
      const offset = 8*r
      let cur = offset
      let record:Array<any> = []
      record.push(data.readUInt16LE(cur))
      cur +=2
      record.push(data.readUInt16LE(cur))
      cur+=2
      record.push(data.readUInt16LE(cur))
      cur+=2
      record.push(data.readUInt16LE(cur))
      const id = output.lines[record[0]].kms.indexOf(record[1])
      output.lines[record[0]].akms[id] = record[2]
    }   
    for(let line of output.lines){
      const index = [...Array(line.stations.length).keys()].sort((a,b)=>line.kms[a]-line.kms[b])
      const kms = index.map(i=>line.kms[i])
      const stations = index.map(i=>line.stations[i])
      const stationIds = index.map(i=>line.stationIds[i])
      const akms = index.map(i=>line.akms[i]||0)
      line.kms = kms
      line.stations = stations
      line.stationIds = stationIds
      line.akms = akms
      line.src=stations[0]
      line.dest=stations[stations.length-1]
    } 
    console.log(JSON.stringify(output))
  })
})
