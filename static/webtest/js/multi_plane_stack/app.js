
// image dimensions
var imageId;
var sizeX;
var sizeY;
var sizeZ;
var currZ = 0;
var currZoom = 100;

var canvas = document.getElementById("canvas"),
    ctx;
var theZ = document.getElementById('theZ');
var zoomSpan = document.getElementById('zoom');
var statusElement = document.getElementById('status');

var imageLoaders = [],
    loadedCount = 0,
    loadTime;

console.log(window.innerHeight);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


var drawPlane = function(theZ, zoom) {

    zoom = zoom || currZoom;
    theZ = theZ || currZ;
    currZ = theZ;
    currZoom = zoom;

    document.getElementById('zslider').value = currZ;
    theZ.innerHTML = currZ;
    zoomSpan.innerHTML = currZoom;

    var theT = 0;
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
    if (!s) {
        console.log("Failed to find Loader");
        return;
    }
    // var s = i.getImgAndCoords(z, 0);
    console.log(canvas.width, 'canvas.width');
    canvX = (canvas.width - canvW) / 2;
    console.log('canvX', canvX);
    canvY = (canvas.height - canvH) / 2;

    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(s.img, s.x, s.y, s.width, s.height, canvX, canvY, canvW, canvH);
};


document.getElementById('zslider').addEventListener('input', function(){
    drawPlane(parseInt(this.value, 10));
});


document.getElementById('zoomslider').addEventListener('input', function(){
    drawPlane(undefined, parseInt(this.value, 10));
});


addWheelListener(canvas, function( e ) {
    e.preventDefault();
    var prevZ = currZ;

    currZ += e.deltaY;
    currZ = Math.max(0, currZ);
    currZ = Math.min(sizeZ, currZ);

    if (prevZ !== currZ) {
        document.getElementById('zslider').value = currZ;
        theZ.innerHTML = currZ;
        drawPlane();
    }
});

var loaderCallback = function(msg) {
    if (msg === "loaded") {
        loadedCount++;

        var s = loadedCount + "/" + imageLoaders.length + " loaded";
        s += " in " + ((new Date() - loadTime)/1000) + " s";
        statusElement.innerHTML = s;

        if (loadedCount === imageLoaders.length) {
            drawPlane();
        }
    }
};


var loadImageStack = function(imgData) {

    sizeX = imgData.size.width;
    sizeY = imgData.size.height;
    sizeZ = imgData.size.z;
    currZ = imgData.rdefs.defaultZ;

    document.getElementById('zslider').setAttribute('max', sizeZ);

    imageId = imgData.id;
    // canvas.width = sizeX;
    // canvas.height = sizeY;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgb(200,200,200)";

    // create list of images to load planes
    var img,
        zStart = 0,
        zStop = 0,
        planesPerLoader = 10,
        tStart = 0,
        tStop = 0;

    loadedCount = 0;
    loadTime = new Date();
    for (var i=0; zStop<=sizeZ; i++) {
        zStop = zStart + planesPerLoader;
        console.log('creating loader zStart, zStop', zStart, Math.min(zStop, sizeZ));
        img = new MultiPlaneImage(imageId, '/webtest', sizeX, sizeY, zStart, Math.min(zStop, sizeZ-1), tStart, tStop, loaderCallback);
        imageLoaders.push(img);
        zStart += planesPerLoader + 1;
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



