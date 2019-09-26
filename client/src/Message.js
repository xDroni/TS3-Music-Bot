import React from 'react';

export default class Message extends React.Component {
    componentDidMount() {
        this.props.handleClear(5000);
    }

    render() {
        return (
            <div className="columns">
                <div className="column is-7 is-offset-5">
                    <article className="message is-small is-success ">
                        <div className="message-body">
                            <p>{this.props.data}</p>
                        </div>
                    </article>
                </div>
            </div>
        );
    }

}