import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

// Data helpers/managers
import AltContainer from 'alt-container';

import DeviceStore from '../../stores/DeviceStore';
import DeviceActions from '../../actions/DeviceActions';

// UI elements
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Toggle from 'material-ui/Toggle';

// Sub components
import {DeviceMap} from './DeviceMap';
import {DeviceList} from './DeviceList';



function ToggleWidget(props) {
  return (
    <div className="box-sh">
      <div className='toggle-icon'>
        <img src='images/icons/pin.png' />
      </div>
      <div className='toggle-map'>
        <MuiThemeProvider>
          <Toggle label="" defaultToggled={props.toggleState} onToggle={props.toggle}/>
        </MuiThemeProvider>
      </div>
      <div className='toggle-icon'>
        <i className="fa fa-th-large" aria-hidden="true"></i>
      </div>
    </div>
  )
}

class Devices extends Component {
  constructor() {
    super();

    this.state = {displayList: false};
    this.toggleDisplay = this.toggleDisplay.bind(this);
  }


    toggleDisplay() {
      const last = this.state.displayList;
      console.log("will change display to " + (last?"map":"list"));
      this.setState({displayList: !last});
    }


  componentDidMount() {
    DeviceActions.fetchDevices.defer();
  }

  render() {
    const displayToggle = (<ToggleWidget toggleState={this.state.displayList} toggle={this.toggleDisplay} />)

    return (
      <ReactCSSTransitionGroup
        transitionName="first"
        transitionAppear={true}      transitionAppearTimeout={500}
        transitionEnterTimeout={500} transitionLeaveTimeout={500} >
        <AltContainer store={DeviceStore}>
          {/* Devices prop comes from DeviceStore, through AltContainer */}
          { this.state.displayList ?
            (<DeviceList toggle={displayToggle} />) :
            (<DeviceMap toggle={displayToggle} />)
          }
        </AltContainer>
      </ReactCSSTransitionGroup>
    );
  }
}

export { Devices };
