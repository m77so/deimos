export const SET_SRC_STATION = 'SET_SRC_STATION'
export const SET_DEST_STATION = 'SET_DEST_STATION'

export interface RouteState {
  source: string,
  destination: string,
  via: Array<string>
}
const initialState: RouteState = {
  source: '',
  destination: '',
  via: []
}

export default function reducer(state: RouteState = initialState, action: string){

}