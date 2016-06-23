

(function(){

    window.UiControls = function(model) {

        var zslider_el = document.getElementById('zslider');
        var theZ_el = document.getElementById('theZ');
        var tslider_el = document.getElementById('tslider');
        var theT_el = document.getElementById('theT');
        var zoomSlider_el = document.getElementById('zoomslider');
        var zoom_el = document.getElementById('zoom');
        var status_el = document.getElementById('status');
        var refreshImage_el = document.getElementById('refreshImage');


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
        