

import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { PageHeader, ActionHeader } from "../../containers/full/PageHeader";
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Link, hashHistory } from 'react-router'

import alt from '../../alt';
import AltContainer from 'alt-container';
import MeasureStore from '../../stores/MeasureStore';
import MeasureActions from '../../actions/MeasureActions';
import DeviceActions from '../../actions/DeviceActions';
import DeviceStore from '../../stores/DeviceStore';
import deviceManager from '../../comms/devices/DeviceManager';
import util from "../../comms/util/util";
import {SubHeader, SubHeaderItem} from "../../components/SubHeader";
import {Loading} from "../../components/Loading";

import { Line } from 'react-chartjs-2';
import { PositionRenderer } from './DeviceMap.js'
import MaterialSelect from "../../components/MaterialSelect";

class DeviceUserActions extends Component {
  render() {
    return (
      <div>
        <Link className="waves-effect waves-light btn-flat btn-ciano"
              to={"/device/list"}  tabIndex="-1"  title="Return to device list">
          <i className="clickable fa fa-times" />
        </Link>
      </div>
    )
  }
}

// TODO move this to its own component
class Graph extends Component{
  constructor(props) {
    super(props);
  }

  render() {
    let labels = [];
    let values = [];

    function getValue(tuple) {
      let val_type = typeof tuple.attrValue;
      if (val_type == "string" && tuple.attrType != "string") {
        if (tuple.attrValue.trim().length > 0) {
          if (tuple.attrType.toLowerCase() == 'integer') {
            return parseInt(tuple.attrValue);
          } else if (tuple.attrType.toLowerCase() == 'float'){
            return parseFloat(tuple.attrValue);
          }
        }
      } else if (val_type == "number") {
        return tuple.attrValue;
      }

      return undefined;
    }

    this.props.data.data[this.props.attr].map((i) => {
      labels.push(util.iso_to_date(i.ts));
      values.push(i.value);
    })

    if (values.length == 0) {
      return (
        <div className="valign-wrapper full-height background-info">
          <div className="full-width center">No data available</div>
        </div>
      )
    }

    let filteredLabels = labels.map((i,k) => {
      if ((k == 0) || (k == values.length - 1)) {
        return i;
      } else {
        return "";
      }
    })

    const data = {
      labels: labels,
      xLabels: filteredLabels,
      datasets: [
        {
          label: 'Device data',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: values
        }
      ]
    }

    const options = {
      maintainAspectRatio: false,
      legend: { display: false },
      scales: {
        xAxes: [{ display: false }]
      },
      layout: {
        padding: { left: 10, right: 10 }
      }
    }

    return (
      <Line data={data} options={options}/>
    )
  }
}

// TODO move this to its own component
function HistoryList(props) {
  let data = props.data.data[props.attr];
  let trimmedList = data.filter((i) => {
    return i.value.trim().length > 0
  })
  trimmedList.reverse();

  if (trimmedList.length > 0) {
    return (
      <div className="relative full-height" >
        <div className="full-height full-width scrollable history-list">
          {trimmedList.map((i,k) => {
            return (<div className={"row " + (k % 2 ? "alt-row" : "")} key={i.ts}>
              <div className="col s7 value">{i.value}</div>
              <div className="col s5 label">{util.iso_to_date(i.ts)}</div>
            </div>
          )})}
        </div>
      </div>
    )
  } else {
    return (
      <div className="full-height background-info valign-wrapper center">
        <div className="center full-width">No data available</div>
      </div>
    )
  }
}

// TODO move this to its own component
function Attr(props) {
  const known = {
    'integer': Graph,
    'float': Graph,
    'string': HistoryList,
    'default': HistoryList
  }

  const Renderer = props.type in known ? known[props.type] : known['default'];
  return (
    <Renderer {...props} />
    // <span/>
  )
}

class AttributeSelector extends Component {
  render() {
    const outerClass = this.props.active ? " active" : "";
    return (
      <div className={"col s12 p0 attr-line" + outerClass}>
        <a className="waves-effect waves-light"
           onClick={() => {this.props.onClick(this.props.label)}} >
          <span className="attr-name">{this.props.label}</span>
          {this.props.currentValue ? (
            <span>Last received value: {this.props.currentValue}</span>
          ) : (
            <span>No data available to display</span>
          )}
        </a>
      </div>
    )
  }
}

class AttrHistory extends Component {
  constructor(props){
    super(props);
  }

  componentDidMount() {
    MeasureActions.fetchMeasure(this.props.device, [this.props.attr], 250);
  }

