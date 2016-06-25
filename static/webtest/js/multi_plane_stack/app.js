
// image dimensions
var imageId;
var sizeX;
var sizeY;
var sizeZ;
var sizeT;
var currZ = 0;
var currT = 0;
var currZoom = 100;
var imageChannels;
var sliderValues = [];

// var canvas = document.getElementById("canvas"),
//     ctx,
//     hiddencanvas = document.getElementById("hiddencanvas");
// var ctx1 = hiddencanvas.getContext("2d");
// var zslider_el = document.getElementById('zslider');
// var theZ_el = document.getElementById('theZ');
// var tslider_el = document.getElementById('tslider');
// var theT_el = document.getElementById('theT');
// var zoomSlider_el = document.getElementById('zoomslider');
// var zoom_el = document.getElementById('zoom');
// var status_el = document.getElementById('status');

// var imageLoaders = [],
//     loadedCount = 0,
//     loadTime;

// // canvas should fill the window
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;


// var getData = function(img, x, y, width, height) {
//     hiddencanvas.width = width;
//     hiddencanvas.height = height;
//     var ctx1 = hiddencanvas.getContext("2d");
//     ctx1.drawImage(img, x, y, width, height, 0, 0, width, height);
//     var data = ctx1.getImageData(0, 0, width, height);
//     return data;
// };


// var maxIntensityProjection = function(imgDataList) {

//     var firstPlane = imgDataList[0],
//         plane,
//         l = firstPlane.data.length / 4;
//     var r, red, g, green, b, blue;
//     // iterate through each plane...
//     for (var p=1; p<imgDataList.length; p++) {
//         plane = imgDataList[p];
//         // Go through each pixel, saving max to firstPlane
//         for (var i = 0; i < l; i++) {
//             r = firstPlane.data[i * 4 + 0];
//             red = plane.data[i * 4 + 0];
//             firstPlane.data[i * 4 + 0] = Math.max(r, red);
//             g = firstPlane.data[i * 4 + 1];
//             green = plane.data[i * 4 + 1];
//             firstPlane.data[i * 4 + 1] = Math.max(g, green);
//             b = firstPlane.data[i * 4 + 2];
//             blue = plane.data[i * 4 + 2];
//             firstPlane.data[i * 4 + 2] = Math.max(b, blue);
//         }
//     }
//     return firstPlane;
// };


// var getImgAndCoords = function(theZ, theT) {
//     var s;
//     console.log('finding loader...');
//     for (var i=0; i<imageLoaders.length; i++) {
//         if (imageLoaders[i].containsPlane(theZ, theT)) {
//             console.log(' ...using loader:', i);
//             s = imageLoaders[i].getImgAndCoords(theZ, theT);
//             break;
//         }
//     }
//     return s;
// };

// apply rendering settings to plane
// var renderPlane = function(plane, channels) {
//     // channels is E.g. {'red': start, end, newStart, newEnd}
//     // Go through each pixel, saving max to firstPlane
//     console.log('renderPlane', channels);
//     var p = plane.data;
//     var l = p.length / 4;
//     var r = channels.red,
//         g = channels.green,
//         b = channels.blue;
//     var fRed, fGreen, fBlue;
//     if (r) {
//         fRed = function(red) {
//             // input value is a value between 0 - 255 where
//             // 0 == start and 255 is end
//             var input = ((red/255) * (r.end - r.start)) + r.start;
//             return ((input - r.newStart) / (r.newEnd - r.newStart)) * 255;
//         };
//     } else {
//         fRed = function(red) {return red;};
//     }
//     for (var i = 0; i < l; i++) {
//         red = fRed(plane.data[i * 4 + 0]);
//         plane.data[i * 4 + 0] = red;
//         green = plane.data[i * 4 + 1];
//         blue = plane.data[i * 4 + 2];
//     }
//     return plane;
// };

// var drawPlane = function(data) {

//     data = data || {};
//     zoom = data.zoom !== undefined ? data.zoom : currZoom;
//     theZ = data.theZ !== undefined ? data.theZ : currZ;
//     theT = data.theT !== undefined ? data.theT : currT;
//     currZ = theZ;
//     currT = theT;
//     currZoom = zoom;

//     zoom_el.innerHTML = currZoom;

//     zoom = zoom/100;

//     canvW = sizeX * zoom;
//     canvH = sizeY * zoom;


//     ctx.fillStyle = "rgb(100,100,100)";
//     ctx.fillRect(0, 0, canvas.width, canvas.height);

//     canvX = (canvas.width - canvW) / 2;
//     canvY = (canvas.height - canvH) / 2;

//     // Handle single Time-point...
//     var tenvelope = parseInt(document.getElementById('tenvelope').value, 10);
//     var s;
//     if (tenvelope == 1) {
//         s = getImgAndCoords(theZ, theT);
//         if (s) {
//             var plane = getData(s.img, s.x, s.y, s.width, s.height);
//             // Draw plane from source image onto canvas, scaling etc.
            
