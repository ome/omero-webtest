

(function(){

    window.UiControls = function(model, imageDataManager) {

        var zslider_el = document.getElementById('zslider');
        var theZ_el = document.getElementById('theZ');
        var tslider_el = document.getElementById('tslider');
        var theT_el = document.getElementById('theT');
        var zoomSlider_el = document.getElementById('zoomslider');
        var zoom_el = document.getElementById('zoom');
        var status_el = document.getElementById('status');
        var refreshImage_el = document.getElementById('refreshImage');
        var playMovie_el = document.getElementById('playMovie');
        var frameDelay = 200;  //millisecs
        var framesPerSec_el = document.getElementById('framesPerSec');
        var sliderValues = [];
        var canvas = document.getElementById('tSliderCanvas'),
            ctx = canvas.getContext("2d");
        var thumbSize = 50;
        var canvas2 = document.getElementById('tSliderCanvas2'),
            ctx2 = canvas2.getContext("2d");
        canvas.width = window.innerWidth * 0.9;
        canvas.height = thumbSize * 2;
        canvas2.width = window.innerWidth * 0.9;
        canvas2.height = thumbSize * 2;

        // Handle Z, T and zoom sliders
        zslider_el.addEventListener('input', function(){
            // theZ_el.innerHTML = this.value;
            model.set({'theZ': parseInt(this.value, 10)});
        });
        tslider_el.addEventListener('input', function(){
            // theT_el.innerHTML = this.value;
            model.set({'theT': parseInt(this.value, 10)});
        });
        zoomSlider_el.addEventListener('input', function(){
            zoom_el.innerHTML = this.value;
            model.set({'zoom': parseInt(this.value, 10)});
        });

        // Button to reload images
        refreshImage_el.addEventListener('click', function(){
            model.refreshImage();
        });


        var drawTsliderPlanes = function(extraT) {

            var theZ = model.get('theZ'),
                theT = model.get('theT'),
                sizeT = model.get('sizeT');

            // draw series of frames
            var src, xPos;
            var thumbSpacing = (canvas.width - thumbSize) / sizeT;
            var thumbsCount = canvas.width / thumbSize,
                tStep = parseInt(sizeT/thumbsCount, 10);
            // Make sure tStep is not 0 when sizeT is small
            tStep = Math.max(tStep, 1);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for(var t=0; t<sizeT; t+=tStep) {
                src = imageDataManager.getImgAndCoords(theZ, t);
                xPos = thumbSpacing * t;
                if (src) {
                    ctx.drawImage(src.img, src.x, src.y, src.width, src.height, xPos, 25, thumbSize, thumbSize);
                }
            }
            drawTsliderPlaneT();
        };

        var drawTsliderPlaneT = function(zoomedT) {
            var theZ = model.get('theZ'),
                theT = model.get('theT'),
                sizeT = model.get('sizeT');

            var thumbSpacing = (canvas.width - thumbSize) / sizeT;
            ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
            // now draw actual T-position
            var highlightPlane = function(planeT, zoom) {
                var thumbZoom = thumbSize * zoom;
                var offset = (thumbSize - thumbZoom) / 2;
                var src = imageDataManager.getImgAndCoords(theZ, planeT);
                var xPos = (thumbSpacing * planeT) + offset;
                if (src) {
                    ctx2.drawImage(src.img, src.x, src.y, src.width, src.height, xPos, offset + 25, thumbZoom, thumbZoom);
                }
                ctx2.strokeStyle = "rgb(255,255,200)";
                ctx2.strokeRect(xPos, offset + 25, thumbZoom, thumbZoom);
            };
            highlightPlane(theT, 1);
            if (zoomedT !== undefined) {
                highlightPlane(zoomedT, 1.2);
            }
        };

        canvas2.addEventListener('mousemove', function(event){
            var offset = canvas.getBoundingClientRect();
            var mouseX = event.clientX - offset.left;
            var theT = model.get('sizeT') * mouseX / (canvas.width - thumbSize);
            theT = parseInt(Math.round(theT), 10);
            drawTsliderPlaneT(theT);
        });
        canvas2.addEventListener('click', function(event){
            var offset = canvas.getBoundingClientRect();
            var mouseX = event.clientX - offset.left;
            var theT = model.get('sizeT') * mouseX / (canvas.width - thumbSize);
            theT = parseInt(Math.round(theT), 10);
            model.set('theT', theT);
        });

        framesPerSec_el.addEventListener('input', function(event){
            frameDelay = parseInt(1000/this.value, 10);
        });

        playMovie_el.addEventListener('click', function(event) {
            if (event.target.checked) {
                playMovie();
            }
        });

        var playMovie = function() {
            if (playMovie_el.checked) {
                var newT = model.get('theT') + 1;
                if (newT == model.get('sizeT')) {
                    newT = 0;
                }
                model.set('theT', newT);
                setTimeout(playMovie, frameDelay);
            }
        };

        // This will simply hide mouse-over zoomed plane
        canvas2.addEventListener('mouseout', function(){
            drawTsliderPlaneT();
        });

        // Re-draw ALL Tplanes to show loading progress
        model.on("loaded", function(msg){
            drawTsliderPlanes();
        });

        // Re-draw ALL Tplanes for the new Z
        model.on('change:theZ', function(event, theT, model){
            drawTsliderPlanes();
        });

        // We ONLY re-draw theT plane
        model.on('change:theT', function(event, theT, model){
            drawTsliderPlaneT();
        });

        addWheelListener(canvas2, function( e ) {
            e.preventDefault();
            var prevT = model.get('theT'),
                sizeT = model.get('sizeT');

            var currT = prevT + e.deltaY;
            currT = Math.max(0, currT);
            currT = Math.min(sizeT-1, currT);
            if (prevT !== currT) {
                model.set('theT', currT);
            }
        });

        var buildChannelSliders = function(channels) {

            var _getSlideCb = function(idx, startEnd) {
                return function() {
                    if (startEnd === 'start') {
                        this.previousSibling.textContent = this.value;
                        model.setChannelStart(idx, this.value);
                    } else {
                        this.nextSibling.textContent = this.value;
                        model.setChannelEnd(idx, this.value);
                    }
                };
            };

            var channelPanes = document.querySelectorAll('.range-slider');
            // each channelPane has 2 sliders - one for start, one for end
            [].forEach.call(channelPanes, function(element, chIdx) {
                // we may have more html panes than image channels...
                // ...simply hide any we don't need!
                if (chIdx >= channels.length) {
                    element.style.display = 'none';
                    return;
                }
                var ch = channels[chIdx];

                element.style.background = '#' + ch.color;
                // set min & max of both sliders
                var win = ch.window;
                sliderValues.push([win.start, win.end]);
                [].forEach.call(element.childNodes, function(child, i) {
                    if (child.nodeName === 'INPUT') {
                        child.setAttribute('min', win.min);
                        child.setAttribute('max', win.max);
                        if (child.className === 'chStart') {
                            child.value = win.start;
                            child.oninput = _getSlideCb(chIdx, 'start');
                        }
                        if (child.className === 'chEnd') {
                            child.value = win.end;
                            child.oninput = _getSlideCb(chIdx, 'end');
                        }
                    } else if (child.className === 'chStartTxt') {
                        child.textContent = win.start;
                    } else if (child.className === 'chEndTxt') {
                        child.textContent = win.end;
                    }
                });
            });
        };

        model.on("loaded", function(msg){
            status_el.textContent = msg;
        });

        model.on('change:channels', function(){
            var channels = model.get('channels');
            buildChannelSliders(channels);
        });

        model.on('change:theZ', function(){
            var theZ = model.get('theZ');
            zslider_el.value = theZ;
            theZ_el.innerHTML = theZ;
        });

        model.on('change:theT', function(){
            var theT = model.get('theT');
            tslider_el.value = theT;
            theT_el.innerHTML = theT;
        });

        model.on('change:sizeZ', function(){
            // Z and T sliders...
            var sizeZ = model.get('sizeZ'),
                sizeT = model.get('sizeT');
            if (sizeZ === 1) {
                zslider_el.setAttribute('disabled', true);
            } else {
                var theZ = model.get('theZ');
                theZ_el.innerHTML = theZ;
                zslider_el.setAttribute('max', sizeZ-1);
                zslider_el.value = theZ;
            }
            if (sizeT === 1) {
                tslider_el.setAttribute('disabled', true);
            } else {
                var theT = model.get('theT');
                tslider_el.setAttribute('max', sizeT-1);
                tslider_el.value = theT;
                theT_el.innerHTML = theT;
            }
        });

    };

})();
        