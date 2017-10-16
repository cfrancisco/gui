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

import { PageHeader } from "../../containers/full/PageHeader";

import AltContainer from 'alt-container';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link } from 'react-router'

import { LayerGroup, LayersControl, Map, TileLayer, Marker, Popup,Tooltip, Point } from 'react-leaflet';
import { divIcon } from 'leaflet';
// import { kml} from '../../components/KML';
import { ImageOverlay , latLngBounds } from 'react-leaflet'

import ReactResizeDetector from 'react-resize-detector';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Toggle from 'material-ui/Toggle';

// var kmlLayer = new L.KML("images/layers/doc.kml", {async: true});
// console.log(kmlLayer);

// kmlLayer.on("loaded", function(e) {
			// map.fitBounds(e.target.getBounds());
		// });


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
    		console.log("this.leafletMap",this.leafletMap);
    		// this.leafletMap.addLayer(kmlLayer);
				// (this.props.layerGroup || this.props.map).addLayer(this.leafletElement);
			//  layerContainer
    		// this.leafletMap.addControl(new L.Control.Layers({}, {'Track':kmlLayer}));
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
      console.log("parsePosLatLng", p);
      // attrs
      // deviceData[p.id].attrs.filter(function(k){
      //     return k.name == 'lat';
      //   })[0].value;
      //
      // if (p.static) {
      //   return deviceData[p.id].static_attrs.filter(function(k){
      //       return k.name == p.geo;
      //     })[0].value;
      //
      // if (value === undefined) {
      //   return null;
      // }
      // let parsed = value.match(/^([+-]?\d+(\.\d+)?)\s*[,]\s*([+-]?\d+(\.\d+)?)$/)
      // if (parsed == null) {
      //   return null;
      // }
      // return [parseFloat(parsed[1]),parseFloat(parsed[3])];
      // return L.point(20, 20);
      return ['22.1','22.2'];
      //  return L.LatLng(22.1,22.2);
      //  return [51.505, -0.09];
    }
    //
    //
    // function parsePos(value) {
    //   if (value === undefined) {
    //     return null;
    //   }
    //
    //   let parsed = value.match(/^([+-]?\d+(\.\d+)?)\s*[,]\s*([+-]?\d+(\.\d+)?)$/)
    //   if (parsed == null) {
    //     return null;
    //   }
    //
    //   return [parseFloat(parsed[1]),parseFloat(parsed[3])];
    // }
    //
    // function getValue(p) {
    //   if (p.static) {
    //     return deviceData[p.id].static_attrs.filter(function(k){
    //         return k.name == p.geo;
    //       })[0].value;
    //   } else {
    //     // TODO
    //   }
    // }

    function getPinColor(p)
    {
      // TODO: check deviceData[p.id]
      return darkBluePin;
    }

    let deviceData = this.props.devices.devices;
    let parsedEntries = this.props.points.map((k) => {
      console.log("k value", k);
      console.log("deviceData[p.id]",deviceData[k.id]);
      // if (checkLatLng(k))
      // {
      let pos = parsePosLatLng(k);
      // }
      // else {
        // pos = parsePos(getValue(k));
      // }
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

      // className={this.state.layerLoaded ? 'w100' : 'w99'}
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
    const grid_toggle_icon  = (<img src='images/icons/grid.png'  />)

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
            {grid_toggle_icon}
           </div>

          </div>

          <div className="box-sh">
          <Link to="/device/new" title="Create a new device" className="waves-effect waves-light btn-flat">
            New Device
          </Link>
          </div>
        </div>

        <div className="deviceMapCanvas col m12 s12">
             <MapRender devices={positionList} />
          </div>
          <div className="col devicePainel">
            <SideBar devices={this.props.devices} />
           </div>
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




class SideBar extends Component {
  constructor(props){
    super(props);
    this.state = {
      click: null
    }

    this.changeSideBar = this.changeSideBar.bind(this);
  }

  changeSideBar(callback){
    if(callback){
      this.setState({click: this.setState.click});
    } else {
      this.setState({click: !this.setState.click});
    }

  }

  render(){
    return (
      <div className="col s3">
        {this.state.click ? (
          <Filter devices={this.props.devices} callback={this.changeSideBar}/>
        ) : (
          <List devices={this.props.devices} callback={this.changeSideBar}/>
        )}
      </div>
    )
  }
}


class List extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isDisplayList: true,
      filter: '',
      hide: false,
      changeSidebar: false

    };

    this.handleViewChange = this.handleViewChange.bind(this);
    this.applyFiltering = this.applyFiltering.bind(this);
    this.hideDevices = this.hideDevices.bind(this);
    this.showDevices = this.showDevices.bind(this);

    this.filterSidebar = this.filterSidebar.bind(this);

  }

  handleViewChange(event) {
    this.setState({isDisplayList: ! this.state.isDisplayList})
  }

  // handleSearchChange(event) {
  //   const filter = event.target.value;
  //   let state = this.state;
  //   state.filter = filter;
  //   state.detail = undefined;
  //   this.setState(state);
  // }

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

    // const filter = this.state.filter;
    // const idFilter = filter.match(/id:\W*([-a-fA-F0-9]+)\W?/);
    //
    // return deviceList.filter(function(e) {
    //   let result = false;
    //   if (idFilter && idFilter[1]) {
    //     result = result || e.id.toUpperCase().includes(idFilter[1].toUpperCase());
    //   }
    //
    //   return result || e.label.toUpperCase().includes(filter.toUpperCase());
    // });
  }

  hideDevices(event){
    if(this.state.hide == false){
      this.setState({hide: !this.state.hide});
    }
  }

  showDevices(event){
    if(this.state.hide == true){
      this.setState({hide: !this.state.hide});
    }
  }

  filterSidebar(event){
    this.props.callback(this.state.changeSidebar);
    //console.log("Filter");
  }

  render(){
    const filteredList = this.applyFiltering(this.props.devices);
    let hide = this.state.hide ? 'hide' : '';

    const showCanvas = 'deviceCanvas col s12 ' + hide;
    return (
      <span>
      <div className="row device-list">
        <div className="col s12 main-title center-align">Devices</div>
        <div className="col s12 info-header">
          <div className= "col s1 subtitle">{filteredList.length}</div>
          <div className= "col s5 title">Devices</div>
          <div className="col s6 device-list-actions">
            <div className="col s6 action-hide"><a className="waves-effect waves-light" onClick={this.hideDevices}>HIDE ALL</a></div>
            <div className="col s6 action-show"><a className="waves-effect waves-light" onClick={this.showDevices}>SHOW ALL</a></div>
          </div>
          <Link to="/device/new" title="Create a new device" className="waves-effect waves-light btn-flat hide">
            New Device
          </Link>
        </div>

        <div className={showCanvas}>
          {(filteredList.length > 0) ? (
            <ListRender devices={filteredList} loading={this.props.loading} deviceid={this.props.deviceid} />
          ) : (
            <div className="col s12 background-info">No configured devices</div>
          )}
        </div>
      </div>
      <div className="device-footer col s12">
        <div className="col s12 background-info">
          <a className="waves-effect waves-light" onClick={this.filterSidebar}>FILTERING</a>
        </div>
      </div>
      </span>
    )
  }
}

