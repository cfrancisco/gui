import util from '../util';

// import * as clusterData from "../../clusterers.json";
// import * as data from "./example.json";
var clusterData = require("../../clusterers.json");
console.log("clusterData: ", clusterData);

class DeviceManager {
  constructor() {
    this.baseUrl = "";
  }


  getDevicesWithPosition(params) {
    let corners = {
      "filterType": "geo",
        "value": [
          {
            "latitude": 0,
            "longitude": 0
          },
          {
            "latitude": 0,
            "longitude": "1.1"
          },
          {
            "latitude": "1.1",
            "longitude": "1.1"
          },
          {
            "latitude": "1.1",
            "longitude": 0
          }
        ]
    }
    let qs = Object.keys(corners)
      .map(key => key + "=" + corners[key])
        .join("&");
    // return util.GET(this.baseUrl + "/device/geo?" + qs);
    return Promise.resolve({ ok: true, json: clusterData });
  }

  getDevices(params) {
    if (params) {
      let qs = Object.keys(params)
        .map(key => key + "=" + params[key])
        .join("&");
      return util.GET(this.baseUrl + "/device?" + qs);
    } else return util.GET(this.baseUrl + "/device?page_size=1000");
  }

  // @TODO probably here isn't a good place to handle stats
  getStats() {
    return util.GET(this.baseUrl + "/metric/admin/metrics/");
  }

  getLastDevices(field) {
    return util.GET(this.baseUrl + "/device?limit=10&sortDsc=" + field);
  }

  getDevice(id) {
    return util.GET(this.baseUrl + "/device/" + id);
  }

  getDeviceByTemplateId(templateId, params) {
    if (params) {
      let qs = Object.keys(params)
        .map(key => key + "=" + params[key])
        .join("&");
      return util.GET(this.baseUrl + "/device/template/" + templateId + "?" + qs);
    }
    else
      return util.GET(this.baseUrl + "/device/template/" + templateId);
  }

  setDevice(detail) {
    return util.PUT(this.baseUrl + "/device/" + detail.id, detail);
  }

  addDevice(d) {
    d.id = util.sid();
    return util.POST(this.baseUrl + "/device", d);
  }

  deleteDevice(id) {
    return util.DELETE(this.baseUrl + "/device/" + id);
  }
}

var deviceManager = new DeviceManager();
export default deviceManager;
