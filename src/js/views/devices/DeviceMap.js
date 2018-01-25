import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import deviceManager from '../../comms/devices/DeviceManager';

import util from "../../comms/util/util";
import SideBar from "../../components/DeviceFilterMenu";
import {SubHeader, SubHeaderItem} from "../../components/SubHeader";
import { PageHeader } from "../../containers/full/PageHeader";

import TrackingActions from '../../actions/TrackingActions';
import MeasureActions from '../../actions/MeasureActions';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link } from 'react-router'

import { LayerGroup, LayersControl, Map, TileLayer, Marker, Popup,Tooltip, Point } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { ImageOverlay , latLngBounds, ScaleControl } from 'react-leaflet'
import ReactResizeDetector from 'react-resize-detector';

import io from 'socket.io-client';

import Script from 'react-load-script';

var offlinePin = L.divIcon({className: 'icon-marker bg-true-black'});
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
      center: (this.props.center ? this.props.center : [-21.277057924195354, -47.9590129852295]),
      zoom: (this.props.zoom ? this.props.zoom : 13)
    }

    this._handleClick = this._handleClick.bind(this);
    this._handleMoveStart = this._handleMoveStart.bind(this);
    this._handleContextMenu = this._handleContextMenu.bind(this);
    this._handleTracking = this._handleTracking.bind(this);
    this._handleViewPortChange = this._handleViewPortChange.bind(this);

    // this.setTiles = this.setTiles.bind(this);
  }

  _handleTracking(device_id) {
    this.props.toggleTracking(device_id)

    // closing ctxMenu
    this.setState({ visible: false });
  }

  // context menu based at
  // https://codepen.io/devhamsters/pen/yMProm

  _handleClick(e) {
      if (!this.props.allowContextMenu){
        return false;
      }
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
    if (!this.props.allowContextMenu){
      return false;
    }
    let event = e.originalEvent;
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

  _handleViewPortChange(e) {
    this.setState({center: e.center, zoom: e.zoom});
  }

  resize() {
    if (this.leafletMap !== undefined) {
      this.leafletMap.leafletElement.invalidateSize();
    }
  }

  // this has no counterpart in the frontend
  // setTiles(isMap) {
  //   this.setState({isTerrain: isMap});
  // }

  componentDidMount() {
    if (this.leafletMap !== undefined) {

      console.log('will attempt to add layer', MQ.mapLayer, this.leafletMap);
      // mq = require('..//../external/mq-map.js');

      let mapLayer = MQ.mapLayer();
      mapLayer.addTo(this.leafletMap.leafletElement);

      L.control.layers({
        'Map': MQ.mapLayer(),
        'Hibrid': MQ.hybridLayer(),
        'Satellite': MQ.satelliteLayer()
      }).addTo(this.leafletMap.leafletElement);
    }
  }

  render() {

    console.log('will render renderer');
    function getPinColor(p) {
      if (p.status === "offline") {return offlinePin;}
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

    // const tileURL = this.state.isTerrain ? (
    //   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    // ) : (
    //   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    // )
    // const attribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> and Mapbox contributors';

    return (
      <Map center={this.state.center}
           zoom={this.state.zoom}
           maxZoom={17}
           ref={m => {this.leafletMap = m;}}
           doubleClickZoom={false}
           onContextMenu={this._handleClick}
          //  onClick={this._handleClick}
           onViewportChanged={this._handleViewPortChange}
           onMoveStart={this._handleMoveStart}>
        <LayerBox> </LayerBox>
        {contextMenu}
        <ReactResizeDetector handleWidth onResize={this.resize.bind(this)} />
        {/* <div className="mapOptions col s12">
          <div className="mapView" onClick = {() => this.setTiles(true)}>Terrain</div>
          <div className="satelliteView" onClick = {() => this.setTiles(false)}>Satellite</div>
        </div> */}
        {/* <TileLayer url={tileURL} /> */}
        {/* <TileLayer url={tileURL} attribution={attribution} /> */}
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
        <ScaleControl />
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
    this.state = {visible:false, showCoverageMap: false, opacity: 0.4};
    this.toggleLayer = this.toggleLayer.bind(this);

    this.showCoverageMap = this.showCoverageMap.bind(this);
    this.receiveOpacity = this.receiveOpacity.bind(this);
  }

  toggleLayer(e) {
    e.preventDefault();
    this.setState({visible:!this.state.visible});
    this.setState({opacity:this.state.opacity});
  }

  showCoverageMap(condition){
    this.setState({showCoverageMap: condition});
  }

  receiveOpacity(opacity){
    this.setState({opacity:opacity});
  }

  render() {
    const layerMapBounds = L.latLngBounds([
        [-20.90974,-48.83651],
        [-21.80963,-47.11802]
    ]);


    const layerOpacity = parseFloat(this.state.opacity);

    const coverage = this.state.visible ? (
      <Coverage showCoverageMap={this.showCoverageMap} receiveOpacity={this.receiveOpacity}
      opacity={this.state.opacity} checked={this.state.showCoverageMap} />
    ) : null

    return (
      <div className="col s12">
        <div className=" layer-div" onClick={this.toggleLayer}>
          <img src='images/layers.png' />
        </div>
        {this.state.showCoverageMap ? (
          <ImageOverlay
            opacity={layerOpacity}
            bounds={layerMapBounds}
            url='images/layers/files/Combined.png'
          />
        ) : null}
        {coverage}
      </div>
    )
  }
}

class Coverage extends Component{
  constructor(props){
    super(props);
    this.state = {showCoverage:true}

    this.setCoverage = this.setCoverage.bind(this);
    this.updateOpacity = this.updateOpacity.bind(this);

  }

  setCoverage(event){
    event.preventDefault();
    this.setState({showCoverage: !this.state.showCoverage});
    this.props.showCoverageMap(this.state.showCoverage);
  }

  updateOpacity(event){
    this.props.receiveOpacity(event.target.value);
  }


  render(){
    return(
      <form className="selectCoverage">
        <label className="label">Coverage Map:</label>
        <p id="hideCoverage" onClick={this.setCoverage}>
          <input type="checkbox" checked={this.props.checked} />
          <label>Show coverage map</label>
        </p>

        <div className="opacity">
          <label className="labelOpacity">Opacity:</label>
            <p className="range-field">
              <input type="range" min="0.1" max="1" step="0.1" defaultValue={this.props.opacity} onChange={this.updateOpacity} />
            </p>
        </div>
      </form>
    )
  }
}


class DeviceMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      displayMap:{},
      tracking: {},
      mapquest: false
    };

    this.toggleTracking = this.toggleTracking.bind(this);
    this.hideAll = this.hideAll.bind(this);
    this.showAll = this.showAll.bind(this);
    this.toggleDisplay = this.toggleDisplay.bind(this);
    this.setDisplay = this.setDisplay.bind(this);
    this.setDisplayMap = this.setDisplayMap.bind(this);

    this.mqLoaded = this.mqLoaded.bind(this);
  }

  mqLoaded() {
    console.log('loaded returned');
    this.setState({mapquest: true});
  }

  setOpacity(value){
    this.setState({opacity: value});
  }

  // TODO this could be its own component (filtering)
  shouldShow(device) {
    if (this.state.displayMap.hasOwnProperty(device)) {
      return this.state.displayMap[device];
    }

    return true;
  }

  showAll()
  {
    let displayMap = this.state.displayMap;
    for (let k in this.props.devices){
      let device = this.props.devices[k];
      displayMap[device.id] = true;
    }
    this.setState({displayMap: displayMap});
  }

  hideAll()
  {
    let displayMap = this.state.displayMap;
    for (let k in this.props.devices){
      let device = this.props.devices[k];
      displayMap[device.id] = false;
    }
    this.setState({displayMap: displayMap});
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

  componentDidMount() {
    const options = {
      transports: ['websocket']
    }
    this.io = io(window.location.host, options);
    this.io.on('gps', function(data) {
      data.position = [data.lat, data.lng]
      delete data.lat;
      delete data.lng;
      MeasureActions.updatePosition(data);
    });
  }

  componentWillUnmount() {
    this.io.close();
  }

  render() {
    console.log('will render device map', this.state.mapquest);
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
          if (device.hasPosition && (!device.hide)) {
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

    console.log(this.state.mapquest);
    return (
      <div className = "flex-wrapper">
        <SubHeader>
          <SubHeaderItem text={displayText} icon={device_icon} active='false' clickable='false' />
          <SubHeaderItem text={trackingText} icon={location_icon} active='false' clickable='false'  onClick='false'/>
          {this.props.toggle}
        </SubHeader>
        <div className="deviceMapCanvas deviceMapCanvas-map col m12 s12 relative">
          <Script url="https://www.mapquestapi.com/sdk/leaflet/v2.s/mq-map.js?key=zvpeonXbjGkoRqVMtyQYCGVn4JQG8rd9"
                  onLoad={this.mqLoaded}>
          </Script>
          {this.state.mapquest ? (
            <PositionRenderer devices={pointList} toggleTracking={this.toggleTracking} opacity={this.state.opacity} allowContextMenu={true}/>
          ) : (
            null
          )}
          <SideBar devices={this.props.devices} statusMap={this.state.displayMap}
                   toggleDisplay={this.toggleDisplay} setDisplayMap={this.setDisplayMap} hideAll={this.hideAll} showAll={this.showAll} />
        </div>
      </div>
    )
  }
}

export { DeviceMap, PositionRenderer };
