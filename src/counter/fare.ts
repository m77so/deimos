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
  HondoChiho
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
const calc = (akm: number, type: calcType): number => {
  // akmは100m単位であるので、1000m単位になおす
  let km = Math.ceil(akm / 10)
  if (11 <= km && km <= 50) {
    km = ~~((km - 1) / 5) * 5 + 3
  } else if (km <= 100) {
    km = ~~((km - 1) / 10) * 10 + 5
  } else if (km <= 600) {
    km = ~~((km - 1) / 20) * 20 + 10
  } else if (km > 600) {
    km = ~~((km - 1) / 40) * 40 + 20
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
  return fareCent / 100
}
export const fare = (route: Route): FareResponse => {
  let totalFare = 0
  let totalKm = 0
  let totalAkm = 0
  for (let i = 0; i < route.edges.length; ++i) {
    const edge = route.edges[i]
    const km = Math.abs(edge.line.kms[edge.startIndex] - edge.line.kms[edge.endIndex])
    let akm = Math.abs(edge.line.akms[edge.startIndex] - edge.line.akms[edge.endIndex])
    akm = akm === 0 ? km : akm
    totalKm += km
    totalAkm += akm
  }
  totalFare = calc(totalAkm, calcType.HondoKansen)
  return {
    fare: totalFare,
    km: totalKm,
    akm: totalAkm
  }
}
