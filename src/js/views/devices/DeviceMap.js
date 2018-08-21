import React, {Component} from 'react';
import TrackingActions from '../../actions/TrackingActions';
import L from "leaflet";
// import * as L from "leaflet";
import Script from 'react-load-script';
import Sidebar from '../../components/DeviceRightSidebar';
import { SmallPositionRenderer, BigPositionRenderer } from "../../components/Maps";


let listLatLngs = [];


class DeviceMapSmall extends Component {
    constructor(props) {
        super(props);

        this.state = {
            displayMap: {},
            selectedDevice: {},
            listOfDevices: [],
        };

        this.validDevices = [];
        this.showSelected = this.showSelected.bind(this);
        this.selectedDevice = this.selectedDevice.bind(this);
        this.getDevicesWithPosition = this.getDevicesWithPosition.bind(this);

        this.toggleTracking = this.toggleTracking.bind(this);
        this.countVisibleDevices = this.countVisibleDevices.bind(this);

        this.showAll = this.showAll.bind(this);
        this.hideAll = this.hideAll.bind(this);
        this.toggleVisibility = this.toggleVisibility.bind(this);
    }

    countVisibleDevices()
    {
        let count = 0; 
        for (let k in this.validDevices) {
            if (this.state.displayMap[this.validDevices[k].id]) count++;
        }
        return count;
    }

    componentDidMount() {
        console.log("DeviceMapSmall: componentDidMount.");
        this.showAll();
    }

    selectedDevice(device) {
        let selectedDevice = this.state.selectedDevice;
        if (selectedDevice.hasOwnProperty(device)) {
            selectedDevice[device] = !selectedDevice[device];
        } else {
            selectedDevice[device] = true;
        }
        this.setState({selectedDevice: selectedDevice});
    }

    toggleVisibility(device_id)
    {
        console.log("toggleVisibility",device_id);
        let displayMap = this.state.displayMap;
        displayMap[device_id] = !displayMap[device_id];
        this.setState({ displayMap: displayMap });
    }

    hideAll() {
        let displayMap = this.state.displayMap;
        for (let k in displayMap) {
            displayMap[k] = false;
        }
        this.setState({displayMap: displayMap});
    }

    showAll() {

        // create map to check visibility
        let displayMap = {};
        for (let k in this.props.devices) {
            displayMap[this.props.devices[k].id] = true;
        }
        this.setState({displayMap: displayMap});
    }

    toggleTracking(device_id) {
        if (!this.props.tracking.hasOwnProperty(device_id)) {
            for (let k in this.props.devices[device_id].attrs) {
                for (let j in this.props.devices[device_id].attrs[k]) {
                    if (this.props.devices[device_id].attrs[k][j].value_type === "geo:point") {
                        TrackingActions.fetch(device_id, this.props.devices[device_id].attrs[k][j].label);
                        this.props.devices[device_id].tracking = true;
                    }
                }
            }
        } else {
            TrackingActions.dismiss(device_id);
            this.props.devices[device_id].tracking = false;
        }
    }

    showSelected(device) {
        if (this.state.selectedDevice.hasOwnProperty(device)) {
            return this.state.selectedDevice[device];
        }
        return false;
    }

    // toggleDisplay(device) {
    //     let displayMap = this.state.displayMap;
    //     if (displayMap.hasOwnProperty(device)) {
    //         displayMap[device] = !displayMap[device];
    //     } else {
    //         displayMap[device] = false;
    //     }
    //     this.setState({displayMap: displayMap});
    // }

    getDevicesWithPosition(devices) {
        function parserPosition(position) {
            let parsedPosition = position.split(",");
            return [parseFloat(parsedPosition[0]), parseFloat(parsedPosition[1])];
        }

        let validDevices = [];
        for (let k in devices) {
            for (let j in devices[k].attrs) {
                for (let i in devices[k].attrs[j]) {
                    if (devices[k].attrs[j][i].type === "static") {
                        if (devices[k].attrs[j][i].value_type === "geo:point") {
                            devices[k].position = parserPosition(devices[k].attrs[j][i].static_value);
                        }
                    }
                }
            }

            devices[k].select = this.showSelected(k);
            if (devices[k].position !== null && devices[k].position !== undefined) {
                validDevices.push(devices[k]);
            }
        }
        return validDevices;
    }

