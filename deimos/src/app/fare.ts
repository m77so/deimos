import { Route } from './route'

interface FareResponse {
  fare: number
  km: number
  akm: number
}
enum calcType {
  HondoKansen,
  HokkaidoKansen,
  ShikokuKansen,
  KyushuKansen,
  HondoChiho
}
const chitaiCalc = (
  chitaiKms: number[],
  chitaiFares: number[],
  km: number
): number => {
  let fareCent = 0
  for (let i = 0; i < chitaiKms.length; ++i) {
    const subKm =
      Math.max(chitaiKms[i - 1] || 0, Math.min(chitaiKms[i], km)) -
      (chitaiKms[i - 1] || 0)
    if (subKm === 0) {
      break
    }
    fareCent += subKm * chitaiFares[i]
  }
  return fareCent
}
const calc = (akm: number, type: calcType): number => {
  // akmは100m単位であるので、1000m単位になおす
  let km = Math.ceil(akm / 10)
  if (
    [
      calcType.HokkaidoKansen,
      calcType.HondoKansen,
      calcType.KyushuKansen,
      calcType.ShikokuKansen
    ].includes(type)
  ) {
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
  if (type === calcType.HondoChiho) {
    if (11 <= km && km <= 91) {
      const lim = [11, 16, 21, 24, 33, 42, 47, 56, 65, 74, 83]
      const fares = [240, 320, 410, 500, 670, 840, 970, 1140, 1320, 1490, 1660]
      const index = lim.filter(k => k <= km).length - 1
      fareCent = fares[index] * 100
    } else if (101 <= km && km <= 110) {
      fareCent = 1940 * 100
    } else if (292 <= km && km <= 310) {
      fareCent = 5620 * 100
    }
  }

  return fareCent / 100
}
export const fare = (route: Route): FareResponse => {
  let totalFare = 0
  let totalKm = 0
  let totalAkm = 0
  let includeChihoFlag = false
  let onlyChihoFlag = true
  for (let i = 0; i < route.edges.length; ++i) {
    const edge = route.edges[i]
    const km = Math.abs(
      edge.line.kms[edge.startIndex] - edge.line.kms[edge.endIndex]
    )
    let akm = Math.abs(
      edge.line.akms[edge.startIndex] - edge.line.akms[edge.endIndex]
    )
    akm = akm === 0 ? km : akm
    totalKm += km
    totalAkm += akm
    includeChihoFlag = includeChihoFlag || edge.line.chiho
    onlyChihoFlag = onlyChihoFlag && edge.line.chiho
  }
  if (onlyChihoFlag) {
    totalFare = calc(totalKm, calcType.HondoChiho)
  } else {
    totalFare = calc(totalAkm, calcType.HondoKansen)
  }
  return {
    fare: totalFare,
    km: totalKm,
    akm: totalAkm
  }
}
