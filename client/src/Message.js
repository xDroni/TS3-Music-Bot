import React from 'react';

function Message(props) {
    return (
        <article className="message is-small">
            <div className="message-header">
                <p></p>
                <button className="delete is-small" aria-label="delete"></button>
            </div>
            <div className="message-body">
                {props.data}
            </div>
        </article>
    )
}

export default Message;