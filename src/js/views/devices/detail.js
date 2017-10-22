

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

// TODO make this its own component
class RemoveDialog extends Component {
  constructor(props) {
    super(props);

    this.dismiss = this.dismiss.bind(this);
    this.remove = this.remove.bind(this);
  }

  componentDidMount() {
    // materialize jquery makes me sad
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).ready(function() {
      $('.modal').modal();
    })
  }

  dismiss(event) {
    event.preventDefault();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    $(modalElement).modal('close');
  }

  remove(event) {
    event.preventDefault();
    let modalElement = ReactDOM.findDOMNode(this.refs.modal);
    this.props.callback(event);
    $(modalElement).modal('close');
  }

  render() {
    return (
      <div className="modal" id={this.props.target} ref="modal">
        <div className="modal-content full">
          <div className="row center background-info">
            <div><i className="fa fa-exclamation-triangle fa-4x" /></div>
            <div>You are about to remove this device.</div>
            <div>Are you sure?</div>
          </div>
        </div>
        <div className="modal-footer right">
            <button type="button" className="btn-flat btn-ciano waves-effect waves-light" onClick={this.dismiss}>cancel</button>
            <button type="submit" className="btn-flat btn-red waves-effect waves-light" onClick={this.remove}>remove</button>
        </div>
      </div>
    )
  }
}

class DeviceUserActions extends Component {
  render() {
    return (
      <div>
        <a className="waves-effect waves-light btn-flat btn-ciano" tabIndex="-1" title="Get code">
          <i className="clickable fa fa-code"/>
        </a>
        <Link to={"/device/id/" + this.props.deviceid + "/edit"} className="waves-effect waves-light btn-flat btn-ciano" tabIndex="-1" title="Edit device">
          <i className="clickable fa fa-pencil" />
        </Link>
        <a className="waves-effect waves-light btn-flat btn-ciano" tabIndex="-1" title="Remove device"
           onClick={(e) => {e.preventDefault(); $('#' + this.props.confirmTarget).modal('open');}}>
          <i className="clickable fa fa-trash"/>
        </a>
        <Link to={"/device/list"} className="waves-effect waves-light btn-flat btn-ciano" tabIndex="-1" title="Return to device list">
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

    this.props.data.map((i) => {
      let value = getValue(i);
      if (value !== undefined) {
        labels.push(util.printTime(Date.parse(i.recvTime)/1000));
        values.push(value);
      }
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
        xAxes: [
          { display: false },
          { ticks: { autoSkip: true, maxRotation: 0, minRotation: 0 }}
        ],
      }
    }

    return (
      <Line data={data} options={options}/>
    )
  }
}

// TODO move this to its own component
function HistoryList(props) {
  let trimmedList = props.data.filter((i) => {
    return i.attrValue.trim().length > 0
  })
  trimmedList.reverse();

  if (trimmedList.length > 0) {
    return (
      <div className="full-height scrollable history-list">
        {trimmedList.map((i,k) =>
          <div className={"row " + (k % 2 ? "alt-row" : "")} key={i.recvTime}>
            <div className="col s12 value">{i.attrValue}</div>
            <div className="col s12 label">{util.printTime(Date.parse(i.recvTime)/1000)}</div>
          </div>
        )}
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
    'geo:point': Position,
    'default': HistoryList
  }

  const Renderer = props.type in known ? known[props.type] : known['default'];
  return (
    <Renderer {...props} />
  )
}


class DetailAttrs extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.device.attrs.map((i) => {
      MeasureActions.fetchMeasures.defer(this.props.device.id, this.props.device.protocol, i);
    })
  }

