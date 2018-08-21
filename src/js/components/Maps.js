import React, { Component } from 'react';
import { Link } from 'react-router'
import { Map, Marker, ImageOverlay, TileLayer, Tooltip, ScaleControl, Polyline } from 'react-leaflet';
import L from "leaflet";
import config from '../config'
import DivIcon from 'react-leaflet-div-icon';
import {cluster} from 'node-libs-browser';

require('leaflet.markercluster');


let trackingPin = <DivIcon className='icon-marker bg-tracking-marker'></DivIcon>
// let trackingPin = DivIcon({className: 'icon-marker bg-tracking-marker'});
let listLatLngs = [];


class ContextMenu {
  constructor() {
    console.log("ContextMenu loaded.");
  }

  // context menu based at
  // https://codepen.io/devhamsters/pen/yMProm
  updateCurrentContextMenu(event) {
    console.log("updateCurrentContextMenu");
    const clickX = event.clientX;
    const clickY = event.clientY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const rootW = this.root.offsetWidth;
    const rootH = this.root.offsetHeight;

    const right = screenW - clickX > rootW;
    const left = !right;
    const top = screenH - clickY > rootH;
    const bottom = !top;
    if (right) this.root.style.left = `${clickX + 5}px`;
    if (left) this.root.style.left = `${clickX - rootW - 5}px`;
    if (top) this.root.style.top = `${clickY + 5}px`;
    if (bottom) this.root.style.top = `${clickY - rootH - 5}px`;
  }
}

class CustomMap extends Component {
  constructor(props) {
    super(props);
    this.map = null;
    this.clusters = {};
    this.updateClusters = this.updateClusters.bind(this);
      this.createCluster = this.createCluster.bind(this);
  }

  componentDidMount() {
    console.log("CustomMap: componentDidMount");
    // create map
    this.map = L.map("map", {
      center: [49.8419, 24.0315],
      zoom: 16,
      layers: [
        L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        })
      ]
    });

    // add layer
    // this.layer = L.layerGroup().addTo(this.map);
    // this.updateMarkers(this.props.markersData);
    // this.clusters = {};
  }

  updateClusters(clusterIndex, markersData) {
    console.log("updateClusters", clusterIndex, markersData);
  }

  createCluster(devicesData)
  {
      var markerList = [];
      for (var i = 0; i < devicesData.length; i++) {
          var dev = devicesData[i];
        //   var marker = L.marker(L.latLng(a[0], a[1]), {
        //       title: title
        //   });
        //   dev.lat, dev.lng
           var marker = L.marker(L.latLng(dev.pos), {
              title: dev.label
          });
          // marker.bindPopup(title);
          markerList.push(marker);
      }
      return L.markerClusterGroup({
          chunkedLoading: true
      }).addLayers(markerList);
  }


  componentDidUpdate() {

    console.log("componentDidUpdate: clustererData", this.props.clustererData);
    //   let markerList = markersData;
    //   if (markersData === undefined)
    //   {
        //   markerList = [];
    //   }
    //   clustererData
      this.clusters = {};
      this.props.clustererData.map((element, i1) => {
        this.clusters[element.index] = this.createCluster(element.devices);
        this.map.addLayer(this.clusters[element.index]);
      })
    // check if data has changed
    // if (this.props.markersData !== markersData) {
    //   this.updateMarkers(this.props.markersData);
    // }
  }

//   updateMarkers(markersData) {
//     this.layer.clearLayers();
//     markersData.forEach(marker => {
//       L.marker(marker.latLng, { title: marker.title }).addTo(this.layer);
//     });
//   }

  render() {
    console.log("CustomMap - Render: ", this.props);
    return <div id="map" />;
  }
}


// Refs:
// https://medium.com/@cherniavskii/creating-leaflet-maps-in-react-apps-e2750372d6d6

class BigPositionRenderer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            corners: { topLeft: 100, topRight: 100, bottomLeft: 0, bottomRight: 0 },
            selectedDeviceId: -1,
            contextMenuVisibity: false,
            center: (this.props.center ? this.props.center : [-21.277057, -47.9590129]),
            zoom: (this.props.zoom ? this.props.zoom : 10)
        };
        this.contextMenu = new ContextMenu();
        this.handleContextMenu = this.handleContextMenu.bind(this);
    }

   
    handleContextMenu(e, device_id) {
        let event = e.originalEvent;
        event.preventDefault();
        if (!this.props.allowContextMenu) {
            return false;
        }
        this.setState({
          contextMenuVisibity: true,
          selectedDeviceId: device_id
        });
        // this.refs.map.leafletElement.locate()
        this.contextMenu.updateCurrentContextMenu(event);
    };

    render() {
        console.log("BigPositionRenderer: Props: ", this.props);

        return <CustomMap center={this.state.center} clustererData={this.props.clusterers} positionData={this.props.positions} deviceData={this.props.devices} zoom={this.state.zoom}>
          </CustomMap>;
    }
}



