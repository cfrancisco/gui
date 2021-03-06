var alt = require('../alt');
var MeasureActions = require('../actions/MeasureActions');

import util from '../comms/util';

class MeasureStore {
  constructor() {
    this.devices = {};
    this.error = null;

    this.bindListeners({
      handleAppendMeasures: MeasureActions.APPEND_MEASURES,
      handleUpdateMeasures: MeasureActions.UPDATE_MEASURES,
      handleFailure: MeasureActions.MEASURES_FAILED,
    });
    // handleFetchMeansures: MeasureActions.FETCH_MEASURES,
  }

  handleUpdateMeasures(measureData) {

    if (this.data == undefined)
      this.data = measureData;
    else if (this.data.device == measureData.device) {
      for (let k in measureData.data) {
        if (measureData.data.hasOwnProperty(k)) {
          this.data.data[k] = measureData.data[k];
        }
      }
    } else {
      this.data = measureData;
    }
    // if (! ('device' in measureData)) { console.error("Missing device id"); }
    // if (! ('attr' in measureData)) { console.error("Missing attr id"); }
    // if (! ('data' in measureData)) { console.error("Missing device data"); }
    //
    // if (measureData.device in this.devices) {
    //   this.devices[measureData.device][measureData.attr.name].loading = false;
    //   this.devices[measureData.device][measureData.attr.name].data = measureData.data;
    // } else {
    //   this.error = "Device not found"
    //   console.error('failed to find device in current measures');
    // }
  }

  handleAppendMeasures(measureData) {
    if (this.data.device == measureData.device_id) {
      for (let k in measureData) {
        if (measureData.hasOwnProperty(k)) {
          if (this.data.data.hasOwnProperty(k) == false) {
            this.data.data[k] = [NaN]; // dummy entry - will always be removed
          }
          this.data.data[k].unshift(measureData[k]);
          this.data.data[k].splice(this.data.data[k].length - 1, 1)
        }
      }
    } else {
      this.data = measureData;
    }
  }

  // handleFetchMeasures(measureData) {
  //   if (! ('device' in measureData)) { console.error("Missing device id"); }
  //   if (! ('attr' in measureData)) { console.error("Missing attr id"); }
  //
  //   if (! (measureData.device in this.devices)) {
  //     this.devices[measureData.device] = {}
  //   }
  //
  //   this.devices[measureData.device][measureData.attr.name] = JSON.parse(JSON.stringify(measureData.attr));
  //   this.devices[measureData.device][measureData.attr.name].loading = true;
  // }

  handleFailure(error) {
    this.error = error;
  }
}

var _store =  alt.createStore(MeasureStore, 'MeasureStore');
export default _store;
