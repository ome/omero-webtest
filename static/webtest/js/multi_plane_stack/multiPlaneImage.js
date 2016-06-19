

var MultiPlaneImage = function(imageId, baseUrl, sizeX, sizeY, zStart, zStop, tStart, tStop, callback, rdef) {

    var img = new Image();

    var status = "unloaded";  // 'loading', 'loaded'

    img.onload = function() {
        status = "loaded";
        callback("loaded");
    };

    var getSrcUrl = function() {
        var url = baseUrl + '/render_multi_planes/' + imageId + '/?theZ=' + zStart;
        if (zStop !== zStart) {
            url += '-' + zStop;
        }
        url += '&theT=' + tStart;
        if (tStart !== tStop) {
            url += '-' + tStop;
        }
        return url;
    };

    this.getStatus = function() {
        return status;
    };

    this.load = function() {
        console.log('loading... ', getSrcUrl());
        status = "loading";
        img.src = getSrcUrl();
    };

    this.getImgAndCoords = function(theZ, theT) {
        if (!this.containsPlane()) {
            console.log('MultiPlaneImage doesnt contain plane: z, t:', theZ, theT);
            return;
        }
        if (status !== "loaded") {
            console.log('Not yet loaded z, t:', theZ, theT);
        }
        var offset = (theZ - zStart) + (theT - tStart);
        // image is simply a row of planes - offset is sizeX * offset
        return {'img':img,
                'x': offset * sizeX,
                'y': 0,
                'width': sizeX,
                'height': sizeY};
    };

    this.containsPlane = function(z, t) {
        if (z < zStart) return false;
        if (z > zStop) return false;
        if (t < tStart) return false;
        if (t > tStop) return false;
        return true;
    };


    this.load();

};
