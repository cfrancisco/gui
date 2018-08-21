var alt = require('../alt');
var GeoDeviceActions = require('../actions/GeoDeviceActions');

class GeoDeviceStore {
  constructor() {
    // this.devices = {};
    // this.deviceList = [];
    this.clusterers = [];
    this.error = null;
    this.loading = false;

    this.bindListeners({
      handleFetch: GeoDeviceActions.FETCH_DEVICES,
      handleSet: GeoDeviceActions.SET_DEVICES
    });
  }

  handleFetch() {
    this.clusterers = [];
    // this.devices = {};
    // this.deviceList = [];
    this.loading = true;
  }

  handleSet(res) {
    console.log("handleSet", res);
    this.clusterers = res.json.clusterers;
    // for (let index = 0; index < this.deviceList.length; index++) {
        // this.devices[this.deviceList[index].id] = JSON.parse(JSON.stringify(this.deviceList[index]));
    // }

    this.error = null;
    this.loading = false;
  }


//   handleAppendMeasures(measureData) {
//     function parserPosition(position) {
//       if (position.toString().indexOf(",") > -1) {
//         let parsedPosition = position.split(",");
//         if (parsedPosition.length > 1) {
//           return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
//         }
//       } else {
//         return undefined;
//       }
//     }
}

var _store = alt.createStore(GeoDeviceStore, 'GeoDeviceStore');
export default _store;
