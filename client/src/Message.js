import React from 'react';

export default class Message extends React.Component {
    componentDidMount() {
        this.props.handleClear(5000);
    }

    render() {
        return (
            <div className="columns">
                <div className="column is-7 is-offset-5">
                    <div className="notification is-success ">
                        <p>{this.props.data}</p>
                    </div>
                </div>
            </div>
        );
    }

}