

(function(){


var ChannelBtn = React.createClass({

    onChange: function(event) {
        var idx = this.props.index,
            active = event.target.checked;
        this.props.setChannelActive(idx, active);
    },

    render: function() {
        var chan = this.props.channel;
        return (
            <div>
                <label key={"channel_" + chan.label}>
                <input
                    type="checkbox"
                    value={"" + this.props.index}
                    checked={ chan.active }
                    onChange={this.onChange} />
                        {chan.label}
                </label>
            </div>
        )
    }
});

var ChannelButtons = React.createClass({

    render: function() {
        return (
            <div>{
                this.props.channels.map(function(channel, c) {
                    return (
                        <ChannelBtn
                            setChannelActive={this.props.setChannelActive}
                            index={c}
                            channel={channel} />
                    );
                }.bind(this))
            }</div>
        );
    }
});


// We 'export' our UI component based on Backbone model
window.ChannelButtonComponent = function(model) {

    // All the state is in the Backbone.js model.
    // None of the React.js compoenents have state.

    // We get the props we need and pass them
    // to the ChannelButtons component whenever
    // channels change...
    model.on('change:channels', function(model){

        var channels = model.get('channels');

        var setChannelActive = function(idx, active) {
            model.setChannelActive(idx, active);
        }

        ReactDOM.render(
            <ChannelButtons
                channels={channels} 
                setChannelActive={setChannelActive} />,
            document.getElementById('channelButtons')
        );
    });
};

})();
