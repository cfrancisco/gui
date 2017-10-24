import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import deviceManager from '../../comms/devices/DeviceManager';

import util from "../../comms/util/util";
import SideBar from "../../components/DeviceFilterMenu";
import {SubHeader, SubHeaderItem} from "../../components/SubHeader";
import { PageHeader } from "../../containers/full/PageHeader";

import TrackingActions from '../../actions/TrackingActions';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link } from 'react-router'

import { LayerGroup, LayersControl, Map, TileLayer, Marker, Popup,Tooltip, Point } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { ImageOverlay , latLngBounds } from 'react-leaflet'
import ReactResizeDetector from 'react-resize-detector';

var grayPin = L.divIcon({className: 'icon-marker bg-medium-gray'});
var darkBluePin = L.divIcon({className: 'icon-marker bg-dark-blue'});
var lightBluePin = L.divIcon({className: 'icon-marker bg-light-blue'});
var greyishBluePin = L.divIcon({className: 'icon-marker bg-greyish-blue'});
var bluePin = L.divIcon({className: 'icon-marker bg-blue'});
var orangePin = L.divIcon({className: 'icon-marker bg-orange'});
var blackPin = L.divIcon({className: 'icon-marker bg-black'});
var redPin = L.divIcon({className: 'icon-marker bg-red'});

class PositionRenderer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,  // is ctxMenu visible?
      selected_device_id : -1,
      isTerrain: false,
    }

    this._handleClick = this._handleClick.bind(this);
    this._handleMoveStart = this._handleMoveStart.bind(this);
    this._handleContextMenu = this._handleContextMenu.bind(this);
    this._handleTracking = this._handleTracking.bind(this);

    this.setTiles = this.setTiles.bind(this);
  }

  _handleTracking(device_id) {
    this.props.toggleTracking(device_id)

    // closing ctxMenu
    this.setState({ visible: false });
  }

  // context menu based at
  // https://codepen.io/devhamsters/pen/yMProm

  _handleClick(e) {
      const visible = this.state.visible;
      event = e.originalEvent;
      const wasOutside = !(event.target.contains === this.root);
      if (wasOutside && visible) this.setState({ visible: false });
  };

  _handleMoveStart() {
     const visible = this.state.visible;
     if (visible) this.setState({ visible: false, });
  };

  _handleContextMenu(e, device_id) {
    event = e.originalEvent;
    event.preventDefault();
    this.setState({ visible: true , selected_device_id: device_id});

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

  resize() {
    if (this.leafletMap !== undefined) {
      this.leafletMap.leafletElement.invalidateSize();
    }
  }

  // this has no counterpart in the frontend
  setTiles(isMap) {
    this.setState({isTerrain: isMap});
  }

  render() {
    function NoData() {
      return (
        <div className="full-height valign-wrapper background-info subtle relative graph">
          <div className="horizontal-center">
            <i className="material-icons">report_problem</i>
            <div>No position data available</div>
          </div>
        </div>
      )
    }

    function getPinColor(p) {
      if (p.sinr === undefined) {return grayPin;}
      if (p.sinr > 20){return darkBluePin;}
      if (p.sinr > 15){return lightBluePin;}
      if (p.sinr > 10){return greyishBluePin;}
      if (p.sinr > 5){return bluePin;}
      if (p.sinr > 2){return orangePin;}
      if (p.sinr > -1){return redPin;}
      if (p.sinr <= -1){return blackPin;}
    }

    let parsedEntries = this.props.devices.reduce((result, k) => {
      if ((k.position !== undefined) && (!k.hide)) {
        result.push({
          id:k.id,
          pos:k.position,
          pin:getPinColor(k),
          name: k.label,
          key: (k.unique_key ? k.unique_key : k.id)
        });
      }
      return result;
    }, []);


    if (parsedEntries.length == 0) {
      return (<NoData />);
    }

    const contextMenu = this.state.visible ? (
      <div ref={ref => {this.root = ref}} className="contextMenu">
          <Link to={"/device/id/" + this.state.selected_device_id + "/detail"} title="View details">
            <div className="contextMenu--option cmenu">
              <i className="fa fa-info-circle" />Details
            </div>
          </Link>
          <div className="contextMenu--option cmenu"
               onClick={() => {this._handleTracking(this.state.selected_device_id)}}>
            <img src='images/icons/location.png' />Toggle tracking
          </div>
      </div>
    ) : (
      null
    )

    const tileURL = this.state.isTerrain ? (
      'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY2ZyYW5jaXNjbyIsImEiOiJjajhrN3VlYmowYXNpMndzN2o2OWY1MGEwIn0.xPCJwpMTrID9uOgPGK8ntg'
    ) : (
      'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZm1lc3NpYXMiLCJhIjoiY2o4dnZ1ZHdhMWg5azMycDhncjdqMTg1eiJ9.Y75W4n6dTd9DOpctpizPrQ'
    )
    const attribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> and Mapbox contributors';

    return (
      <Map center={parsedEntries[0].pos}
           zoom={13}
           ref={m => {this.leafletMap = m;}}
           onContextMenu={this._handleClick}
          //  onClick={this._handleClick}
           onMoveStart={this._handleMoveStart}>
        <LayerBox> </LayerBox>
        {contextMenu}
        <ReactResizeDetector handleWidth onResize={this.resize.bind(this)} />
        <div className="mapOptions col s12">
          <div className="mapView" onClick = {() => this.setTiles(true)}>Terrain</div>
          <div className="satelliteView" onClick = {() => this.setTiles(false)}>Satellite</div>
        </div>
        <TileLayer url={tileURL} attribution={attribution} />
        <LayerAntenna />
        {parsedEntries.map((k) => {
          return (
            <Marker
              onContextMenu={(e) => { this._handleContextMenu(e, k.id); }}
              onClick={(e) => { this._handleContextMenu(e, k.id); }}
              position={k.pos} key={k.key} icon={k.pin}  >
              <Tooltip>
                <span>{k.id }: {k.name}</span>
              </Tooltip>
            </Marker>
        )})}
      </Map>
    )
  }
}

