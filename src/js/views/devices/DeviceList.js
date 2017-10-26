import React, { Component } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import util from "../../comms/util/util";

import { Link } from 'react-router'
import { Loading } from '../../components/Loading';
import { PageHeader } from "../../containers/full/PageHeader";
import {SubHeader, SubHeaderItem} from "../../components/SubHeader";
import SideBar from "../../components/DeviceFilterMenu";

function SummaryItem(props) {
  let attrs = 0;
  if (props.device.attrs) attrs += props.device.attrs.length
  if (props.device.static_attrs) attrs += props.device.static_attrs.length

  return (
    <Link to={"/device/id/" + props.device.id + "/detail"}>
      <div className="lst-entry col s12 m6 l4">
        <div className={"clickable lst-entry-wrapper z-depth-2 col s12 " + props.device._status}  title="View details">
          <div className="lst-entry-title col s12">
            <div className="img">
              <img src="images/ciShadow.svg" />
            </div>
            <div className="user-label truncate">{props.device.label}</div>
            <span className={"badge " + status}>{props.device._status}</span>
          </div>

          <div className="lst-entry-body col s12">
            {/* TODO fill those with actual metrics */}
            <div className="col s3 metric">
              <div className="metric-value">{attrs}</div>
              <div className="metric-label">Attributes</div>
            </div>
            <div className="col s9 metric last">
              <div className="metric-value">{util.printTime(props.device.updated)}</div>
              <div className="metric-label">Last update</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

class DeviceList extends Component {
  constructor(props) {
    super(props);
    this.state = {displayMap:{}};

    this.shouldShow = this.shouldShow.bind(this);
    this.toggleDisplay = this.toggleDisplay.bind(this);
    this.hideAll = this.hideAll.bind(this);
    this.showAll = this.showAll.bind(this);
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

  render() {
    if (this.props.loading) {
      return (<Loading />);
    }

    // TODO refactor this away
    let filteredList = []
    if ((this.props.devices !== undefined) && (this.props.devices !== null)) {
      for (let k in this.props.devices) {
        if (this.props.devices.hasOwnProperty(k) && this.shouldShow(k)){
          filteredList.push(this.props.devices[k]);
        }
      }
    }

    const device_icon  = (<img src='images/icons/chip.png' />)
    if (filteredList.length > 0) {
      return (
        <div className = "flex-wrapper bg-light-gray">
          {/* TODO refactor this to a different file */}
          <SubHeader>
            <SubHeaderItem text={"Showing "+ filteredList.length + " devices "}
                           icon={device_icon} active='false' clickable='false' />
            {this.props.toggle}
          </SubHeader>

          <div className="deviceMapCanvas col m12 s12 relative">
            <div className="row">
              <div className="col s12  lst-wrapper extra-padding">
                { filteredList.map((device, idx) => <SummaryItem device={device} key={device.id}/>) }
              </div>
            </div>
              <SideBar devices={this.props.devices}
                       setDisplayMap={this.setDisplayMap}
                       hideAll={this.hideAll}
                       showAll={this.showAll}
                       toggleDisplay={this.toggleDisplay}
                       statusMap={this.state.displayMap}/>
          </div>
        </div>
      )
    } else {
      return  (
        <div className="background-info valign-wrapper full-height relative">
          <span className="horizontal-center">No configured devices</span>
          <SideBar devices={this.props.devices}
                   setDisplayMap={this.setDisplayMap}
                   hideAll={this.hideAll}
                   showAll={this.showAll}
                   toggleDisplay={this.toggleDisplay}
                   statusMap={this.state.displayMap}/>
        </div>
      )
    }
  }
}

export {DeviceList};
