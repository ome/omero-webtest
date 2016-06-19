

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
            // channels is E.g. {'red': start, end, newStart, newEnd}
            // Go through each pixel, saving max to firstPlane
            // console.log('renderPlane', channels);
            var p = plane.data;
            var l = p.length / 4;
            var r = channels.red,
                g = channels.green,
                b = channels.blue;
            var fRed = function(v) {return v;},
                fGreen = function(v) {return v;},
                fBlue = function(v) {return v;};
            loadedChannels.forEach(function(lc, i){
                var start = lc.window.start,
                    end = lc.window.end,
                    newStart = channels[i].window.start,
                    newEnd = channels[i].window.end,
                    color = lc.color;
                // console.log('start, end, newStart, newEnd', start, end, newStart, newEnd);
                if (start !== newStart || end !== newEnd) {
                    var f = function(red) {
                        // input value is a value between 0 - 255 where
                        // 0 == start and 255 is end
                        var input = ((red/255) * (end - start)) + start;
                        return ((input - newStart) / (newEnd - newStart)) * 255;
                    };
                    if (color === 'FF0000') {fRed = f;}
                    else if (color === '00FF00') {fGreen = f;}
                    else if (color === '0000FF') {fBlue = f;}
                }
            });
            // if (r) {
            //     fRed = function(red) {
            //         // input value is a value between 0 - 255 where
            //         // 0 == start and 255 is end
            //         var input = ((red/255) * (r.end - r.start)) + r.start;
            //         return ((input - r.newStart) / (r.newEnd - r.newStart)) * 255;
            //     };
            // } else {
            //     fRed = function(red) {return red;};
            // }
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

        var drawPlane = function() {

            // data = data || {};
            // zoom = data.zoom !== undefined ? data.zoom : currZoom;
            // theZ = data.theZ !== undefined ? data.theZ : currZ;
            // theT = data.theT !== undefined ? data.theT : currT;
            // currZ = theZ;
            // currT = theT;
            // currZoom = zoom;

            // zoom_el.innerHTML = currZoom;

            var theZ = model.get('theZ'),
                theT = model.get('theT'),
                sizeX = model.get('sizeX'),
                sizeY = model.get('sizeY'),
                zoom = model.get('zoom'),
                channels = model.get('channels'),
                loadedChannels = model.get('loadedChannels');
            console.log('drawPlane', zoom, canvas.width, canvas.height);

            zoom = zoom/100;

            var canvW = sizeX * zoom;
            var canvH = sizeY * zoom;
            console.log('canvW, canvH', canvW, canvH);


            ctx.fillStyle = "rgb(100,100,100)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            canvX = (canvas.width - canvW) / 2;
            canvY = (canvas.height - canvH) / 2;

            // Handle single Time-point...
            var tenvelope = parseInt(document.getElementById('tenvelope').value, 10);
            var s;
            if (tenvelope == 1) {
                // s = imageDataManager.getImgAndCoords(theZ, theT);
                // if (s) {
                var plane = imageDataManager.getData(theZ, theT);
                // Draw plane from source image onto canvas, scaling etc.
                if (plane) {
                    // var redCh = loadedChannels[1].window;
                    // var newCh = channels[1].window;
                    // var renderRed = {'start': redCh.start, 'end': redCh.end,
                    //     'newStart': newCh.start, 'newEnd': newCh.end};
                    
                    // plane = renderPlane(plane, {'red': renderRed});
                    plane = renderPlane(plane, loadedChannels, channels);

                    // ctx.drawImage(s.img, s.x, s.y, s.width, s.height, canvX, canvY, canvW, canvH);
                    // var ctx1 = hiddencanvas.getContext("2d");
                    tempCanvas.width = sizeX;
                    tempCanvas.height = sizeY;
                    tempCtx.putImageData(plane, 0, 0);
                    ctx.drawImage(tempCanvas, 0, 0, sizeX, sizeY, canvX, canvY, canvW, canvH);
                }
            } else {
                // Otherwise - T-projection...
                var maxPlane;
                var t1 = Math.max(0, theT - tenvelope),
                    t2 = Math.min(sizeT, theT + tenvelope);
                for(var t=t1; t<=t2; t++) {
                    s = getImgAndCoords(theZ, t);
                    if (!s) continue;
                    var d = getData(s.img, s.x, s.y, s.width, s.height);
                    if (!maxPlane) {
                        maxPlane = d;
                    } else {
                        // accumulate current plane with maxPlane
                        maxPlane = maxIntensityProjection([maxPlane, d]);
                    }
                }
                // Put Data onto temp canvas at 100%, then draw onto full canvas to scale!
                ctx1.putImageData(maxPlane, 0, 0);
                ctx.drawImage(hiddencanvas, 0, 0, hiddencanvas.width, hiddencanvas.height, canvX, canvY, canvW, canvH);
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
