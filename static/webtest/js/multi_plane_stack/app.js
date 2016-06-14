
// image dimensions
var imageId;
var sizeX;
var sizeY;
var sizeZ;
var sizeT;
var currZ = 0;
var currT = 0;
var currZoom = 100;

var canvas = document.getElementById("canvas"),
    ctx;
var zslider_el = document.getElementById('zslider');
var theZ_el = document.getElementById('theZ');
var tslider_el = document.getElementById('tslider');
var theT_el = document.getElementById('theT');
var zoomSlider_el = document.getElementById('zoomslider');
var zoom_el = document.getElementById('zoom');
var status_el = document.getElementById('status');

var imageLoaders = [],
    loadedCount = 0,
    loadTime;

// canvas should fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


var drawPlane = function(data) {

    console.log('drawPlane', data);
    data = data || {};
    zoom = data.zoom !== undefined ? data.zoom : currZoom;
    theZ = data.theZ !== undefined ? data.theZ : currZ;
    theT = data.theT !== undefined ? data.theT : currT;
    currZ = theZ;
    currT = theT;
    currZoom = zoom;

    zoom_el.innerHTML = currZoom;

    console.log('drawPlane(), theZ, theT, zoom', theZ, theT, zoom);
    zoom = zoom/100;

    canvW = sizeX * zoom;
    canvH = sizeY * zoom;

    var s;
    console.log('finding loader...');
    for (var i=0; i<imageLoaders.length; i++) {
        if (imageLoaders[i].containsPlane(theZ, theT)) {
            console.log(' ...using loader:', i);
            s = imageLoaders[i].getImgAndCoords(theZ, theT);
            break;
        }
    }
    ctx.fillStyle = "rgb(200,200,200)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!s) {
        console.log("Failed to find Loader");
        return;
    }
    // var s = i.getImgAndCoords(z, 0);
    console.log(canvas.width, 'canvas.width');
    canvX = (canvas.width - canvW) / 2;
    console.log('canvX', canvX);
    canvY = (canvas.height - canvH) / 2;
    ctx.drawImage(s.img, s.x, s.y, s.width, s.height, canvX, canvY, canvW, canvH);
};

window.onresize = function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawPlane();
};

// Handle Z, T and zoom sliders
zslider_el.addEventListener('input', function(){
    theZ_el.innerHTML = this.value;
    drawPlane({'theZ': parseInt(this.value, 10)});
});
tslider_el.addEventListener('input', function(){
    theT_el.innerHTML = this.value;
    drawPlane({'theT': parseInt(this.value, 10)});
});
zoomSlider_el.addEventListener('input', function(){
    drawPlane({'zoom': parseInt(this.value, 10)});
});


addWheelListener(canvas, function( e ) {
    e.preventDefault();
    var prevZ = currZ;

    currZ += e.deltaY;
    currZ = Math.max(0, currZ);
    currZ = Math.min(sizeZ-1, currZ);

    if (prevZ !== currZ) {
        zslider_el.value = currZ;
        theZ_el.innerHTML = currZ;
        drawPlane();
    }
});

var loaderCallback = function(msg) {
    if (msg === "loaded") {
        loadedCount++;

        var s = loadedCount + "/" + imageLoaders.length + " loaded";
        s += " in " + ((new Date() - loadTime)/1000) + " s";
        status_el.innerHTML = s;

        // Try to drawPlane() even though current plane may not be loaded yet...
        drawPlane();
    }
};


var loadImageStack = function(imgData) {

    sizeX = imgData.size.width;
    sizeY = imgData.size.height;
    sizeZ = imgData.size.z;
    sizeT = imgData.size.t;
    currZ = imgData.rdefs.defaultZ;
    currT = imgData.rdefs.defaultT;

    console.log('currZ', currZ);
    if (sizeZ === 1) {
        zslider_el.setAttribute('disabled', true);
    } else {
        theZ_el.innerHTML = currZ;
        zslider_el.setAttribute('max', sizeZ-1);
        zslider_el.value = currZ;
    }
    if (sizeT === 1) {
        tslider_el.setAttribute('disabled', true);
    } else {
        tslider_el.setAttribute('max', sizeT-1);
        tslider_el.value = currT;
    }
    imageId = imgData.id;
    // canvas.width = sizeX;
    // canvas.height = sizeY;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgb(200,200,200)";

    // create list of images to load planes
    var img,
        zStart = 0,
        zStop = 0,
        planesPerLoader = 10;

    loadedCount = 0;
    loadTime = new Date();
    console.log('sizeT', sizeT);
    for (var tStart=0; tStart<sizeT; tStart++) {
        console.log('zStop = zStart + planesPerLoader;', zStop, zStart, planesPerLoader);
        for (var z=0; zStop<=sizeZ; z++) {
            zStop = zStart + planesPerLoader;
            console.log('creating loader zStart, zStop', zStart, Math.min(zStop, sizeZ));
            img = new MultiPlaneImage(imageId, '/webtest', sizeX, sizeY, zStart, Math.min(zStop, sizeZ-1), tStart, tStart, loaderCallback);
            imageLoaders.push(img);
            zStart += planesPerLoader + 1;
        }
        zStart = 0;
        zStop = 0;
    }
};

var q = window.location.search.substring(1);
var imageId = q.split('&').reduce(function(prev, p){
    var kv = p.split('=');
    if (prev) return prev;
    if (kv[0] === 'image') return kv[1];
}, undefined);

if (!imageId) {
    alert("Need imageId via query ?image=123");
}
var url = '/webgateway/imgData/' + imageId;
getJSON(url, function(data){
    console.log(data);

    loadImageStack(data);
});



