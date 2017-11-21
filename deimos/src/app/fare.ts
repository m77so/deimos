import { Companies } from './dataInterface'
import { Route } from './route'
export class FareResponse {
  fare: number
  km: number
  akm: number
  calcType: calcType
  constructor() {
    this.fare = 0
    this.km = 0
    this.akm = 0
    this.calcType = calcType.HondoKansen
  }
}
export enum calcType {
  HondoKansen,
  HokkaidoKansen,
  ShikokuKansen,
  KyushuKansen,
  HondoChiho,
  HokkaidoChiho,
  ShikokuChiho,
  KyushuChiho,
  TokuteiTokyo,
  TokuteiOsaka
}
const chitaiCalc = (chitaiKms: number[], chitaiFares: number[], km: number): number => {
  let fareCent = 0
  for (let i = 0; i < chitaiKms.length; ++i) {
    const subKm = Math.max(chitaiKms[i - 1] || 0, Math.min(chitaiKms[i], km)) - (chitaiKms[i - 1] || 0)
    if (subKm === 0) {
      break
    }
    fareCent += subKm * chitaiFares[i]
  }
  return fareCent
}
const calc = (akm: number, type: calcType): [number, calcType] => {
  // akmは100m単位であるので、1000m単位になおす
  let km = Math.ceil(akm / 10)

  // 決め打ち
  let fareYen = 0
  if (type === calcType.HondoKansen) {
    if (km <= 10) {
      const fares = [140, 190, 200, 200]
      fareYen = fares[~~((km - 1) / 3)]
    }
  } else if (type === calcType.HondoChiho) {
    if (km <= 10) {
      const fares = [140, 190, 210, 210]
      fareYen = fares[~~((km - 1) / 3)]
    } else if (11 <= km && km <= 91) {
      const lim = [11, 16, 21, 24, 33, 42, 47, 56, 65, 74, 83]
      const fares = [240, 320, 410, 500, 670, 840, 970, 1140, 1320, 1490, 1660]
      const index = lim.filter(k => k <= km).length - 1
      fareYen = fares[index]
    } else if (101 <= km && km <= 110) {
      fareYen = 1940
    } else if (292 <= km && km <= 310) {
      fareYen = 5620
    }
  } else if (type === calcType.TokuteiTokyo) {
    if (km <= 10) {
      const fares = [140, 160, 170, 170]
      fareYen = fares[~~((km - 1) / 3)]
    }
  } else if (type === calcType.TokuteiOsaka) {
    if (km <= 10) {
      const fares = [120, 160, 180, 180]
      fareYen = fares[~~((km - 1) / 3)]
    }
  }

  if (fareYen > 0) {
    return [fareYen, type]
  }

  // 計算によって求める
  if ([calcType.HokkaidoKansen, calcType.HondoKansen, calcType.KyushuKansen, calcType.ShikokuKansen].includes(type)) {
    // 幹線キロ数変換
    if (11 <= km && km <= 50) {
      km = ~~((km - 1) / 5) * 5 + 3
    } else if (km <= 100) {
      km = ~~((km - 1) / 10) * 10 + 5
    } else if (km <= 600) {
      km = ~~((km - 1) / 20) * 20 + 10
    } else if (km > 600) {
      km = ~~((km - 1) / 40) * 40 + 20
    }
  } else {
    // 地方交通線キロ数変換
    if (11 <= km && km <= 1200) {
      const lim = [
        11,
        16,
        21,
        24,
        29,
        33,
        38,
        42,
        47,
        56,
        65,
        74,
        83,
        92,
        101,
        111,
        129,
        147,
        165,
        183,
        201,
        220,
        238,
        256,
        274,
        292,
        311,
        329,
        347,
        365,
        383,
        401,
        420,
        438,
        456,
        474,
        492,
        511,
        529,
        547,
        583,
        620,
        656,
        692,
        729,
        765,
        801,
        838,
        874,
        911,
        947,
        983,
        1020,
        1056,
        1092,
        1129,
        1165,
        1200
      ]
      const lower: number = lim.filter(k => k <= km).pop() || 11
      const upper: number = lim[lim.indexOf(lower) + 1]
      km = ~~((lower + upper) / 2)
    }
  }
  let fareCent = 0
  if (type === calcType.HondoKansen) {
    fareCent = chitaiCalc([300, 600, 9999], [1620, 1285, 705], km)
  } else if (type === calcType.HokkaidoKansen) {
    fareCent = chitaiCalc([200, 300, 600, 9999], [1785, 1620, 1285, 705], km)
  } else if (type === calcType.ShikokuKansen) {
    fareCent = chitaiCalc([100, 300, 600, 9999], [1821, 1620, 1285, 705], km)
  } else if (type === calcType.HondoChiho) {
    fareCent = chitaiCalc([273, 546, 9999], [1780, 1410, 770], km)
  }
  if (km <= 100) {
    fareCent = Math.round(fareCent / 1000) * 1000
  } else {
    fareCent = Math.round(fareCent / 10000) * 10000
  }
  fareCent *= 1.08
  fareCent = Math.round(fareCent / 1000) * 1000

  return [fareCent / 100, type]
}
export const fare = (route: Route): FareResponse => {
  let totalFare = 0
  let totalKm = 0
  let totalAkm = 0
  let includeChihoFlag = false
  let onlyChihoFlag = true
  let calcTypeUsed: calcType = calcType.HokkaidoKansen
  let edgeCompany: { [key: number]: number[] } = {}
  for (let i = 0; i < route.edges.length; ++i) {
    const edge = route.edges[i]
    if (edge.line.company.length === 1) {
      // 全路線を一事業者が運営する場合
      if (edgeCompany[edge.line.company[0]] === undefined) {
        edgeCompany[edge.line.company[0]] = []
      }
      edgeCompany[edge.line.company[0]].push(i)
    } else if (edge.line.company.length > 1) {
      const comp: number[] = []
      for (let index = edge.startIndex; index <= edge.endIndex; ++index) {
        const c = edge.line.company[index]
        if (!comp.includes(c)) {
          comp.push(c)
        }
      }
      comp.forEach(c => {
        if (edgeCompany[c] === undefined) {
          edgeCompany[c] = []
        }
        edgeCompany[c].push(i)
      })
    }
    const km = Math.abs(edge.line.kms[edge.startIndex] - edge.line.kms[edge.endIndex])
    let akm = Math.abs(edge.line.akms[edge.startIndex] - edge.line.akms[edge.endIndex])
    akm = akm === 0 ? km : akm
    totalKm += km
    totalAkm += akm
    includeChihoFlag = includeChihoFlag || edge.line.chiho
    onlyChihoFlag = onlyChihoFlag && edge.line.chiho
    const sandoCompanyLength = Object.keys(edgeCompany).filter(c =>
      [Companies.JRH, Companies.JRS, Companies.JRQ].includes(+c)
    ).length
    const honshuCompanyLength = Object.keys(edgeCompany).filter(c =>
      [Companies.JRE, Companies.JRC, Companies.JRW].includes(+c)
    ).length
    if (honshuCompanyLength === 0 && sandoCompanyLength === 1) {
      const comp = +Object.keys(edgeCompany)[0]
      if (comp === Companies.JRH) {
        if (onlyChihoFlag || (totalKm <= 100 && includeChihoFlag)) {
          [totalFare, calcTypeUsed] = calc(totalKm, calcType.HokkaidoChiho)
        } else {
          [totalFare, calcTypeUsed] = calc(totalAkm, calcType.HokkaidoKansen)
        }
      } else if (comp === Companies.JRS) {
        if (onlyChihoFlag || (totalKm <= 100 && includeChihoFlag)) {
          [totalFare, calcTypeUsed] = calc(totalKm, calcType.ShikokuChiho)
        } else {
          [totalFare, calcTypeUsed] = calc(totalAkm, calcType.ShikokuKansen)
        }
      } else if (comp === Companies.JRQ) {
        if (onlyChihoFlag || (totalKm <= 100 && includeChihoFlag)) {
          [totalFare, calcTypeUsed] = calc(totalKm, calcType.KyushuChiho)
        } else {
          [totalFare, calcTypeUsed] = calc(totalAkm, calcType.KyushuKansen)
        }
      }
    } else {
      if (onlyChihoFlag || (totalKm <= 100 && includeChihoFlag)) {
        [totalFare, calcTypeUsed] = calc(totalKm, calcType.HondoChiho)
      } else {
        [totalFare, calcTypeUsed] = calc(totalAkm, calcType.HondoKansen)
      }
    }
  }

  return {
    fare: totalFare,
    km: totalKm,
    akm: totalAkm,
    calcType: calcTypeUsed
  }
}
