import * as deeplab from '@tensorflow-models/deeplab';


function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}

/** Source: https://gist.github.com/mjackson/5311256
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;

    var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return [h, s, l];
}

/** Source: https://gist.github.com/mjackson/5311256
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r * 255, g * 255, b * 255];
}


function handleImgUpload() {
    if (this.files && this.files[0]) {
        const imgID = `myImg`;
        let img = document.querySelector(`#${imgID}`);
        if (!img) {
            img = document.createElement("img");
            img.setAttribute("id", imgID);
            img.setAttribute("alt", "user uploaded img");
            img.setAttribute("height", 400);
            const uploadedImgDiv = document.querySelector("#uploadedImage");
            uploadedImgDiv.appendChild(img);
        }
        img.src = URL.createObjectURL(this.files[0]);

        runDeepLab();
    }
}

function getUploadedImage() {
    let promise = new Promise(function(resolve, reject) {
        const input = document.getElementById('myImg');
        if (!input.src || !input.src.length || input.src.length === 0) {
            reject(new Error("Img src is not present"));
        }
        if (input.complete && input.naturalHeight !== 0) {
            resolve(input);
        } else {
            input.onload = () => {
                resolve(input);
            };
        }
    });
    return promise;
}

const modelName = `ade20k`;
let deeplab_model;
const runDeepLab = async () => {
    if (!deeplab_model) {
        console.log('Loading the model...');
        // const loadingStart = performance.now();
        deeplab_model = deeplab.load({
            base: modelName,
            quantizationBytes: 2, 
        });
        await deeplab_model;
        console.log(`Loaded the model`)
    }

    getUploadedImage().then((img) => {
        runPrediction(img);
    }).catch((err) => {
        console.log(err);
    })
}

const runPrediction = (input) => {
    deeplab_model.then((model) => {
      model.segment(input).then((output) => {
        displaySegmentationMap(output);
        console.log(`Ran ...`);
      });
    });
};

var segmentationMapData;
var legendG;
var origImgData;
const displaySegmentationMap = (deeplabOutput) => {
    const {
        legend,
        height,
        width,
        segmentationMap
    } = deeplabOutput;
    const canvas = document.getElementById('output-image');
    const ctx = canvas.getContext('2d');

    // XXX: Temporary hack to make these available later.
    legendG = legend
    segmentationMapData = new ImageData(segmentationMap, width, height);
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(segmentationMapData, 0, 0);
    // display original image first
    var dispPromise = new Promise(function(resolve, reject) {
        getUploadedImage()
        .then((img) => {
            const canvas = document.getElementById("overlay-image");
            canvas.width = segmentationMapData.width;
            canvas.height = segmentationMapData.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, segmentationMapData.width, segmentationMapData.height);
            resolve();
        })
        .catch((err) => {
            console.log(err);
            reject(err);
        })
    });
    dispPromise.then(overlayImage);
};

function getPCValue(curr, pc) {
    let new_curr;
    if (pc < 0) {
        new_curr = curr + pc * curr;
    } else {
        new_curr = curr + pc * (1 - curr);
    }
    return new_curr
}

function overlayImage() {
    const dstRGB = hexToRgb(document.querySelector("#dstH").value);
    const dstHSL = rgbToHsl(dstRGB.r, dstRGB.g, dstRGB.b);
    const dstLPC = parseFloat(document.querySelector("#dstLPC").value) / 100 // dst lightness percentage change
    const dstSPC = parseFloat(document.querySelector("#dstSPC").value) / 100 // dst lightness percentage change

    const canvas = document.getElementById("overlay-image");
    var ctx = canvas.getContext("2d");
    if (origImgData == undefined) {
        origImgData = ctx.getImageData(0, 0, canvas.scrollWidth, canvas.scrollHeight);
    }

    let data = new Uint8ClampedArray(origImgData.data)
    let imgData = new ImageData(data, origImgData.width, origImgData.height);
    for (var i=0; i<segmentationMapData.data.length / 4; i++) {
        var r = segmentationMapData.data[i*4];
        var g = segmentationMapData.data[i*4 + 1];
        var b = segmentationMapData.data[i*4 + 2];
        for (let [k, v] of Object.entries(legendG)) {
            if (k == "sofa" && v[0] == r && v[1] == g && v[2] == b) {
                const srcRGB = {
                    "r": origImgData.data[i * 4],
                    "g": origImgData.data[i * 4 + 1],
                    "b": origImgData.data[i * 4 + 2]
                };
                let srcHSL = rgbToHsl(srcRGB.r, srcRGB.g, srcRGB.b);
                let blendColor = hslToRgb(dstHSL[0], getPCValue(srcHSL[1], dstSPC), getPCValue(srcHSL[2], dstLPC));
                imgData.data[i*4] = blendColor[0];
                imgData.data[i*4 + 1] = blendColor[1];
                imgData.data[i*4 + 2] = blendColor[2];
            }
        }
    }
    const canvas2 = document.getElementById('overlay-image');
    const ctx2 = canvas2.getContext('2d');
    canvas2.width = canvas.scrollWidth;
    canvas2.height = canvas.scrollHeight;
    ctx2.putImageData(imgData, 0, 0);
}

function onWindowLoad() {
    // Register Image Uplaod
    const inputEl = document.querySelector(`input[type="file"]`)
    if (inputEl) {
        inputEl.addEventListener("change", handleImgUpload);
    } else {
        console.error("Couldn't find input type file element for image upload");
    }

    const colorPickerEl = document.querySelector(`#dstH`)
    if (colorPickerEl) {
        colorPickerEl.addEventListener("change", overlayImage);
    }
    const dstSPC = document.querySelector(`#dstSPC`)
    if (dstSPC) {
        dstSPC.addEventListener("change", overlayImage);
    }
    const dstLPC = document.querySelector(`#dstLPC`)
    if (dstLPC) {
        dstLPC.addEventListener("change", overlayImage);
    }
}
window.addEventListener(`load`, onWindowLoad);