  render() {
    return (
      <div className="graphLarge">
        {/* <div className="refresh-btn-history"
                onClick={() => {
                  MeasureActions.fetchMeasure(this.props.device, [this.props.attr], 250);
                }} >
            <i className="fa fa-refresh" />
        </div> */}
        <div className="contents no-padding">
          <AltContainer store={MeasureStore}>
            <Attr device={this.props.device} type={this.props.type} attr={this.props.attr}/>
          </AltContainer>
        </div>
      </div>
    );
  }
}

class AttributeBox extends Component {
  constructor(props) {
    super(props);
    this.state = {selected: null};
    this.changeAttribute = this.changeAttribute.bind(this);
  }

  changeAttribute(attr_id) {
    this.setState({selected: attr_id});
    MeasureActions.fetchMeasure(this.props.device.id, [attr_id], 250);
  }

  render() {
    let device = this.props.device;
    let attr = []
    if (this.state.selected !== null) {
      attr = device.attrs.filter((k) => {
        return k.name.toUpperCase() == this.state.selected.toUpperCase();
      });
    }

    let timeRange = undefined;
    if (attr[0]) {
      if (this.props.data.data.hasOwnProperty(this.state.selected)){
        if (this.props.data.data[this.state.selected].length > 0){
          const to = util.iso_to_date(this.props.data.data[this.state.selected][0]['ts']);
          let length = this.props.data.data[this.state.selected].length
          const from = util.iso_to_date(this.props.data.data[this.state.selected][length - 1]['ts']);
          timeRange = "Data from " + from + " to " + to;
        }
      }
    }

    return (
      <div className="col s12 p0 full-height">
        <div className="col s5 card-box">
          <div className="detail-box-header">Attributes</div>
          <div className='col s12 attr-box-body'>
          {this.props.attrs.map((attr) => {
            let data = undefined;
            let active = this.state.selected && (attr.toUpperCase() == this.state.selected.toUpperCase());
            if (this.props.data && this.props.data.hasOwnProperty('data')) {
              if (this.props.data.data.hasOwnProperty(attr)){
                if (this.props.data.data[attr].length > 0){
                  data = this.props.data.data[attr][0].value;
                }
              }
            }
            return (
              <AttributeSelector label={attr} key={attr}
                                 currentValue={data}
                                 active={active}
                                 onClick={this.changeAttribute} />
          )})}
          </div>
        </div>
        <div className="col s7 graph-box">
          {attr[0] !== undefined ? (
            <span>
              <div className='col s12 legend'>{timeRange}</div>
              <AttrHistory device={device.id} type={attr[0].type} attr={attr[0].name}/>
            </span>
          ) : (
            null
          )}
        </div>
      </div>
    )
  }
}

class DeviceDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      new_attr: null,
      selected_attributes: [
        "rssi",
        "sinr",
        "alt",
        "rpm",
        "oilTemperature",
        "fuelLevel",
        "speed"
      ]
    };
    this.handleSelectedAttribute = this.handleSelectedAttribute.bind(this);
    this.handleAddAttribute = this.handleAddAttribute.bind(this);
    this.handleClear = this.handleClear.bind(this);
  }

  handleSelectedAttribute(event) {
    event.preventDefault();
    this.setState({new_attr: event.target.value});
  }

  handleAddAttribute(event) {
    event.preventDefault();
    let attrList = this.state.selected_attributes;
    attrList.push(this.state.new_attr);
    const updated = {
      new_attr: "",
      selected_attributes: attrList
    }
    MeasureActions.fetchMeasure.defer(this.props.deviceid,attrList,1);

    this.setState(updated);
  }

  handleClear(event) {
    event.preventDefault();
    this.setState({selected_attributes:[]});
  }

  componentDidMount() {
    MeasureActions.fetchMeasure.defer(this.props.deviceid,this.state.selected_attributes,1);
  }

  render() {
    const device = this.props.devices[this.props.deviceid];
    let location = "";
    if (device.position !== undefined) {
      location = "Lat: "+device.position[0]+" Lng: "+device.position[1];
    }

    return (
      <div className="row detail-body">
        <div className="col s3 detail-box full-height">
          <div className="detail-box-header">General</div>
          <div className="detail-box-body">
            <div className="metric">
                <span className="label">Attributes</span>
                <span className="value">{device.attrs.length + device.static_attrs.length}</span>
            </div>
            <div className="metric">
                <span className="label">Last update</span>
                <span className="value">{util.iso_to_date(device.ts)}</span>
            </div>
            <div className="metric">
                <span className="label">Location</span>
                <span className="value">{location}</span>
            </div>
            <div className="metric">
                <span className="label">Protocol</span>
                <span className="value">{device.protocol ? device.protocol : "MQTT"}</span>
            </div>
          </div>
          <div className="col 12 attribute-box">
            <div className="col 12 attribute-header">All Attributes</div>
            <span className="highlight">
              Showing <b>{this.state.selected_attributes.length}</b>
              of <b>{device.attrs.length}</b> attributes
            </span>
            <div className="col s12 p16">
              <div className="input-field col s12">
                <MaterialSelect id="attributes-select" name="attribute"
                                value={this.state.selected_attribute}
                                onChange={this.handleSelectedAttribute}>
                  <option value="">Select attribute to display</option>
                  {device.attrs.map((attr) => (
                    <option value={attr.name} key={attr.object_id} >{attr.name}</option>
                  ))}
                </MaterialSelect>
              </div>
              <div className="col s12 actions-buttons">
                <div className="col s6 button ta-center">
                  <a className="waves-effect waves-light btn btn-light" id="btn-clear" tabIndex="-1"
                     title="Clear" onClick={this.handleClear}>
                    Clear
                  </a>
                </div>
                <div className="col s6 button ta-center" type="submit" onClick={this.handleAddAttribute}>
                  <a className="waves-effect waves-light btn" id="btn-add" tabIndex="-1" title="Add">
                    <i className="clickable fa fa-plus"/>
                  </a>
                </div>
              </div>
              {/* <div className="box-list">
                {this.state.selected_attributes.map((attr) => (
                  <div key={attr}>{attr}</div>
                ))}
              </div> */}
            </div>
          </div>
        </div>
        <div className="col s9 device-map full-height">
          <div className="col s12 device-map-box">
            <PositionRenderer devices={[device]} allowContextMenu={false}/>
          </div>
          <div className="col s12 p0 data-box full-height">
            <AltContainer store={MeasureStore} inject={{device: device}}>
              <AttributeBox attrs={this.state.selected_attributes}/>
            </AltContainer>
          </div>
        </div>
      </div>
    )
  }
}

function ConnectivityStatus(props) {
  if (props.status == "online") {
    return (
      <span className='status-on-off clr-green'><i className="fa fa-info-circle" />Online</span>
    )
  } else {
    return (
      <span className='status-on-off clr-red'><i className="fa fa-info-circle" />Offline</span>
    )
  }
}

class ViewDeviceImpl extends Component {
  render() {
    let title = "View device";

    let device = undefined;
    if (this.props.devices !== undefined){
      if (this.props.devices.hasOwnProperty(this.props.device_id)) {
        device = this.props.devices[this.props.device_id];
      }
    }

    if (device === undefined) {
      return (<Loading />);
    }

    return (
      <div className="full-height bg-light-gray">
        <SubHeader>
          <div className="box-sh box-sh-2">
            <label> Viewing Device </label> <div className="device_name">{device.label}</div>
          </div>
          <div className="box-sh">
            <DeviceUserActions deviceid={device.id} confirmTarget="confirmDiag"/>
          </div>
          <div className="box-sh">
            <ConnectivityStatus status={device.status} />
          </div>
        </SubHeader>
        <DeviceDetail deviceid={device.id} devices={this.props.devices}/>
      </div>
    )
  }
}

class ViewDevice extends Component {
  constructor(props) {
    super(props);

    this.remove = this.remove.bind(this);
  }

  componentDidMount() {
    DeviceActions.fetchSingle.defer(this.props.params.device);
  }

  remove(e) {
    // This should be on DeviceUserActions -
    // this is not good, but will have to make do because of z-index on the action header
    e.preventDefault();
      DeviceActions.triggerRemoval({id: this.props.params.device}, (device) => {
      hashHistory.push('/device/list');
      Materialize.toast('Device removed', 4000);
    });
  }

  render() {
    return (
      <div className="full-width full-height">
        <ReactCSSTransitionGroup
          transitionName="first"
          transitionAppear={true} transitionAppearTimeout={500}
          transitionEnterTimeout={500} transitionLeaveTimeout={500} >
          <AltContainer store={DeviceStore} >
            <ViewDeviceImpl device_id={this.props.params.device}/>
          </AltContainer>
        </ReactCSSTransitionGroup>
      </div>
    )
  }
}

export { ViewDevice };
