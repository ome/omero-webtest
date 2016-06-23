

// Backbone model
// ------------------------------
var ImageModel = Backbone.Model.extend({

    defaults: {
        selectedChannelIdx: 0,
        theZ: 0,
        theT: 0,
        zoom: 100,
    },

    setChannelActive: function(idx, active) {
        var oldChs = this.get('channels');
        // Need to clone the list of channels...
        var chs = [];
        for (var i=0; i<oldChs.length; i++) {
            chs.push($.extend(true, {}, oldChs[i]));
        }
        // ... then toggle active ...
        chs[idx].active = active;
        // ... so that we get the changed event triggering OK
        this.set('channels', chs);
    },

    loadImage: function(imgId) {
        getJSON("/webgateway/imgData/" + imgId + "/", function(data){

            data.theT = data.rdefs.defaultT;
            data.theZ = data.rdefs.defaultZ;
            data.sizeX = data.size.width;
            data.sizeY = data.size.height;
            data.sizeT = data.size.t;
            data.sizeZ = data.size.z;
            data.sizeC = data.size.c;
            var chs = [];
            for (var i=0; i<data.channels.length; i++) {
                chs.push(_.extend({}, data.channels[i]));
            }
            data.loadedChannels = chs;
            this.set(data);
        }.bind(this));
    },

    refreshImage: function() {

        // replace 'loadedChannels' with 'channels' 
        var chs = this.get('channels').map(function(ch){
            return _.extend({}, ch);
        });
        this.set('loadedChannels', chs);
        this.trigger('refreshImage');
    },

    getQueryString: function() {
        var cStrings = model.get('channels').map(function(c, i){
            return 1+i + "|" + c.window.start + ":" + c.window.end + "$" + c.color;
        });
        return cStrings.join(",");
    },

    setChannelStart: function(idx, start) {
        this.setChannelWindow(idx, start);
    },

    setChannelEnd: function(idx, end) {
        this.setChannelWindow(idx, undefined, end);
    },

    setChannelWindow: function(idx, start, end) {
        console.log('setChannelWindow', start, end);
        var oldChs = this.get('channels');
        // Need to clone the list of channels...
        var chs = [];
        for (var i=0; i<oldChs.length; i++) {
            chs.push($.extend(true, {}, oldChs[i]));
        }
        // ... then set new value ...
        if (start !== undefined) {
            chs[idx].window.start = parseInt(start, 10);
        }
        if (end !== undefined) {
            chs[idx].window.end = end;
        }
        // ... so that we get the changed event triggering OK
        console.log('setChannelWindow', chs);
        this.set('channels', chs);
    }
});