//             var redCh = imageChannels[1].window;
//             console.log('sliderValues', sliderValues);
//             var newV = sliderValues[1];
//             var renderRed = {'start': redCh.start, 'end': redCh.end, 'newStart': newV[0], 'newEnd': newV[1]};
            
//             plane = renderPlane(plane, {'red': renderRed});
//             // ctx.drawImage(s.img, s.x, s.y, s.width, s.height, canvX, canvY, canvW, canvH);
//             // var ctx1 = hiddencanvas.getContext("2d");
//             ctx1.putImageData(plane, 0, 0);
//             ctx.drawImage(hiddencanvas, 0, 0, hiddencanvas.width, hiddencanvas.height, canvX, canvY, canvW, canvH);
    
//         }
//     } else {
//         // Otherwise - T-projection...
//         var maxPlane;
//         var t1 = Math.max(0, theT - tenvelope),
//             t2 = Math.min(sizeT, theT + tenvelope);
//         for(var t=t1; t<=t2; t++) {
//             s = getImgAndCoords(theZ, t);
//             if (!s) continue;
//             var d = getData(s.img, s.x, s.y, s.width, s.height);
//             if (!maxPlane) {
//                 maxPlane = d;
//             } else {
//                 // accumulate current plane with maxPlane
//                 maxPlane = maxIntensityProjection([maxPlane, d]);
//             }
//         }
//         // Put Data onto temp canvas at 100%, then draw onto full canvas to scale!
//         ctx1.putImageData(maxPlane, 0, 0);
//         ctx.drawImage(hiddencanvas, 0, 0, hiddencanvas.width, hiddencanvas.height, canvX, canvY, canvW, canvH);
//     }
// };

// window.onresize = function(){
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
//     drawPlane();
// };



// addWheelListener(canvas, function( e ) {
//     e.preventDefault();
//     var prevZ = currZ;

//     currZ += e.deltaY;
//     currZ = Math.max(0, currZ);
//     currZ = Math.min(sizeZ-1, currZ);

//     if (prevZ !== currZ) {
//         zslider_el.value = currZ;
//         theZ_el.innerHTML = currZ;
//         drawPlane();
//     }
// });

// var loaderCallback = function(msg) {
//     if (msg === "loaded") {
//         loadedCount++;

//         var s = loadedCount + "/" + imageLoaders.length + " loaded";
//         s += " in " + ((new Date() - loadTime)/1000) + " s";
//         status_el.innerHTML = s;

//         // Try to drawPlane() even though current plane may not be loaded yet...
//         drawPlane();
//     }
// };




// var loadImageStack = function(imgData) {

//     sizeX = imgData.size.width;
//     sizeY = imgData.size.height;
//     sizeZ = imgData.size.z;
//     sizeT = imgData.size.t;
//     currZ = imgData.rdefs.defaultZ;
//     currT = imgData.rdefs.defaultT;

//     buildChannelSliders(imgData.channels);

//     // Z and T sliders...
//     if (sizeZ === 1) {
//         zslider_el.setAttribute('disabled', true);
//     } else {
//         theZ_el.innerHTML = currZ;
//         zslider_el.setAttribute('max', sizeZ-1);
//         zslider_el.value = currZ;
//     }
//     if (sizeT === 1) {
//         tslider_el.setAttribute('disabled', true);
//     } else {
//         tslider_el.setAttribute('max', sizeT-1);
//         tslider_el.value = currT;
//     }
//     imageId = imgData.id;
//     // canvas.width = sizeX;
//     // canvas.height = sizeY;
//     ctx = canvas.getContext("2d");
//     ctx.fillStyle = "rgb(200,200,200)";

//     // create list of images to load planes
//     var img,
//         zStart = 0,
//         zStop = 0,
//         tStart = 0,
//         tStop = 0,
//         planesPerLoader = 10;

//     loadedCount = 0;
//     loadTime = new Date();
//     for (var t=0; tStart<sizeT; t++) {
//         if (sizeZ === 1) {
//             tStop = tStart + planesPerLoader;
//         } else {
//             tStop = tStart;
//         }
//         for (var z=0; zStop<=sizeZ; z++) {
//             zStop = zStart + planesPerLoader;
//             img = new MultiPlaneImage(imageId, '/webtest', sizeX, sizeY, zStart, Math.min(zStop, sizeZ-1), tStart, Math.min(tStop, sizeT-1), loaderCallback);
//             imageLoaders.push(img);
//             zStart += planesPerLoader + 1;
//         }
//         tStart = tStop + 1;
//         zStart = 0;
//         zStop = 0;
//     }
// };

var q = window.location.search.substring(1);
var imageId = q.split('&').reduce(function(prev, p){
    var kv = p.split('=');
    if (prev) return prev;
    if (kv[0] === 'image') return kv[1];
}, undefined);

if (!imageId) {
    alert("Need imageId via query ?image=123");
}

var model = new ImageModel();
var manager = new ImageDataManager(model);

new ImageCanvas(model, manager);
new UiControls(model, manager);

model.loadImage(imageId);




