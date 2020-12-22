import * as tf from '@tensorflow/tfjs-core';
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

    const input = document.getElementById('myImg');
    if (!input.src || !input.src.length || input.src.length === 0) {
      console.log('Failed! Please load an image first.');
      return;
    }
    if (input.complete && input.naturalHeight !== 0) {
        runPrediction(input);
    } else {
        input.onload = () => {
            runPrediction(input);
        };
    }
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
};

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