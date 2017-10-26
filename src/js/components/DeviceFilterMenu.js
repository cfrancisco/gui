import React, { Component } from 'react';
import MaterialSelect from "../components/MaterialSelect";

class ListItem extends Component {
  constructor(props){
    super(props);
    this.state = { click: true }
    this.hideDevice = this.hideDevice.bind(this);
    this.parseState = this.parseState.bind(this);
  }

  hideDevice(event){
    this.props.toggleDisplay(this.props.device.id);
  }

  parseState() {
    if (this.props.device.hasOwnProperty('hasPosition')) {
      if (this.props.device.hasPosition == false) {
        return "fa fa-eye-slash";
      }
    }

    if (this.props.displayMap.hasOwnProperty(this.props.device.id)) {
      if (this.props.displayMap[this.props.device.id] == false){
        return "fa fa-eye-slash";
      }
    }

    return "fa fa-eye"
  }

  render() {
    const name = this.props.device.label;
    const attrValue = this.props.device.rssi ? this.props.device.rssi : "unknown"

    return (
      <div className="lst-entry-title col s12" id={this.props.device.id} title="See details">
        <div className="img col s3" id="img-chip">
          <img src="images/chip.png" />
        </div>
        <div className="user-label truncate col s6">{name}</div>
        <div className="label col s6">RSSI {attrValue}</div>
        <div className="col s3 img" id="device-view">
          <a className="" onClick={this.hideDevice}>
            <i className={this.parseState()} aria-hidden="true" />
          </a>
        </div>
      </div>
    )
  }
}

class ListRender extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.loading) {
      return (
        <div className="background-info valign-wrapper full-height">
          <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center"/>
        </div>
      )
    }

    const devices = this.props.devices;
    if ((devices.length > 0) && (devices.constructor == Array)){
      return (
        <div className="row">
          { devices.map((device, idx) =>
            <ListItem device={device} key={device.id}
                      toggleDisplay={this.props.toggleDisplay}
                      displayMap={this.props.displayMap} />
          )}
        </div>
      )
    } else if ((Object.keys(devices).length > 0) && (devices.constructor == Object)) {
      return (
        <div className="row">
          { Object.keys(devices).map((device_id) =>
            <ListItem device={devices[device_id]}
                      key={device_id}
                      toggleDisplay={this.props.toggleDisplay}
                      displayMap={this.props.displayMap} />
          )}
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
    this.hideDevices = this.hideDevices.bind(this);
    this.showDevices = this.showDevices.bind(this);
  }

  hideDevices(event) {
    this.props.hideAll();
  }

  showDevices(event) {
    this.props.showAll();
  }

  render(){
    return (
      <div className="list-of-devices">
        <div className="row device-list">
          <div className="col s12 main-title center-align">Devices</div>
          <div className="col s12 info-header">
            <div className= "col s1 subtitle">{this.props.devices.length}</div>
            <div className= "col s5 title">Devices</div>
            <div className="col s6 device-list-actions">
              <div className="col s6 action-hide">
                <a className="waves-effect waves-light" onClick={this.hideDevices}>HIDE ALL</a>
              </div>
              <div className="col s6 action-show">
                <a className="waves-effect waves-light" onClick={this.showDevices}>SHOW ALL</a>
              </div>
            </div>
          </div>
          <div className="deviceCanvas col s12">
            <ListRender devices={this.props.devices}
                        loading={this.props.loading}
                        deviceid={this.props.deviceid}
                        toggleDisplay={this.props.toggleDisplay}
                        displayMap={this.props.displayMap} />
          </div>
        </div>
      </div>
    )
  }
}

class FieldSearchValues extends Component {
  render() {
    return(
      <div className="search-value col s12 offset-s1">
        <div className="truncate">
          <div className="attribute">{this.props.attribute}</div> : <div className="value">{this.props.value}</div>
        </div>
      </div>
    )
  }
}

function ToggleChip(props) {
  const activeClass = props.active ? "active" : "";
  return (
    <div className={"filter-btn col s6 " + activeClass} onClick={props.onClick}>
      <div className="filter-label">{props.label}</div>
    </div>
  )
}