class Filter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      attribute: "Name",
      value: "",

      click: false,
      changeSidebar: true,
      isActiveMqtt: false,
      isActiveVirtual: false,
      isActiveCol: false,
      isActiveTrat: false,
      isActiveCam: false,

    };

    this.addFilter = this.addFilter.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.handleChangeAttribute = this.handleChangeAttribute.bind(this);
    this.handleChangeValue = this.handleChangeValue.bind(this);

    this.selectItemMqtt = this.selectItemMqtt.bind(this);
    this.selectItemVirtual = this.selectItemVirtual.bind(this);
    this.selectItemCol = this.selectItemCol.bind(this);
    this.selectItemTrat = this.selectItemTrat.bind(this);
    this.selectItemCam = this.selectItemCam.bind(this);

    this.devicesSidebar = this.devicesSidebar.bind(this);

  }

  selectItemMqtt(event){
    this.setState({isActiveMqtt: !this.state.isActiveMqtt});
  }

  selectItemVirtual(event){
    this.setState({isActiveVirtual: !this.state.isActiveVirtual});
  }

  selectItemCol(event){
    this.setState({isActiveCol: !this.state.isActiveCol});
  }

  selectItemTrat(event){
    this.setState({isActiveTrat: !this.state.isActiveTrat});
  }

  selectItemCam(event){
    this.setState({isActiveCam: !this.state.isActiveCam});
  }

  handleChangeAttribute(event){
    this.setState({attribute: event.target.value});
  }

  handleChangeValue(event){
    this.setState({value: event.target.value});
  }

  addFilter(event){
    if(this.state.click == false){
      event.preventDefault();
      this.setState({click: !this.state.click});
    }
  }

  clearSearch(event){
    if(this.state.click == true){
      event.preventDefault();
      this.setState({click: !this.state.click});
      this.setState({attribute: "Name"});
      this.setState({value: ""});
    }

    if(this.state.isActiveMqtt){
      this.setState({isActiveMqtt: !this.state.isActiveMqtt});
    }

    if(this.state.isActiveVirtual){
      this.setState({isActiveVirtual: !this.state.isActiveVirtual});
    }

    if(this.state.isActiveCol){
      this.setState({isActiveCol: !this.state.isActiveCol});
    }

    if(this.state.isActiveTrat){
      this.setState({isActiveTrat: !this.state.isActiveTrat});
    }

    if(this.state.isActiveCam){
      this.setState({isActiveCam: !this.state.isActiveCam});
    }
  }

  devicesSidebar(event){
    this.props.callback(this.state.changeSidebar);
  }

  render(){
    let click = this.state.click ? true : false;

    let searchAttribute = this.state.attribute;
    let searchValue = this.state.value;

    let isActiveMqtt = this.state.isActiveMqtt ? "active" : "";
    let isActiveVirtual = this.state.isActiveVirtual ? "active" : "";
    let isActiveCol = this.state.isActiveCol ? "active" : "";
    let isActiveTrat = this.state.isActiveTrat ? "active" : "";
    let isActiveCam = this.state.isActiveCam ? "active" : "";

    return (
      <div className="row device-filtering">
        <div className="filter-header">
          <div className="label center-align">FILTERING</div>
        </div>
          <div className="filter-devices-info col s12">
            <div className = "protocol col s12">
              <div className="label">PROTOCOL</div>

                <div className={"protocols-mqtt col s6 " + isActiveMqtt} onClick={this.selectItemMqtt}>
                  <a className="waves-effect waves-light"><div className="label-mqtt">MQTT</div></a>
                </div>
                <div className={"protocols-virtual col s6 " + isActiveVirtual} onClick={this.selectItemVirtual} >
                  <a className="waves-effect waves-light"><div className="label-virtual">Virtual</div></a>
                </div>
            </div>

            <div className="type col s12">
              <div className="label col s12">TYPE</div>
              <div className={"types-col col s4 " + isActiveCol} onClick={this.selectItemCol}>
                <a className="waves-effect waves-light"><div className="label-col">Col</div></a>
              </div>
              <div className={"types-trat col s4 " + isActiveTrat} onClick={this.selectItemTrat}>
                <a className="waves-effect waves-light"><div className="label-trat">Trat</div></a>
              </div>
              <div className={"types-cam col s4 " + isActiveCam} onClick={this.selectItemCam}>
                <a className="waves-effect waves-light"><div className="label-cam">Cam</div></a>
              </div>
            </div>
          </div>

        <div className="filter-devices-search">
          <div className="label center-align">SEARCH BY</div>
          <div className="row">
            <form className="col s12" onSubmit={this.addFilter}>
              <div className="col s12">
                <div className="input-field col s5">
                  <MaterialSelect id="attributes-select" name="attribute" value={this.state.attribute} onChange={this.handleChangeAttribute} >
                    <option value="Name">Name</option>
                    <option value="ID">ID</option>
                    <option value="Protocol">Protocol</option>
                    <option value="Tags">Tags</option>
                    <option value="Status">Status</option>
                  </MaterialSelect>
                  <label>Attribute</label>
                </div>
                <div className="input-field col s5">
                  <input id="value" type="text" className="validate" name="value" value={this.state.value} onChange={this.handleChangeValue}/>
                  <br />
                  <label>Value</label>
                </div>
                <div className="btn-plus col s2">
                  <a className="waves-circle waves-effect waves-light" onClick={this.addFilter}><i className="fa fa-plus"></i></a>
                </div>
              </div>
              {click ? (
                <FieldSearchValues attribute={this.state.attribute} value={this.state.value}/>
              ):(
                <div className="search-value col s12 offset-s1">
                </div>
              )}
              <div className="actions-buttons">
                <div className="col s6 button">
                  <a className="waves-effect waves-light btn" id="btn-clear" tabIndex="-1" title="Clear" onClick={this.clearSearch}>
                    Clear
                  </a>
                </div>

                <div className="col s6 button" type="submit">
                  <a className="waves-effect waves-light btn" id="btn-search" tabIndex="-1" title="Search">
                    <i className="clickable fa fa-search"/>
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div className="filter-devices-footer">
          <div className="col s12 background-info">
            <a className="waves-effect waves-light" onClick={this.devicesSidebar}>DEVICES</a>
          </div>
        </div>
      </div>
    )
  }
}

class FieldSearchValues extends Component {
  render(){
    return(
      <div className="search-value col s12 offset-s1">
        <div className="truncate"><div className="attribute">{this.props.attribute}</div> : <div className="value">{this.props.value}</div></div>
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