class SmallPositionRenderer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,  // is ctxMenu visible?
            selected_device_id: -1,
            isTerrain: true,
            selectedPin: true,
            center: (this.props.center ? this.props.center : [-21.277057, -47.9590129]),
            zoom: (this.props.zoom ? this.props.zoom : 2)
        };

        this.setTiles = this.setTiles.bind(this);
        this.handleTracking = this.handleTracking.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleCenter = this.handleCenter.bind(this);
    }

    // componentDidMount() {

    //     if (this.leafletMap !== undefined) {

    //         // console.log('will attempt to add layer', MQ.mapLayer, this.leafletMap);
    //         // mq = require('..//../external/mq-map.js');

    //         let mapLayer = MQ.mapLayer();
    //         mapLayer.addTo(this.leafletMap.leafletElement);

    //         L.control.layers({
    //             'Map': mapLayer,
    //             'Hybrid': MQ.hybridLayer(),
    //             'Satellite': MQ.satelliteLayer()
    //         }).addTo(this.leafletMap.leafletElement);
    //     }
    // }

    handleTracking(device_id) {
        this.props.toggleTracking(device_id);

        // closing ctxMenu
        this.setState({visible: false});
    }

    // context menu based at
    // https://codepen.io/devhamsters/pen/yMProm
    handleContextMenu(e, device_id) {
        if (!this.props.allowContextMenu) {
            return false;
        }
        let event = e.originalEvent;
        event.preventDefault();
        this.setState({visible: true, selected_device_id: device_id});

        // this.refs.map.leafletElement.locate()
        const clickX = event.clientX;
        const clickY = event.clientY;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const rootW = this.root.offsetWidth;
        const rootH = this.root.offsetHeight;

        const right = (screenW - clickX) > rootW;
        const left = !right;
        const top = (screenH - clickY) > rootH;
        const bottom = !top;
        if (right)
            this.root.style.left = `${clickX + 5}px`;
        if (left)
            this.root.style.left = `${clickX - rootW - 5}px`;
        if (top)
            this.root.style.top = `${clickY + 5}px`;
        if (bottom)
            this.root.style.top = `${clickY - rootH - 5}px`;

    };

    // resize() {
    //     if (this.leafletMap !== undefined) {
    //         this.leafletMap.leafletElement.invalidateSize();
    //     }
    // }

    setTiles(isMap) {
        this.setState({isTerrain: isMap});
    }

    handleCenter() {
        if (this.props.center) {
            this.setState({center: this.props.center})
        } else {
            this.setState({center: [-21.277057, -47.9590129]})
        }
    }

    render() {
        console.log("SmallPositionRenderer");
        console.log("PropsSmallPositionRenderer: ", this.props);
        function getPin(device) {
            if (device.hasOwnProperty('unique_key')) {
                return trackingPin;
            } else {
                return config.SinrSignalLevel(device.hasOwnProperty('_sinr') ? device._sinr[0].value : -1);
            }
        }

        let parsedEntries = this.props.devices.reduce((result, k) => {
            if (k.position !== undefined) {
                result.push({
                    id: k.id,
                    pos: k.position,
                    name: k.label,
                    pin: getPin(k),
                    timestamp: k.timestamp,
                    tracking: k.tracking,
                    key: (k.unique_key ? k.unique_key : k.id)
                });
            }

            return result;
        }, []);

        const contextMenu = this.state.visible ? (
            <div ref={ref => {
                this.root = ref
            }} className="contextMenu">
                <Link to={"/device/id/" + this.state.selected_device_id + "/detail"} title="View details">
                    <div className="contextMenu--option cmenu">
                        <i className="fa fa-info-circle"/>Details
                    </div>
                </Link>
                <div className="contextMenu--option cmenu"
                     onClick={() => {
                         this.handleTracking(this.state.selected_device_id)
                     }}>
                    <img src={"images/icons/location.png"}/>Toggle tracking
                </div>
            </div>
        ) : (
            null
        );

        //Get list of positions for each device
        for (let k in this.props.listPositions) {
            listLatLngs[k] = [];
            for (let j in this.props.listPositions[k]) {
                listLatLngs[k].push(this.props.listPositions[k][j].position)
            }
        }

        return (
            <Map center={this.props.center ? this.props.center : this.state.center}
                 zoom={this.state.zoom}
                //  ref={m => {
                //      this.leafletMap = m;
                //  }}
                 >
                <TileLayer
                    attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* {process.env.MAP_HAS_OVERLAY_ENV ? <LayerBox/> : ''} */}

                {contextMenu}
                {/* <ReactResizeDetector handleWidth onResize={this.resize.bind(this)}/> */}

                {parsedEntries.map((k) => {
                    return (
                        <Marker
                            onContextMenu={(e) => {
                                this.handleContextMenu(e, k.id);
                            }}
                            onClick={(e) => {
                                this.handleContextMenu(e, k.id);
                            }}
                            position={k.pos} key={k.key} icon={k.pin}>
                            <Tooltip>
                                <span>{k.name} : {k.timestamp}</span>
                            </Tooltip>
                            {listLatLngs[k.id] && k.tracking && this.props.showPolyline ? (
                                <Polyline positions={listLatLngs[k.id]} color='#7fb2f9' dashArray='10,10'
                                          repeatMode={false}/>
                            ) : null}
                        </Marker>
                    )
                })}
                <ScaleControl/>
            </Map>
        )
    }
}


class LayerBox extends Component {
    constructor(props) {
        super(props);
        this.state = {visible: true};
        this.toggleLayer = this.toggleLayer.bind(this);
    }

    toggleLayer() {
        this.setState({visible: !this.state.visible});
    }

    render() {

        let config = process.env.MAP_OVERLAY_JSON_ENV;
        let corner1 = L.latLng(config.corner1.lat, config.corner1.lng);
        let corner2 = L.latLng(config.corner2.lat, config.corner2.lng);
        const layerMapBounds = L.latLngBounds(corner1, corner2);
        const layerOpacity = 0.3;
        const imageOverlay = this.state.visible ? (
            <ImageOverlay
                opacity={layerOpacity}
                bounds={layerMapBounds}
                url={config.path}/>) : null;

        return (
            <div className="col s12">
                <div className="layer-div" onClick={this.toggleLayer}>
                    <img src={'images/layers.png'}/>
                </div>
                {imageOverlay}
            </div>
        )
    }
}



export { SmallPositionRenderer, BigPositionRenderer };

