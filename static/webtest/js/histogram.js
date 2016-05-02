
$(document).ready(function(){
    var width = 512;
    var height = 512;
    var pixels;
    var canvas;
    var ctx;
    var svg;
    var chart;
    // We cache the histogram data (3 channels) and plot whichever
    // is the active slider
    var hdata = [];
    var lastChIdx = 0;

    $("#canvas").css({'width': width +'px', 'height': height +'px'});

    var img = new Image();

    // set up the svg histogram...
    var n = 256,
        margin = {top: 20, right: 0, bottom: 20, left: 0},
        testWidth = 512 - margin.left - margin.right,
        testHeight = 250 - margin.top - margin.bottom;
    svg = d3.select("body").append("svg")
        .attr("width", testWidth + margin.left + margin.right)
        .attr("height", testHeight + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var path = svg.append("g")
            .append("path")
            .attr("class", "line");
            // .attr("d", line);

    // Add slider markers
    var line = svg.selectAll("rect")
    .data([0, 256]);

    var lineEnter = line.enter().append("rect");
    lineEnter.attr("y", 0);
    lineEnter.attr("height", 300);
    lineEnter.attr("width", 1);
    lineEnter.attr("x", function(d, i) { return d * (testWidth/2); });



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
        plotHistogram(lastChIdx);
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

        var points = hdata[chIndex];
        var colors = ['#0000ff', '#00ff00', '#ff0000'];

        plotLine(points, colors[chIndex]);
    };


    var plotLine = function(data, color) {

        var x = d3.scale.linear()
            .domain([0, n - 1])
            .range([0, testWidth]);

        var y = d3.scale.linear()
            .domain([
                d3.min(data),
                d3.max(data)
            ])
            .range([testHeight, 0]);

        var line = d3.svg.line()
            .x(function(d, i) { console.log("x", x(i)); return x(i); })
            .y(function(d, i) { console.log("y", y(d)); return y(d); });

        svg.selectAll(".line")
            .datum(data)
            .attr("d", line)
            .attr('stroke', color);
    };


    // Update the specified channel of the image
    var render = function(channel, start, end) {

        // get the current pixel data...
        pixels = ctx.getImageData(0, 0, width, height);

        var d;
        // go through all pixels of the specified channel (r,g,b or a)
        for (var i = channel, n = pixels.data.length; i < n; i+=4) {
            d = raw.data[i];
            if (d < start) {
                d = 0;
            } else if (d > end) {
                d = 255;
            } else {
                d = ((d - start) / (end - start)) * 255;
            }
            pixels.data[i] = d;
        }

        ctx.putImageData(pixels, 0, 0);
    };
    

    var chartRange = function(values, color) {
        var circle = svg.selectAll("rect")
        .data(values)
        .attr("x", function(d, i) { console.log(d, d*2); return d * (testWidth/n); })
        .attr('fill', color);
    };


    // Set up sliders to render specified channel when they slide
    $("#slider_blue").slider({
        range: true,
        min: 0,
        max: 255,
        values: [0, 255],
        start: function() {
            plotHistogram(0);
        },
        slide: function(event, ui) {
            render(2, ui.values[0], ui.values[1]);
            chartRange(ui.values, 'blue');
        }
    });

    $("#slider_green").slider({
        range: true,
        min: 0,
        max: 255,
        values: [0, 255],
        start: function() {
            plotHistogram(1);
        },
        slide: function(event, ui) {
            render(1, ui.values[0], ui.values[1]);
            chartRange(ui.values, 'green');
        }
    });

    $("#slider_red").slider({
        range: true,
        min: 0,
        max: 255,
        values: [0, 255],
        start: function() {
            plotHistogram(2);
        },
        slide: function(event, ui) {
            render(0, ui.values[0], ui.values[1]);
            chartRange(ui.values, 'red');
        }
    });

    var updateImage = function(z) {
        img.src = "/webgateway/render_image/" + IMAGE_ID + "/" + z + "/0/";
    };

    updateImage(0);

    $("#zSlider").on('input', function(){
        $("#zIndex").html($(this).val());
    }).on('change', function(){
        updateImage($(this).val());
    });

});