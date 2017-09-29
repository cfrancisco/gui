import React, { Component } from 'react'
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';

export default class SimpleExample extends Component {

  constructor(props) {
    super(props);

    this.state = {
    lat: 51.505,
    lng: -0.09,
    zoom: 13,
  }
}

  render() {
    const position = [this.state.lat, this.state.lng]
    return (
      <Map center={position} zoom={this.state.zoom}>
        <TileLayer
          attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
          url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <span>
              A pretty CSS3 popup. <br /> Easily customizable.
            </span>
          </Popup>
        </Marker>
      </Map>
    )
  }
}

