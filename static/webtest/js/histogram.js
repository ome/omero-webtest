
// Backbone model
// ------------------------------
var ViewerModel = Backbone.Model.extend({

    defaults: {
        selectedChannelIdx: 0,
        theZ: 0,
        theT: 0,
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

    loadData: function(imgId) {
        $.getJSON("/webgateway/imgData/" + imgId + "/", function(data){

            data.theT = data.rdefs.defaultT;
            data.theZ = data.rdefs.defaultZ;
            this.set(data);
        }.bind(this));
    },

    setChannelWindow: function(idx, start, end) {
        var oldChs = this.get('channels');
        // Need to clone the list of channels...
        var chs = [];
        for (var i=0; i<oldChs.length; i++) {
            chs.push($.extend(true, {}, oldChs[i]));
        }
        // ... then set new value ...
        chs[idx].window.start = start;
        chs[idx].window.end = end;
        // ... so that we get the changed event triggering OK
        this.set('channels', chs);
    }
});


// UI components
// ------------------------------------------------------
var Zslider = function(model) {

    $("#zSlider").on('input', function(){
        // on 'slide' we just update the Z label
        $("#zIndex").html('Z: ' + $(this).val());
    }).on('change', function(){
        // on 'stop' we update the model
        var theZ = $(this).val();
        model.set('theZ', theZ);
    });

    // when model changes, we update slider and Z label
    model.on('change:theZ', function(){
        var theZ = model.get('theZ');
        $("#zSlider").val(theZ);
        $("#zIndex").html('Z: ' + theZ);
    });
};


var ProjectionButton = function(model) {

    $("#projection").on('click', function(){
        var proj = $(this).is(":checked");
        model.set('projection', proj);
    });
};


var ImageViewer = function(model) {

    model.on('change:theZ change:theT change:channels change:projection', function(model){

        var cStrings = [];
        _.each(model.get('channels'), function(c, i){
            if (c.active) {
                cStrings.push(1+i + "|" + c.window.start + ":" + c.window.end + "$" + c.color);
            }
        });
        var renderString = cStrings.join(","),
            imageId = model.get('id'),
            proj = model.get('projection'),
            theZ = model.get('theZ'),
            theT = model.get('theT');

        var imgSrc = '/webgateway/render_image/' + imageId + "/" + theZ + "/" + theT +
                '/?c=' + renderString + "&m=c";
        if (proj) {
            imgSrc += "&p=intmax";
        }

        $("#viewer").attr('src', imgSrc);
    });
};


var ChannelSliders = function(model) {

        // Build sliders when image loads....
    model.on('change:id', function(model){

        var channels = model.get('channels');
        buildChannels(channels);
    });


    var buildChannels = function(channels) {

        $('#sliders').empty();

        channels.forEach(function(ch, idx){
            $("<div style='background: #" + ch.color + "'></div>")
                .appendTo('#sliders')
                .slider({
                    range: true,
                    min: ch.window.min,
                    max: ch.window.max,
                    values: [ch.window.start, ch.window.end],
                    start: function() {
                        // plotHistogram(idx);
                        model.set('selectedChannelIdx', idx);
                    },
                    slide: function(event, ui) {
                        // we don't setChannelWindow() here
                        // since that would refresh image during slide
                        model.trigger('slide', ui.values);
                    },
                    stop: function(event, ui) {
                        model.setChannelWindow(idx, ui.values[0], ui.values[1]);
                    }
                });
        });
    };
};


var JsonHistogram = function(model) {

    var graphWidth = 512,
        graphHeight = 150;

    var svg = d3.select("body").append("svg")
        .attr("width", graphWidth)
        .attr("height", graphHeight)
      .append("g");
        // .attr("transform", "translate(0,0)");

    // line plot
    svg.append("g")
        .append("path")
        .attr("class", "line");

    // Another line plot for 'numpy' histogram
    svg.append("g")
        .append("path")
        .attr("class", "line numpy");

    // area fill
    svg.append("path")
        .attr("class", "area")
        .attr('opacity', 0.5);

    // Add slider markers
    svg.selectAll("rect")
        .data([0, 0])
        .enter().append("rect")
        .attr("y", 0)
        .attr("height", 300)
        .attr("width", 1)
        .attr("x", function(d, i) { return d * (graphWidth/2); });
    var t = svg.selectAll("text")
        .data([0, 0])
        .enter().append("text")
        .attr("font-family", "sans-serif")
        .attr("font-size", "20px")
        .attr("y", 20)
        .attr("fill", "black");


    var plotNumpyJson = function(data, color) {

        // cache this for use by chartRange
        // colCount = data.length;

        var x = d3.scale.linear()
            .domain([0, data.length - 1])
            .range([0, graphWidth]);

        var y = d3.scale.linear()
            .domain([
                d3.min(data),
                d3.max(data)
            ])
            .range([graphHeight, 0]);

        var line = d3.svg.line()
            .x(function(d, i) { return x(i); })
            .y(function(d, i) { return y(d); });

        svg.selectAll(".numpy")
            .datum(data)
            .attr("d", line)
            .attr('stroke', 'black');
    };


    var plotJson = function(data, color) {

        // cache this for use by chartRange
        colCount = data.length;

        var x = d3.scale.linear()
            .domain([0, data.length - 1])
            .range([0, graphWidth]);

        var y = d3.scale.linear()
            .domain([
                d3.min(data),
                d3.max(data)
            ])
            .range([graphHeight, 0]);

        var line = d3.svg.line()
            .x(function(d, i) { return x(i); })
            .y(function(d, i) { return y(d); });

        svg.selectAll(".line")
            .datum(data)
            .attr("d", line)
            .attr('stroke', color);


        // area to fill under line
        var area = d3.svg.area()
            .x(function(d, i) { return x(i); })
            .y0(graphHeight)
            .y1(function(d) { return y(d); });

        svg.selectAll(".area")
            .datum(data)
            .attr("class", "area")
            .attr("d", area)
            .attr('fill', color);
    };

    var loadAndPlotJson = function(){
        console.log('Loading histogram data...');
        var iid = model.get('id'),
            theZ = model.get('theZ'),
            theT = model.get('theT'),
            theC = model.get('selectedChannelIdx'),
            proj = model.get('projection'),
            color = '#' + model.get('channels')[theC].color;
        var url = '/webtest/histogram_data/' + iid + "/channel/" + theC + "/";
        url += '?theT=' + theT + '&theZ=' + theZ;
        if (proj) {
            url += "&p=intmax";
        }

        var startJson = new Date();
        if ($("#numpyRadio").is(":checked")) {
            url += '&data=numpy';
        }
        $.getJSON(url, function(data){
            plotJson(data, color);
            plotStartEnd();
            console.log("Json Histogram took: ", new Date() - startJson);
        });
    };

    // We 'debounce' loading json so that it's not repeated very rapidly
    loadAndPlotJson = _.debounce(loadAndPlotJson);

    model.on('change:theZ change:theT change:selectedChannelIdx change:projection', loadAndPlotJson);

    // Plot the start/end positions during slide (not set on model)
    model.on('slide', function(args){
        plotStartEnd([args[0], args[1]]);
    });

    var plotStartEnd = function(values) {
        var start, end,
            idx = model.get('selectedChannelIdx'),
            ch = model.get('channels')[idx],
            min = ch.window.min,
            max = ch.window.max,
            color = '#' + ch.color;
        if (!values) {
            start = ch.window.start;
            end = ch.window.end;
        } else {
            start = values[0];
            end = values[1];
        }
        var s = ((start - min)/(max - min)) * 256;
        var e = ((end - min)/(max - min)) * 256;

        svg.selectAll("rect")
        .data([s, e])
        .attr("x", function(d, i) { return d * (graphWidth/colCount); })
        .attr('fill', color);

        svg.selectAll("text")
            .data([[start, s], [end, e]])
            .text(function(d) { return "" + d[0]; })
            .attr('x', function(d) { return (d[1] * (graphWidth/colCount)) + 3; });
    };

};


var CanvasDataHistogram = function(model) {

    var width = 512;
    var height = 512;
    var pixels;
    var canvas;
    var ctx;
    var svg;
    var chart;

    var hdata = [];
    var lastChIdx = 0;
    // img not displayed
    // $("#canvas").css({'width': width +'px', 'height': height +'px'});
    var img = new Image();

    var colCount,
        svgWidth = 512,
        svgHeight = 150,
        margin = {top: 20, right: 0, bottom: 20, left: 0},
        plotWidth = svgWidth - margin.left - margin.right,
        plotHeight = svgHeight - margin.top - margin.bottom;
    svg = d3.select("body").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var path = svg.append("g")
            .append("path")
            .attr("class", "line");
            // .attr("d", line);

    // Add slider markers
    var line = svg.selectAll("rect")
    .data([0, 0]);

    var lineEnter = line.enter().append("rect");
    lineEnter.attr("y", 0);
    lineEnter.attr("height", 300);
    lineEnter.attr("width", 1);
    lineEnter.attr("x", function(d, i) { return d * (plotWidth/2); });

    // load histogram data when new plane chosen
    model.on('change:theZ change:theT', function(model){
        loadHistogramData(model);
    });

    model.on('change:selectedChannelIdx', function(model, idx, event){
        plotHistogram(idx);
    });

    // when 'slide' is triggered (no model change), we 
    // update slider markers on histogram
    model.on('slide', function(args){

        var start = args[0],
            end = args[1],
            idx = model.get('selectedChannelIdx'),
            ch = model.get('channels')[idx],
            min = ch.window.min,
            max = ch.window.max;
        start = ((start - min)/(max - min)) * 256;
        end = ((end - min)/(max - min)) * 256;

        chartRange([start, end], '#' + ch.color);
    });

    var histogramStart;

    var loadHistogramData = function(model) {

        // we want 'full range' image (darkest to brightest pixels)
        // for the current Z/T plane
        histogramStart = new Date();

        var cStrings = [];
        _.each(model.get('channels'), function(c, i){
            cStrings.push(1+i + "|" + c.window.min + ":" + c.window.max + "$" + c.color);
        });
        var renderString = cStrings.join(","),
            imageId = model.get('id'),
            theZ = model.get('theZ'),
            theT = model.get('theT');

        var src = '/webgateway/render_image/' + imageId + "/" + theZ + "/" + theT +
                '/?c=' + renderString + "&m=c";
        // this will trigger loading of histogram data
        img.src = src;
    };


    // When we have the Image data, use it to populate the canvas
    img.onload = function() {
        canvas = document.getElementById("canvas");
        canvas.width = width;
        canvas.height = height;

        ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // and save a copy of the data
        raw = ctx.getImageData(0, 0, width, height);

        cacheHistogramData(raw);

        // plot current channel
        var selectedChannelIdx = model.get('selectedChannelIdx');
        plotHistogram(selectedChannelIdx);

        console.log("Histogram loading took", new Date() - histogramStart);
    };


    var cacheHistogramData = function(pix) {

        var cdata;
        hdata = [];
        // go through 3 channels
        for (var c = 0; c < 3; c++){
            // go through all pixels of each channel (r,g,b or a)
            cdata = new Uint16Array(256);
            for (var i = c, n = pix.data.length; i < n; i+=4) {
                d = raw.data[i];
                cdata[d] = cdata[d] + 1;
            }
            hdata.push(cdata);
        }
    };


    var plotHistogram = function(chIndex) {

        lastChIdx = chIndex;
        var points;
        if (chIndex >= hdata.length) {
            points = [0];
        } else {
            points = hdata[chIndex];
        }
        var colors = ['#0000ff', '#00ff00', '#ff0000'];

        plotLine(points, colors[chIndex]);
    };


    var plotLine = function(data, color) {

        // cache this for use by chartRange
        colCount = data.length;

        var x = d3.scale.linear()
            .domain([0, data.length - 1])
            .range([0, plotWidth]);

        var y = d3.scale.linear()
            .domain([
                d3.min(data),
                d3.max(data)
            ])
            .range([plotHeight, 0]);

        var line = d3.svg.line()
            .x(function(d, i) { return x(i); })
            .y(function(d, i) { return y(d); });

        svg.selectAll(".line")
            .datum(data)
            .attr("d", line)
            .attr('stroke', color);
    };

    var chartRange = function(values, color) {
        var circle = svg.selectAll("rect")
        .data(values)
        .attr("x", function(d, i) { return d * (plotWidth/colCount); })
        .attr('fill', color);
    };
};


$(function(){
    

    var model = new ViewerModel();

    new ChannelSliders(model);
    // new CanvasDataHistogram(model);
    new Zslider(model);
    new ProjectionButton(model);
    new ImageViewer(model);

    new JsonHistogram(model);

    // Uses React.js
    // Since we're parsing JSX and babel on the fly,
    // It seems to need this timeout, otherwise it's
    // not ready yet?
    setTimeout(function(){
        // this is in histogram-react.js
        new ChannelButtonComponent(model);

        // finally, start everything by loading image
        model.loadData(IMAGE_ID);

    }, 100);
});