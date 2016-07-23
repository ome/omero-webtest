


(function(){

    window.ImageDataManager = function(model) {

        var hiddencanvas = document.getElementById("hiddencanvas");
        var ctx1 = hiddencanvas.getContext("2d");

        var imageLoaders = [],
            loadedCount = 0,
            loadTime;

        this.getImgAndCoords = function(theZ, theT) {
            var s;
            for (var i=0; i<imageLoaders.length; i++) {
                if (imageLoaders[i].containsPlane(theZ, theT)) {
                    s = imageLoaders[i].getImgAndCoords(theZ, theT);
                    break;
                }
            }
            return s;
        };


        // this.getData = function(img, x, y, width, height) {
        this.getData = function(theZ, theT) {
            var s = this.getImgAndCoords(theZ, theT);
            if (!s) {
                return;
            }
            hiddencanvas.width = s.width;
            hiddencanvas.height = s.height;
            // var ctx1 = hiddencanvas.getContext("2d");
            ctx1.drawImage(s.img, s.x, s.y, s.width, s.height, 0, 0, s.width, s.height);
            var data = ctx1.getImageData(0, 0, s.width, s.height);
            return data;
        };


        var loaderCallback = function(msg) {
            if (msg === "loaded") {
                loadedCount++;

                var s = loadedCount + "/" + imageLoaders.length + " loaded";
                s += " in " + ((new Date() - loadTime)/1000) + " s";

                // Try to drawPlane() even though current plane may not be loaded yet...
                // drawPlane();
                model.trigger("loaded", [s]);
            }
        };


        var loadImageStack = function() {

            var sizeX = model.get('sizeX'),
                sizeY = model.get('sizeY'),
                sizeZ = model.get('sizeZ'),
                sizeT = model.get('sizeT'),
                currZ = model.get('theZ'),
                currT = model.get('theT'),
                imageId = model.get('id'),
                cQuery = model.getQueryString();
     
            // ctx = canvas.getContext("2d");
            // ctx.fillStyle = "rgb(200,200,200)";

            // create list of images to load planes
            var img,
                zStart = 0,
                zStop = 0,
                tStart = 0,
                tStop = 0,
                planesPerLoader = 10;

            loadedCount = 0;
            imageLoaders = [];
            loadTime = new Date();
            console.log('t', tStart, sizeT, 'z', zStart, sizeZ);
            for (var t=0; tStart<sizeT; t++) {
                if (sizeZ === 1) {
                    tStop = tStart + planesPerLoader;
                } else {
                    tStop = tStart;
                }
                for (var z=0; zStop<=sizeZ; z++) {
                    zStop = zStart + planesPerLoader;
                    img = new MultiPlaneImage(imageId, WEBTEST, sizeX, sizeY,
                        zStart, Math.min(zStop, sizeZ-1),
                        tStart, Math.min(tStop, sizeT-1),
                        loaderCallback,
                        cQuery);
                    imageLoaders.push(img);
                    zStart += planesPerLoader + 1;
                }
                tStart = tStop + 1;
                zStart = 0;
                zStop = 0;
            }
        };

        model.on('refreshImage', function(){
            loadImageStack();
        });

        model.on('change:id', function() {
            loadImageStack();
        });

    };

})();