class LayerAntenna extends Component {
  constructor(props){
    super(props)
  }

  render(){

    var icon = L.icon({
      iconUrl:'images/antenna-24.png'
    });

    var antennaAlem = L.marker([-21.26114, -48.09203]);
    var antennaBarreiro = L.marker([-21.44663, -47.99272]);
    var antennaSantaLydia = L.marker([-21.24722, -47.88995]);

    return(
      <div className="col s12">
        <Marker position={antennaAlem._latlng} icon={icon}>
          <Tooltip>
            <span>Alem</span>
          </Tooltip>
        </Marker>
        <Marker position={antennaBarreiro._latlng} icon={icon}>
          <Tooltip>
            <span>Barreiro</span>
          </Tooltip>
        </Marker>
        <Marker position={antennaSantaLydia._latlng} icon={icon}>
          <Tooltip>
            <span>Santa Lydia</span>
          </Tooltip>
        </Marker>
      </div>
    )
  }
}

class LayerBox extends Component {
  constructor(props) {
    super(props);
    this.state = {visible:true};
    this.toggleLayer = this.toggleLayer.bind(this);
  }

  toggleLayer(event) {
    event.preventDefault()
    console.log("event",event);
    this.setState({visible:!this.state.visible});
  }

  render() {
    const layerMapBounds = L.latLngBounds([
        [-20.90974,-48.83651],
        [-21.80963,-47.11802]
    ]);

    const layerOpacity = 0.4;
    const imageoverlay = this.state.visible ? (
      <ImageOverlay
        opacity={layerOpacity}
        bounds={layerMapBounds}
        url='images/layers/files/Combined.png'
      /> ) : null

    return (
      <div className="col s12">
        <div className=" layer-div" onClick={(e) => this.toggleLayer(e)}>
          <img src='images/layers.png' />
        </div>
        {imageoverlay}
      </div>
    )
  }
}

class DeviceMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      displayMap:{},
      tracking: {}
    };

    this.toggleTracking = this.toggleTracking.bind(this);

    this.toggleDisplay = this.toggleDisplay.bind(this);
    this.setDisplay = this.setDisplay.bind(this);
    this.setDisplayMap = this.setDisplayMap.bind(this);
  }

  // TODO this could be its own component (filtering)
  shouldShow(device) {
    if (this.state.displayMap.hasOwnProperty(device)) {
      return this.state.displayMap[device];
    }

    return true;
  }

  toggleDisplay(device){
    let displayMap = this.state.displayMap;
    if (displayMap.hasOwnProperty(device)) {
      displayMap[device] = !displayMap[device];
    } else {
      displayMap[device] = false;
    }
    this.setState({displayMap: displayMap});
  }

  setDisplay(device, status) {
    let displayMap = this.state.displayMap;
    displayMap[device] = status;
    this.setState({displayMap: displayMap});
  }

  setDisplayMap(displayMap) {
    this.setState({displayMap: displayMap});
  }

  toggleTracking(device_id) {
    if (!this.props.tracking.hasOwnProperty(device_id)) {
      TrackingActions.fetch(device_id);
    } else {
      TrackingActions.dismiss(device_id);
    }
  }

  render() {
    let validDevices = 0;
    let validTracking = 0;
    let deviceList = [];
    let pointList = [];
    if ((this.props.devices !== undefined) && (this.props.devices !== null)) {
      for (let k in this.props.devices) {
        if (this.props.devices.hasOwnProperty(k)){
          let device = this.props.devices[k];
          device.hasPosition = device.hasOwnProperty('position');
          device.hide = !this.shouldShow(k);
          if (this.props.tracking.hasOwnProperty(k) && (!device.hide)) {
            validTracking++;
            pointList = pointList.concat(this.props.tracking[k].map((e,k) => {
              let updated = e;
              updated.id = device.id;
              updated.unique_key = device.id + "_" + k;
              updated.label = device.label;
              return updated;
            }));
          }
          if (device.hasPosition) {
            validDevices++;
          }
          pointList.push(device);
          deviceList.push(device);
        }
      }
    }

    const device_icon  = (<img src='images/icons/chip.png' />)
    const location_icon  = (<img src='images/icons/location.png' />)
    const location_active_icon  = (<img src='images/icons/location_active.png' />)

    let trackingText = "Tracking " + validTracking + " devices";
    if (validTracking == 0) {
      trackingText = "Tracking no devices";
    }

    const displayText = "Showing " + validDevices + " of " +
                        Object.keys(this.props.devices).length + " devices"

    return (
      <div className = "flex-wrapper">
        <SubHeader>
          <SubHeaderItem text={displayText} icon={device_icon} active='false' clickable='false' />
          <SubHeaderItem text={trackingText} icon={location_icon} active='false' clickable='false'  onClick='false'/>
          {this.props.toggle}
        </SubHeader>
        <div className="deviceMapCanvas deviceMapCanvas-map col m12 s12 relative">
          <PositionRenderer devices={pointList} toggleTracking={this.toggleTracking}/>
          <SideBar devices={this.props.devices} statusMap={this.state.displayMap}
                   toggleDisplay={this.toggleDisplay} setDisplayMap={this.setDisplayMap} />
        </div>
      </div>
    )
  }
}

export { DeviceMap, PositionRenderer };
