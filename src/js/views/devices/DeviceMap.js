import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import deviceManager from '../../comms/devices/DeviceManager';

import util from "../../comms/util/util";
import DeviceStore from '../../stores/DeviceStore';
import DeviceActions from '../../actions/DeviceActions';
import TemplateStore from '../../stores/TemplateStore';
import TemplateActions from '../../actions/TemplateActions';
import MeasureActions from '../../actions/MeasureActions';
import MeasureStore from '../../stores/MeasureStore';
import SideBar from "../../components/DeviceFilterMenu";
import {SubHeader, SubHeaderItem} from "../../components/SubHeader";

import { PageHeader } from "../../containers/full/PageHeader";

import AltContainer from 'alt-container';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link } from 'react-router'

import { LayerGroup, LayersControl, Map, TileLayer, Marker, Popup,Tooltip, Point } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { ImageOverlay , latLngBounds } from 'react-leaflet'

import ReactResizeDetector from 'react-resize-detector';

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
      layerLoaded: false,
      visible: false,
      selected_device_id : -1,
      isTerrain: false,
    }

    this._handleClick = this._handleClick.bind(this);
    this._handleMoveStart = this._handleMoveStart.bind(this);
    this._handleContextMenu = this._handleContextMenu.bind(this);
    this._handleTracking = this._handleTracking.bind(this);

    this.setTiles = this.setTiles.bind(this);
  }

  _handleTracking() {
    const layer = this.state.layerLoaded;
    this.setState({ layerLoaded: !layer, });
  }
  // context menu based at
  // https://codepen.io/devhamsters/pen/yMProm

  _handleClick(e) {
      const visible = this.state.visible;
      event = e.originalEvent;
      const wasOutside = !(event.target.contains === this.root);

      if (wasOutside && visible) this.setState({ visible: false, });
  };

  _handleMoveStart() {
     const visible = this.state.visible;
     if (visible) this.setState({ visible: false, });
  };

  _handleContextMenu(e, device_id) {

    event = e.originalEvent;
    event.preventDefault();

    this.setState({ visible: true , selected_device_id: parseInt(device_id)});

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
      return darkBluePin;
    }

    let parsedEntries = this.props.devices.reduce((result, k) => {
      if (k.position !== undefined) {
        result.push({id:k.id, pos:k.position, pin:getPinColor(k), name: k.label});
      }
      return result;
    }, []);


    if (parsedEntries.length == 0) {
      return (<NoData />);
    }
    const contextMenu = this.state.visible ? (
      <div ref={ref => {this.root = ref}} className="contextMenu">
          <div className="contextMenu--option">State : </div>
          <div className="contextMenu--separator" />
          <Link to={"/device/id/" + this.state.selected_device_id + "/detail"} title="View details">
            <div className="contextMenu--option"><i className="fa fa-fa-info-circle" />Details</div>
          </Link>
          <div className="contextMenu--option"  onClick={this._handleTracking}><i className="fa fa-compass" />Tracking</div>
      </div>
    ) : null

    return (
      <Map center={parsedEntries[0].pos} zoom={13} ref={m => {this.leafletMap = m;}}   onContextMenu={this._handleClick}  onMoveStart={this._handleMoveStart}>
        <LayerBox> </LayerBox>
        {contextMenu}
        <ReactResizeDetector handleWidth onResize={this.resize.bind(this)} />
        <div className="mapOptions col s12">
          <div className="mapView" onClick = {() => this.setTiles(true)}>Terrain</div>
          <div className="satelliteView" onClick = {() => this.setTiles(false)}>Satellite</div>
        </div>
        {this.state.isTerrain ? (
          <TileLayer url = 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY2ZyYW5jaXNjbyIsImEiOiJjajhrN3VlYmowYXNpMndzN2o2OWY1MGEwIn0.xPCJwpMTrID9uOgPGK8ntg'
          attribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> and Mapbox contributors'/>
        ) : (
          <TileLayer url = 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZm1lc3NpYXMiLCJhIjoiY2o4dnZ1ZHdhMWg5azMycDhncjdqMTg1eiJ9.Y75W4n6dTd9DOpctpizPrQ'
          attribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> and Mapbox contributors' />
        )}

        {parsedEntries.map((k) => (
          <Marker
           onContextMenu={(e) => { this._handleContextMenu(e, k.id); }}
           position={k.pos} key={k.id} icon={k.pin}  >
          <Tooltip>
            <span>
             {k.id }: {k.name}
            </span>
          </Tooltip>
          </Marker>
        ))}
      </Map>
    )
  }
}

class LayerBox extends Component {
  constructor(props) {
    super(props);
    this.state = {visible:true};
    this.toggleLayer = this.toggleLayer.bind(this);
  }

  toggleLayer() {
    this.setState({visible:!this.state.visible});
  }

  render() {

    const layerMapBounds = L.latLngBounds([
        [-20.90974,-48.83651],
        [-21.80963,-47.11802]
    ]);

    const layerOpacity = 0.3;
    const imageoverlay = this.state.visible ? (
      <ImageOverlay
        opacity={layerOpacity}
        bounds={layerMapBounds}
        url='images/layers/files/Combined.png'
      /> ) : null

    return (
      <div className="col s12">
        <div className="layer-div" onClick={this.toggleLayer}>
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

    this.checkingClick = this.checkingClick.bind(this);
  }

  checkingClick(event) {
  }

  render() {
    // TODO refactor this away
    let filteredList = []
    if ((this.props.devices !== undefined) && (this.props.devices !== null)) {
      for (let k in this.props.devices) {
        if (this.props.devices.hasOwnProperty(k)){
          filteredList.push(this.props.devices[k]);
        }
      }
    }

    const device_icon  = (<img src='images/icons/chip.png' />)
    const location_icon  = (<img src='images/icons/location.png' />)
    const location_active_icon  = (<img src='images/icons/location_active.png' />)

    return (
      <div className = "flex-wrapper">
        <SubHeader>
          <SubHeaderItem text={"Showing "+ filteredList.length + " devices "} icon={device_icon} active='false' clickable='false' />
          <SubHeaderItem text="No tracking actived" icon={location_icon} active='false' clickable='false'  onClick='false'/>
          <SubHeaderItem text="ID: XPTO" icon={location_active_icon} active='true' clickable='true'  onClick={this.checkingClick} />
          {this.props.toggle}
        </SubHeader>
        <div className="deviceMapCanvas col m12 s12 relative">
          <PositionRenderer devices={filteredList} />
          <SideBar devices={this.props.devices} />
        </div>
      </div>
    )
  }
}

export { DeviceMap };