  render() {
    const device = this.props.device;

    let filteredStatics = this.props.device.static_attrs.filter((a) => { return (a.type.toLowerCase() != "geo:point")});

    function AttrList(props) {
      return (
        <span>
          { device.attrs.map((i, k) =>
              <div className={"col s12 m6 l6 metric-card full-height mt10"} key={i.object_id} >
                {(props.devices[device.id] && props.devices[device.id][i.name] &&
                  (props.devices[device.id][i.name].loading == false)) ? (
                  <div className="graphLarge z-depth-2 full-height">
                    <div className="title ">
                      <span>{i.name}</span>
                      <span className="right"
                            onClick={() => MeasureActions.fetchMeasures(device.id, device.protocol, i)}>
                        <i className="fa fa-refresh" />
                      </span>
                    </div>
                    <div className="contents no-padding">
                      <Attr device={device} type={props.devices[device.id][i.name].type} data={props.devices[device.id][i.name].data}/>
                    </div>
                  </div>
                ) : (
                  <div className="graphLarge z-depth-2 full-height">
                    <span className="title">{i.name}</span>
                    <div className="contents">
                      <div className="background-info valign-wrapper full-height relative bg-gray">
                        <i className="fa fa-circle-o-notch fa-spin fa-fw horizontal-center"/>
                      </div>
                    </div>
                  </div>
                )}
              </div>
          )}
        </span>
      )
    }

    if (filteredStatics.length > 0) {
      return (
        <span>
          <div className="row">
            {filteredStatics.map((i, k) =>
              (i.type.toLowerCase() != "geo:point") && (
                <div className="col s12 m3 l3">
                  <div className="card z-depth-2">
                    <div className="card-content row">
                      <div className="col s12 main">
                        <div className="value title">{i.name}</div>
                        <div className="label">Name</div>
                      </div>
                      <div className="col s12">
                        <div className="value">{i.value}</div>
                        <div className="label">Value</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
            </div>
            <AttrList devices={this.props.devices} />
        </span>
      )
    } else {
      return (
        <div className="row half-height">
          <AttrList devices={this.props.devices} />
        </div>
      )
    }
  }
}

class AttributeSelector extends Component {
  render() {
    return (
      <div className="col s12 p0 attr-line">
        <a className="waves-effect waves-light" onClick={this.clearList}>
          <span className="attr-name">{this.props.label}</span>
          <span>Last received value: {this.props.currentValue}</span>
        </a>
      </div>
    )
  }
}

class AttributeBox extends Component {
  constructor(props) {
    super(props);
    this.state = {selected: null};
    this.changeAttribute = this.changeAttribute.bind(this);
  }

  changeAttribute(attr_id) {
    console.log("changeAttribute ",attr_id);
  }

  render() {
    // if (this.props.deviceid == null || !this.props.devices.hasOwnProperty(this.props.deviceid)) {
    //   console.error('Failed to load device attribute data', this.props.deviceid, this.props.devices);
    return (
      <div className="col s12 p0 full-height">
        <div className="col s5 card-box">
          <div className="detail-box-header">Attributes</div>
          {this.props.attrs.map((attr) => {
            let data = undefined;
            if (this.props.data && this.props.data.hasOwnProperty('data')) {
              // console.log(this.props.data.data[attr][0]);
              data = this.props.data.data[attr][0].value;
            }
            return (
              <AttributeSelector label={attr} key={attr} currentValue={data}/>
          )})}
        </div>
        <div className="col s7 graph-box">
          <div className='col s12 legend'>Showing 1 Hour From 10:23 to 11:23 10/13/2017</div>
          {/* <DetailAttrs /> */}
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
    if (device.position !== undefined)
    {
      var location = "Lat: "+device.position[0]+" Lng: "+device.position[1];
    }
    else{
      var location = "";
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
                <span className="value">{util.printTime(device.updated)}</span>
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
          <div className="row attribute-box">
            <div className="row attribute-header">All Attributes</div>
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
              <div className="box-list">
                {this.state.selected_attributes.map((attr) => (
                  <div key={attr}>{attr}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col s9 device-map full-height">
          <div className="col s12 device-map-box">
            <PositionRenderer devices={[device]}/>
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
      <div className="full-height">
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
          <RemoveDialog callback={this.remove} target="confirmDiag" />
        </ReactCSSTransitionGroup>
      </div>
    )
  }
}

export { ViewDevice };