    render() {
        console.log("DeviceMapSmall: render. ");
        this.validDevices = this.getDevicesWithPosition(this.props.devices);
        let filteredList = this.validDevices;
        let nVisibleDevices = this.countVisibleDevices();

        const device_icon = (<img src={'images/icons/chip.png'}/>);
        const displayDevicesCount = "Showing " + nVisibleDevices + " of " + this.validDevices.length + " device(s)";

        let pointList = [];
        for (let k in filteredList) {
            let device = filteredList[k];
            device.hasPosition = device.hasOwnProperty('position');
            if (this.props.tracking.hasOwnProperty(device.id) && this.state.displayMap[device.id]) {
                pointList = pointList.concat(this.props.tracking[device.id].map((e, k) => {
                    let updated = e;
                    updated.id = device.id;
                    updated.unique_key = device.id + "_" + k;
                    updated.label = device.label;
                    updated.timestamp = e.timestamp;
                    return updated;
                }));
            }
            if (this.state.displayMap[device.id])
                pointList.push(device);
         }

        console.log("Devices: pointList: ", pointList);
        return  <div>
            <SmallPositionRenderer devices={pointList} toggleTracking={this.toggleTracking} allowContextMenu={true} listPositions={this.props.tracking} showPolyline={true} /> 
            {/* : 
            <div className="row full-height relative">
        <div className="background-info valign-wrapper full-height">
            <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center" />
        </div>
        </div>} */}
        <Sidebar deviceInfo={displayDevicesCount} toggleVisibility={this.toggleVisibility} devices={this.validDevices} hideAll={this.hideAll} showAll={this.showAll} displayMap={this.state.displayMap} />
        </div>
        }   
}



class DeviceMapBig extends Component {
  constructor(props) {
    super(props);

    this.state = {
      corners: { topLeft: 100, topRight: 100, bottomLeft: 0, bottomRight: 0 },
      zoom: 18
    };

    // this.splitInClusters = this.splitInClusters.bind(this);
    this.handleGeoDevices = this.handleGeoDevices.bind(this);
    this.markerList = [];
    this.clusterers = {};
  }

  componentDidMount() {
    console.log("DeviceMapBig: componentDidMount, props: ", this.props);
  }

//   splitInClusters()
//   {
//       let markers = this.markerList;
//       console.log("splitInClusters", markers);
//         let clusterers = {};
//         let numberof = (markers.length%20000);
//         for (let index = 0; index < numberof; index++)
//         {
//             clusterers[index] = markers.slice(index, index*numberof);
//         }
//         return clusterers;
//  }

  handleGeoDevices() {
    console.log("DeviceMapBig: handleGeoDevices", this.props);
    this.clusterers = [];
    // step 1. Create elements to set on markers
    this.props.clusterers.map((element, i1) => {
        let clstr = {index:i1,devices:[]};
        element.devices.map((element, index) => {
        console.log("element.geo.lat", element.geo);
        if (element.geo !== undefined) {
            clstr.devices.push({
              id: element.id,
              lat: element.geo.lat,
              lng: element.geo.lng,
              pos: [
                parseFloat("-23.5373"),
                parseFloat("-46.6293")
              ],
              label: element.label,
              timestamp: element.timestamp,
              key: element.id
            });
        }
        });
        this.clusterers.push(clstr);
    });
    console.log("this.clusterers", this.clusterers);

    // this.clusterers = this.splitInClusters();
  }

  render() {
    this.handleGeoDevices();
    // let displayDevicesCount = "Showing " + filteredList.length + " device(s)";

    return (
      <BigPositionRenderer
        devices={this.props.devices}
        allowContextMenu={true}
        // positions={this.markerList}
        clusterers={this.clusterers}
      />
    );
  }
}

export { DeviceMapSmall, DeviceMapBig };
