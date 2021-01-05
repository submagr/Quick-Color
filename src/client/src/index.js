import * as deeplab from '@tensorflow-models/deeplab';

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

const displaySegmentationMap = (deeplabOutput) => {
    const {
        legend,
        height,
        width,
        segmentationMap
    } = deeplabOutput;
    const canvas = document.getElementById('output-image');
    const ctx = canvas.getContext('2d');

    const segmentationMapData = new ImageData(segmentationMap, width, height);
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(segmentationMapData, 0, 0);
    overlayImage(legend, segmentationMapData);
};

function overlayImage(legend, segmentationMapData) {
    // display original image first
    var dispPromise = new Promise(function(resolve, reject) {
        getUploadedImage()
        .then((img) => {
            const canvas = document.getElementById("overlay-image");
            canvas.width = segmentationMapData.width;
            canvas.height = segmentationMapData.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, segmentationMapData.width, segmentationMapData.height);
            resolve([canvas, ctx]);
        })
        .catch((err) => {
            console.log(err);
            reject(err);
        })
    });

    dispPromise.then((args) => {
        const canvas = args[0];
        var ctx = args[1];
        var imgData = ctx.getImageData(0, 0, canvas.scrollWidth, canvas.scrollHeight);
        // get segmentation map 
        for (var i=0; i<segmentationMapData.data.length / 4; i++) {
            var r = segmentationMapData.data[i*4];
            var g = segmentationMapData.data[i*4 + 1];
            var b = segmentationMapData.data[i*4 + 2];
            for (let [k, v] of Object.entries(legend)) {
                if (k == "sofa" && v[0] == r && v[1] == g && v[2] == b) {
                    imgData.data[i*4] = 255;
                    imgData.data[i*4 + 1] = 0;
                    imgData.data[i*4 + 2] = 0;
                }
            }
        }
        const canvas2 = document.getElementById('overlay-image');
        const ctx2 = canvas2.getContext('2d');
        canvas2.width = canvas.scrollWidth;
        canvas2.height = canvas.scrollHeight;
        ctx2.putImageData(imgData, 0, 0);
    })
}

function onWindowLoad() {
    // Register Image Uplaod
    const inputEl = document.querySelector(`input[type="file"]`)
    if (inputEl) {
        inputEl.addEventListener("change", handleImgUpload);
    } else {
        console.error("Couldn't find input type file element for image upload");
    }
}
window.addEventListener(`load`, onWindowLoad);