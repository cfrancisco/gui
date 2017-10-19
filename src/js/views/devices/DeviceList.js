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
            <div className="col s3 metric"s>
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
  render() {
    if (this.props.loading) {
      return (<Loading />);
    }

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
              <div className="col s12  lst-wrapper">
                { filteredList.map((device, idx) => <SummaryItem device={device} key={device.id}/>) }
              </div>
            </div>
              <SideBar devices={this.props.devices} />
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

export {DeviceList};
