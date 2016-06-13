
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

var imageLoaders = [];


var drawPlane = function(theZ, zoom) {

    zoom = zoom || currZoom;
    theZ = theZ || currZ;
    currZ = theZ;
    currZoom = zoom;

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
    canvX = (s.width - canvW) / 2;
    canvY = (s.height - canvH) / 2;

    ctx.fillRect(0, 0, sizeX, sizeY);
    ctx.drawImage(s.img, s.x, s.y, s.width, s.height, canvX, canvY, canvW, canvH);
};


document.getElementById('zslider').addEventListener('input', function(){
    theZ.innerHTML = this.value;
    drawPlane(parseInt(this.value, 10));
});


document.getElementById('zoomslider').addEventListener('input', function(){
    zoomSpan.innerHTML = this.value;
    drawPlane(undefined, parseInt(this.value, 10));
});


addWheelListener(canvas, function( e ) {
    e.preventDefault();
    console.log( e.deltaY );
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


var loadImageStack = function(imgData) {

    sizeX = imgData.size.width;
    sizeY = imgData.size.height;
    sizeZ = imgData.size.z;

    document.getElementById('zslider').setAttribute('max', sizeZ);

    imageId = imgData.id;
    canvas.width = sizeX;
    canvas.height = sizeY;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgb(200,200,200)";

    // create list of images to load planes
    var img,
        zStart = 0,
        zStop = 0,
        planesPerLoader = 5,
        tStart = 0,
        tStop = 0;

    for (var i=0; zStop<=sizeZ; i++) {
        zStop = zStart + planesPerLoader;
        console.log('creating loader zStart, zStop', zStart, Math.min(zStop, sizeZ));
        img = new MultiPlaneImage(imageId, '/webtest', sizeX, sizeY, zStart, Math.min(zStop, sizeZ-1), tStart, tStop);
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



