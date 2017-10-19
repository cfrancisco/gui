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

import { PageHeader } from "../../containers/full/PageHeader";

import AltContainer from 'alt-container';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link } from 'react-router'

import { LayerGroup, LayersControl, Map, TileLayer, Marker, Popup,Tooltip, Point } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { ImageOverlay , latLngBounds } from 'react-leaflet'

import ReactResizeDetector from 'react-resize-detector';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Toggle from 'material-ui/Toggle';

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
    }

    this._handleClick = this._handleClick.bind(this);
    this._handleMoveStart = this._handleMoveStart.bind(this);
    this._handleContextMenu = this._handleContextMenu.bind(this);
    this._handleTracking = this._handleTracking.bind(this);
  }

  _handleTracking() {
    const layer = this.state.layerLoaded;
    console.log("Layer: ",layer);
    this.setState({ layerLoaded: !layer, });
    console.log("request last hour from device: ",  this.state.selected_device_id);
  }
  // context menu based at
  // https://codepen.io/devhamsters/pen/yMProm

  _handleClick(e) {
      console.log("on click");
      const visible = this.state.visible;
      event = e.originalEvent;
      const wasOutside = !(event.target.contains === this.root);

      if (wasOutside && visible) this.setState({ visible: false, });
  };

  _handleMoveStart() {
     console.log("_handleMoveStart");
     const visible = this.state.visible;
     if (visible) this.setState({ visible: false, });
  };

  _handleContextMenu(e, device_id) {
    console.log("openContextMenu");

    event = e.originalEvent;
    event.preventDefault();
    console.log(e);

    console.log(device_id);
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

    function parsePosLatLng(p) {
      return [22.1,22.2];
    }

    function getPinColor(p) {
      return darkBluePin;
    }

    let deviceData = this.props.devices.devices;
    let parsedEntries = this.props.points.map((k) => {
      let pos = parsePosLatLng(k);
      if (pos !== null) {
        let pinIcon = getPinColor(k);
        return {id:k.id, pos:pos, pin:pinIcon, name: deviceData[k.id].label};
      }
      return undefined;
    });

    console.log('entries', parsedEntries);

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
        <Map center={[22,22]} zoom={13} ref={m => {this.leafletMap = m;}}   onContextMenu={this._handleClick}  onMoveStart={this._handleMoveStart}>
        <LayerBox> </LayerBox>
        {contextMenu}
        <ReactResizeDetector handleWidth onResize={this.resize.bind(this)} />
        <TileLayer
          url='https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY2ZyYW5jaXNjbyIsImEiOiJjajhrN3VlYmowYXNpMndzN2o2OWY1MGEwIn0.xPCJwpMTrID9uOgPGK8ntg'
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> and Mapbox contributors'
        />
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

class MapRender extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    console.log("maprender",this.props.device);
    if ((this.props.position != null) && ('name' in this.props.position)) {
      MeasureActions.fetchMeasures.defer(this.props.device.id, this.props.device.protocol, this.props.position);
    }
  }

  render () {
    return (
      <AltContainer stores={{measures: MeasureStore, devices: DeviceStore}}>
      <PositionRenderer points={this.props.devices}/>
      </AltContainer>
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
    console.log("toggling ")
    this.setState({visible:!this.state.visible});
  }

  render() {

    const layerMapBounds = L.latLngBounds([
        [-20.90974,-48.83651],
        [-21.80963,-47.11802]
    ]);
    const layerOpacity = 0.7;
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

function SubHeaderItem(props) {
  return (
    <div className={"box-sh-item" + (props.active === 'true' ? " active" : " inactive") }>
      <div className="icon">
      {props.icon}
      </div>
      <div className="text">
        {props.text}
      </div>
    </div>
  )
}

class DeviceList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isDisplayList: true,
      filter: '',
      showing_map: true,
    };

    this.handleViewChange = this.handleViewChange.bind(this);
    this.applyFiltering = this.applyFiltering.bind(this);
    this.checkingClick = this.checkingClick.bind(this);

  }

  checkingClick(event) {
    console.log("checkingClick");
  }

  handleViewChange(event) {
    this.setState({isDisplayList: ! this.state.isDisplayList})
  }

  toggleMaps(event, isInputChecked){
     console.log("isInputChecked",isInputChecked);
     this.setState({
       showing_map: isInputChecked,
     })

  }

  applyFiltering(deviceMap) {
    // turns the stored device map into a list
    let list = [];
    for (let k in deviceMap) {
      list.push(deviceMap[k]);
    }

    // TODO ordering should be defined by the user
    list.sort((a,b) => {
      if (a.updated > b.updated) {
        return 1;
      } else {
        return -1;
      }
    })

    return list;
  }

  render() {
    const filteredList = this.applyFiltering(this.props.devices);
    console.log('filteredList', filteredList);
    let positionList = filteredList.map((x) => {
      let positionAttr = x.attrs.find(function(k){return k.name == "lng";});
      console.log(positionAttr);
      // @TODO We should also check the lat param;
      if (positionAttr) {
           return {'id': x.id, 'geo': "lng", 'static': false};
        }
      return undefined;
    }).filter(function(k){return k != undefined;});
    // console.log("positionList",positionListPrev);
    // let positionList = positionListPrev.filter(function(k){return k != undefined;});
    console.log("positionList",positionList);

      // let positionAttr = x.static_attrs.filter(function(k){return k.type == "geo:point";});
      // if (positionAttr && positionAttr.length > 0) {
      //     return {'id': x.id, 'geo': positionAttr[0].name, 'static': true};
      // } else {
      //   positionAttr = x.attrs.filter(function(k){return k.type == "geo:point";});
      //   if (positionAttr && positionAttr.length > 0) {
      //     return {'id': x.id, 'geo': positionAttr[0].name, 'static': false};
      //   }
      // }
      // return {'id':'-1'};
    // for (var index in positionList){
    //     if (positionList[index].id == '-1')
    //         delete positionList[index];
    // }
    console.log('devices with geolocation: ',positionList);

    const device_icon  = (<img src='images/icons/chip.png' />)
    const location_icon  = (<img src='images/icons/location.png' />)
    const location_active_icon  = (<img src='images/icons/location_active.png' />)
    // const device_icon = (<i className={"fa fa-"+props.icon}/>)
    const map_toggle_icon  = (<img src='images/icons/pin.png' />)

    return (
      <div className = "flex-wrapper">
        <div className="row z-depth-2 devicesSubHeader" id="inner-header">
          <SubHeaderItem text={"Showing "+ filteredList.length + " devices "} icon={device_icon} active='false' clickable='false' />
          <SubHeaderItem text="No tracking actived" icon={location_icon} active='false' clickable='false'  onClick='false'/>
          <SubHeaderItem text="ID: XPTO" icon={location_active_icon} active='true' clickable='true'  onClick={this.checkingClick} />

          <div className="box-sh">
            <div className='toggle-icon'>
              {map_toggle_icon}
            </div>
            <div className='toggle-map'>
              <MuiThemeProvider>
                <Toggle label="" onToggle={this.toggleMaps}/>
              </MuiThemeProvider>
            </div>
            <div className='toggle-icon'>
              <img src='images/icons/grid.png'  />
            </div>
          </div>
        </div>
        <div className="deviceMapCanvas col m12 s12 relative">
          <MapRender devices={positionList} />
          <div className="col devicePainel full-height">
            <SideBar devices={this.props.devices} />
          </div>
        </div>
      </div>
    )
  }
}

class DeviceMap extends Component {

  constructor(props) {
    super(props);

    this.filterChange = this.filterChange.bind(this);
  }

  componentDidMount() {
    DeviceActions.fetchDevices.defer();
  }

  filterChange(newFilter) {
  }

  render() {
    const detail = ('detail' in this.props.location.query) ? this.props.location.query.detail : null;
    return (
      <ReactCSSTransitionGroup
        transitionName="first"
        transitionAppear={true}
        transitionAppearTimeout={500}
        transitionEnterTimeout={500}
        transitionLeaveTimeout={500} >
        <AltContainer store={DeviceStore}>
          <DeviceList deviceid={detail}/>
        </AltContainer>
      </ReactCSSTransitionGroup>
    );
  }
}

export { DeviceMap };
