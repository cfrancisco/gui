import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import deviceManager from '../../comms/devices/DeviceManager';

import util from "../../comms/util/util";
import DeviceStore from '../../stores/DeviceStore';
import DeviceActions from '../../actions/DeviceActions';
import TemplateStore from '../../stores/TemplateStore';
import TemplateActions from '../../actions/TemplateActions';
import MeasureStore from '../../stores/MeasureStore';
import MeasureActions from '../../actions/MeasureActions';

import { PageHeader } from "../../containers/full/PageHeader";

import AltContainer from 'alt-container';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import MaterialSelect from "../../components/MaterialSelect";
import MaterialInput from "../../components/MaterialInput";
import { Link } from 'react-router'

import { Line } from 'react-chartjs-2';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';

import ReactResizeDetector from 'react-resize-detector';


class SummaryItem extends Component{
  constructor(props){
    super(props);
    this.state = {
      click: true
    }

    this.hideDevice = this.hideDevice.bind(this);
  }

  hideDevice(event){
    if(this.state.click == true){
      this.setState({click: !this.state.click});
    } else {
      this.setState({click: !this.state.click});
    }
  }

  render(){
    let attrs = 0;
    const selectedClass = "lst-entry" + (this.props.isActive ? " active" : "");
    const name = this.props.device.label;

    if (this.props.device.attrs) attrs += this.props.device.attrs.length
    if (this.props.device.static_attrs) attrs += this.props.device.static_attrs.length

    let showOrHideDevice = this.state.click ? "fa fa-eye" : "fa fa-eye-slash";

    return(
      <div className="lst-entry-title col s12" title="See details">
        <div className="waves-effect waves-light">
          <div className="img col s3" id="img-chip">
            <img src="images/chip.png" />
          </div>
            <div className="user-label truncate col s6">{name}</div>
            <div className="label col s6">RSSI 70%</div> {/*Fixe RSSI*/}
            <div className="col s3 img" id="device-view">
              <a className="waves-effect waves-light" onClick={this.hideDevice}><i className={showOrHideDevice} aria-hidden="true"></i></a>
            </div>
        </div>
      </div>
    )
  }
}

class ListItem extends Component {
  constructor(props) {
    super(props);

    this.handleDetail = this.handleDetail.bind(this);
    this.handleDismiss = this.handleDismiss.bind(this);
  }

  handleDetail(e) {
    e.preventDefault();
    this.props.setDetail(this.props.device.id);
  }

  handleDismiss(e) {
    if (e) {
      e.preventDefault();
    }
    this.props.setDetail(null);
  }

  render() {
    const detail = this.props.detail
    return (
      <div className="lst-entry col s12" id={this.props.device.id} >
        <SummaryItem device={this.props.device}/>
      </div>
    )

  }
}

class ListRender extends Component {
  constructor(props) {
    super(props);

    this.state = {detail: props.deviceid};
    this.setDetail = this.setDetail.bind(this);
  }

  setDetail(id) {
    this.setState({detail: id});
  }

  render() {
    if (this.props.loading) {
      return (
        <div className="background-info valign-wrapper full-height">
          <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center"/>
        </div>
      )
    }

    // handles reordering of cards to keep horizontal alignment
    const target = this.state.detail;
    const horSize = 3;
    let display_list = JSON.parse(JSON.stringify(this.props.devices));
    display_list.move = function(from, to) {
      this.splice(to, 0, this.splice(from, 1)[0]);
    }
    if (target != null) {
      for (let i = 0; i < display_list.length; i++) {
        if (display_list[i].id == target) {
          display_list.move(i,i - (i % horSize));
          break;
        }
      }
    }

    if (display_list.length > 0) {
      return (
        <div className="row">
          <div className="col s12 lst-wrapper">

            { display_list.map((device, idx) =>
              <ListItem device={device} key={device.id}
                detail={device.id === this.state.detail}
                setDetail={this.setDetail}
              />
            )}
          </div>
        </div>
      )
    } else {
      return  (
        <div className="background-info valign-wrapper full-height">
          <span className="horizontal-center">No configured devices</span>
        </div>
      )
    }
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

class Devices extends Component {

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
    //let hide = this.state.hide ? true : false;
    return (
      <ReactCSSTransitionGroup
        transitionName="first"
        transitionAppear={true}
        transitionAppearTimeout={500}
        transitionEnterTimeout={500}
        transitionLeaveTimeout={500} >
        <PageHeader title="device manager" subtitle="Devices" shadow='true'>
          {/* <Filter onChange={this.filterChange} /> */}
          {/*<Link to="/device/new" title="Create a new device" className="btn-item btn-floating waves-effect waves-light cyan darken-2">
            <i className="fa fa-plus"/>
          </Link> */}
        </PageHeader>
        <AltContainer store={DeviceStore}>
          {/*<DeviceList deviceid={detail}/>*/}
          <SideBar />
          {/*<List />*/}
          {/*<Filter />*/}

        </AltContainer>
        {/* <NewDevice /> */}
      </ReactCSSTransitionGroup>
    );
  }
}

export { Devices, SideBar };
