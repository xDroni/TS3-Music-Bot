import React from 'react';
import 'bulma';
import './App.css';
import socketIOClient from 'socket.io-client';

import NavBar from "./Navbar";
import Message from "./Message";
import MusicContent from "./MusicContent";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      info: '',
      apiData: [],
      endpoint: "http://localhost:9000"
    };

    const { endpoint } = this.state;
    this.socket = socketIOClient(endpoint);

    this.clearInfo = this.clearInfo.bind(this);
  }

  callAPI() {
    fetch("http://localhost:9000/getData")
        .then(res => res.json())
        .then(res => this.setState({ apiData: res }));
  }

  componentDidMount() {
    this.callAPI();

    this.socket.on('songAdded', data => {
      this.setState({
        info: data,
      });

      this.callAPI();
    });

    this.socket.on('skipCurrent', data => {
      this.setState({
        info: data,
      });
      this.callAPI();
    });
  }

  clearInfo(delay) {
    setTimeout(() => {
      this.setState({
        info: ''
      })
    },  delay)
  }

  render() {
    let data = this.state.apiData;
    return (
        <div className="container is-fluid">
          <NavBar />
          <section className="section">
            {data ? <MusicContent data={data}/>: null}
          </section>

          {this.state.info ? <Message data={this.state.info} handleClear={this.clearInfo} socket={this.socket}/> : null}
        </div>
    );
  }
}

export default App;