class Filter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: ["col", "trat", "cam", "ant","MQTT", "virtual"],
    };

    this.isActive = this.isActive.bind(this);
    this.toggleState = this.toggleState.bind(this);
  }

  isActive(search) {
    return this.state.query.find((e) => {return e.toUpperCase() == search.toUpperCase();});
  }

  toggleState(entry) {
    let idx = this.state.query.findIndex((e) => {return e.toUpperCase() == entry.toUpperCase();});
    let updated = this.state.query;
    if (idx !== -1) {
      updated.splice(idx, 1);
    } else {
      updated.push(entry);
    }

    this.setState({query: updated});

    let reStr = "";
    for (let i = 0; i < updated.length; i++){
      reStr = reStr + updated[i].toUpperCase();
      if (i !== updated.length - 1) {
        reStr = reStr + "|";
      }
    }

    let re = new RegExp(reStr);
    let displayMap = {}
    for (let k in this.props.devices) {
      if (this.props.devices.hasOwnProperty(k)) {
        if (updated.length == 0) {
          displayMap[k] = false;
        } else {
          displayMap[k] = (this.props.devices[k].label.match(re) !== null) &&
                          (this.props.devices[k].protocol.match(re) !== null);
        }
      }
    }

    this.props.setDisplayMap(displayMap);
  }

  render(){
    return (
      <div className="device-filtering full-height">
        <div className="filter-header">
          <div className="label center-align">FILTERING</div>
        </div>
        <div className="filter-devices-info col s12">
          <div className="protocol col s12">
            <div className="label">PROTOCOL</div>
            <ToggleChip active={this.isActive('MQTT')} onClick={() => {this.toggleState('MQTT')}} label="MQTT" />
            <ToggleChip active={this.isActive("Virtual")} onClick={() => {this.toggleState("Virtual")}} label="Virtual" />
          </div>
          <div className="protocol col s12">
            <div className="label col s12">TYPE</div>
            <ToggleChip active={this.isActive("COL")} onClick={() => {this.toggleState("COL")}} label="COL" />
            <ToggleChip active={this.isActive("TRAT")} onClick={() => {this.toggleState("TRAT")}} label="TRAT" />
            <ToggleChip active={this.isActive("CAM")} onClick={() => {this.toggleState("CAM")}} label="CAM" />
            <ToggleChip active={this.isActive("ANT")} onClick={() => {this.toggleState("ANT")}} label="ANT" />
          </div>
        </div>
        {/*
          Backend is not handling those as well as it should.
          <div className="filter-devices-search">
            <div className="label center-align">SEARCH BY</div>
            <form className="col s12 row" onSubmit={this.addFilter}>
              <div className="col s12">
                <div className="input-field col s5">
                  <MaterialSelect id="attributes-select" name="attribute" value={this.state.attribute}
                                  onChange={this.handleChangeAttribute}>
                    <option value="Name">Name</option>
                    <option value="ID">ID</option>
                    <option value="Protocol">Protocol</option>
                    <option value="Tags">Tags</option>
                    <option value="Status">Status</option>
                  </MaterialSelect>
                  <label>Attribute</label>
                </div>
                <div className="input-field col s5">
                  <input id="value" type="text" className="validate" name="value"
                         value={this.state.value} onChange={this.handleChangeValue}/>
                  <br/>
                  <label>Value</label>
                </div>
                <div className="btn-plus col s2" onClick={this.addFilter}>
                  <i className="fa fa-plus"></i>
                </div>
              </div>
              {click ? (
                  <FieldSearchValues attribute={this.state.attribute} value={this.state.value}/>
              ) : (
                  <div className="search-value col s12 offset-s1">
                  </div>
              )}
              <div className="actions-buttons">
                <div className="col s6 button">
                  <a className="waves-effect waves-light btn" id="btn-clear" tabIndex="-1"
                     title="Clear" onClick={this.clearSearch}>
                    Clear
                  </a>
                </div>

                <div className="col s6 button" type="submit">
                  <a className="waves-effect waves-light btn" id="btn-search" tabIndex="-1"
                     title="Search">
                    <i className="clickable fa fa-search"/>
                  </a>
                </div>
              </div>
            </form>
          </div>
        */}
      </div>
    )
  }
}

class SideBar extends Component {
  constructor(props){
    super(props);
    this.state = {
      click: false,
      nextKey: "filtering",
      sideBarOpened: false
    };

    this.toggleSideBar = this.toggleSideBar.bind(this);
    this.changeSideBar = this.changeSideBar.bind(this);
  }

  toggleSideBar() {
    const last = this.state.sideBarOpened;
    this.setState({sideBarOpened: !last});
  }

  changeSideBar(e) {
    e.preventDefault();
    this.setState({
      click: !this.state.click,
      nextKey: (this.state.click ? "filtering" : "devices")
    });
  }

  render(){
    function Footer(props) {
      return (
        <div className="device-footer col s12 background-info" onClick={props.callback}>
            <a className="waves-effect waves-light">{props.nextKey.toUpperCase()}</a>
          </div>
      )
    }

    const btnSideBarClass = "fa fa-chevron-" + (this.state.sideBarOpened ? "right" : "left");
    const divFilterList =  this.state.click ? (
      <Filter devices={this.props.devices} setDisplayMap={this.props.setDisplayMap}/>
    ) : (
      <List devices={this.props.devices}
            hideAll={this.props.hideAll}
            showAll={this.props.showAll}
            toggleDisplay={this.props.toggleDisplay}
            displayMap={this.props.statusMap} />
    );

    return (
      <div className="col m12">
        <div className={"col m12 div-btn-side-painel " + (this.state.sideBarOpened ? 'push-left' : 'no-left')}>
          <button type="button" className='btn btn-circle sideBarToggle' onClick={this.toggleSideBar}>
            <i className={btnSideBarClass} aria-hidden="true"></i>
          </button>
        </div>
        { this.state.sideBarOpened ? (
          <div className="col device-painel full-height">
            <div className="col device-painel-body relative">
              {divFilterList}
            </div>
            <Footer callback={this.changeSideBar} nextKey={this.state.nextKey} />
          </div>
        ) : (
          null
        )}
      </div>
    )
  }
}

export default SideBar;
