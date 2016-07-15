

(function(){

    window.ImageCanvas = function(model, imageDataManager) {

        var canvas = document.getElementById("canvas"),
            ctx = canvas.getContext("2d");
        var tempCanvas = document.getElementById('tempCanvas'),
            tempCtx = tempCanvas.getContext("2d");
        console.log('tempCanvas', tempCanvas);
        console.log('tempCtx', tempCtx, ctx);


        // canvas should fill the window
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // TODO - set these to image size
        tempCanvas.width = window.innerWidth;
        tempCanvas.height = window.innerHeight;


        var maxIntensityProjection = function(imgDataList) {

            var firstPlane = imgDataList[0],
                plane,
                l = firstPlane.data.length / 4;
            var r, red, g, green, b, blue;
            // iterate through each plane...
            for (var p=1; p<imgDataList.length; p++) {
                plane = imgDataList[p];
                // Go through each pixel, saving max to firstPlane
                for (var i = 0; i < l; i++) {
                    r = firstPlane.data[i * 4 + 0];
                    red = plane.data[i * 4 + 0];
                    firstPlane.data[i * 4 + 0] = Math.max(r, red);
                    g = firstPlane.data[i * 4 + 1];
                    green = plane.data[i * 4 + 1];
                    firstPlane.data[i * 4 + 1] = Math.max(g, green);
                    b = firstPlane.data[i * 4 + 2];
                    blue = plane.data[i * 4 + 2];
                    firstPlane.data[i * 4 + 2] = Math.max(b, blue);
                }
            }
            return firstPlane;
        };


        var renderPlane = function(plane, loadedChannels, channels) {
            // plane is 0-255 already rendered according to 'loadedChannels'
            // we want to re-render to current 'channels'
            var allSame = loadedChannels.reduce(function(prev, lc, i){
                return (prev && lc.window.start == channels[i].window.start &&
                    lc.window.end == channels[i].window.end);
            }, true);
            if (allSame) {
                // requested rendering 'channels' are same as plane's loadedChannels
                return plane;
            }
            var p = plane.data;
            var l = p.length / 4;
            var r = channels.red,
                g = channels.green,
                b = channels.blue;
            var fRed = function(v) {return v;},
                fGreen = function(v) {return v;},
                fBlue = function(v) {return v;};
            // for each channel, we map plane pixel intensity back to
            // the original raw pixel value, and then map that to
            // the new rendering settings
            loadedChannels.forEach(function(lc, i){
                var start = lc.window.start,
                    end = lc.window.end,
                    newStart = channels[i].window.start,
                    newEnd = channels[i].window.end,
                    color = lc.color;
                if (start !== newStart || end !== newEnd) {
                    var f = function(red) {
                        // raw pixel value is a value between 0 - 255 where
                        // 0 == start and 255 is end
                        var raw = ((red/255) * (end - start)) + start;
                        return ((raw - newStart) / (newEnd - newStart)) * 255;
                    };
                    // assign this mapping to the correct function/channel...
                    if (color === 'FF0000') {fRed = f;}
                    else if (color === '00FF00') {fGreen = f;}
                    else if (color === '0000FF') {fBlue = f;}
                }
            });
            // ...finally apply functions to every red/green/blue pixel
            for (var i = 0; i < l; i++) {
                red = fRed(plane.data[i * 4 + 0]);
                plane.data[i * 4 + 0] = red;
                green = fGreen(plane.data[i * 4 + 1]);
                plane.data[i * 4 + 1] = green;
                blue = fBlue(plane.data[i * 4 + 2]);
                plane.data[i * 4 + 2] = blue;
            }
            return plane;
        };


        // The main rendering function - to get data from the store, manipulate
        // as needed and paint it onto the main canvas
        var drawPlane = function() {

            var theZ = model.get('theZ'),
                theT = model.get('theT'),
                sizeX = model.get('sizeX'),
                sizeY = model.get('sizeY'),
                sizeT = model.get('sizeT'),
                zoom = model.get('zoom'),
                channels = model.get('channels'),
                loadedChannels = model.get('loadedChannels');

            zoom = zoom/100;

            var canvW = sizeX * zoom;
            var canvH = sizeY * zoom;

            tempCanvas.width = sizeX;
            tempCanvas.height = sizeY;

            ctx.fillStyle = "rgb(100,100,100)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            canvX = (canvas.width - canvW) / 2;
            canvY = (canvas.height - canvH) / 2;

            // Handle single Time-point...
            var tenvelope = parseInt(document.getElementById('tenvelope').value, 10);
            var s, plane;
            if (tenvelope == 1) {
                plane = imageDataManager.getData(theZ, theT);
            } else {
                // Otherwise - T-projection...
                var maxPlane;
                var t1 = Math.max(0, theT - tenvelope),
                    t2 = Math.min(sizeT, theT + tenvelope);
                // plane = imageDataManager.getData(theZ, theT);
                for(var t=t1; t<=t2; t++) {
                    plane = imageDataManager.getData(theZ, t);
                    if (!plane) continue;
                    // first time through loop - start with single plane...
                    if (!maxPlane) {
                        maxPlane = plane;
                    } else {
                        // ... then accumulate other planes with maxPlane
                        // this way, we never have a whole stack of planes in hand
                        maxPlane = maxIntensityProjection([maxPlane, plane]);
                    }
                }
                plane = maxPlane;
            }

            if (plane) {
                // apply client-side rendering settings
                plane = renderPlane(plane, loadedChannels, channels);
                // Put Data onto temp canvas at 100%, then draw onto full canvas to scale!
                tempCtx.putImageData(plane, 0, 0);
                ctx.drawImage(tempCanvas, 0, 0, sizeX, sizeY, canvX, canvY, canvW, canvH);
            }
        };

        window.onresize = function(){
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawPlane();
        };


        addWheelListener(canvas, function( e ) {
            e.preventDefault();
            var prevZ = model.get('theZ'),
                sizeZ = model.get('sizeZ');

            var currZ = prevZ + e.deltaY;
            console.log('prevZ, currZ, e.deltaY', prevZ, currZ, e.deltaY);
            currZ = Math.max(0, currZ);
            currZ = Math.min(sizeZ-1, currZ);

            console.log(prevZ, currZ);
            if (prevZ !== currZ) {
                model.set('theZ', currZ);
            }
        });

        model.on("loaded", function(msg){
            drawPlane();
        });

        model.on('change:theZ change:theT change:zoom change:channels', function(){
            drawPlane();
        });
    };

})();
