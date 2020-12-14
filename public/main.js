// import * as tf from '@tensorflow/tfjs';
import * as deeplab from '@tensorflow-models/deeplab';

console.log("Hello, world 👋🏽")

window.onload = () => {
  // add upload actions
  const uploadBtn = document.getElementById("upload-btn");
  const uploadImg = document.getElementById("upload-img");
  const segmentBtn = document.getElementById("segment-img");
  
  uploadBtn.onclick = () => {
    uploadImg.click();
  }
  segmentBtn.onclick = () => {
    runSegmentation();
  }
  uploadImg.onchange = (evt) => {
    handleImage(evt);
  }

  // add hover actions
  const imgCanvas = document.getElementById("img-canvas");
  let hoveredColor = document.getElementById('hovered-color');
  let selectedColor = document.getElementById('selected-color');

  imgCanvas.addEventListener('mousemove', function(event) {
    pick(event, hoveredColor);
  });
  
  imgCanvas.addEventListener('click', function(event) {
    pick(event, selectedColor);
  });
      
  initializeCanvas();
}

const MAX_HEIGHT = 500;


const initializeCanvas = () => {
  const imgCanvas = document.getElementById("img-canvas");
  let ctx = imgCanvas.getContext("2d");
  ctx.fillStyle = "gray";
  ctx.fillRect(0, 0, imgCanvas.width, imgCanvas.height);
}

const pick = (event, destination) => {
  const ctx = document.getElementById("img-canvas").getContext("2d");
  var x = event.layerX;
  var y = event.layerY;
  var pixel = ctx.getImageData(x, y, 1, 1);
  var data = pixel.data;

  const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
  destination.style.background = rgba;
  destination.textContent = rgba;

  return rgba;
}

const handleImage = (e) => {
  const imgCanvas = document.getElementById("img-canvas");
  let reader = new FileReader();
  reader.onload = (evt) => {
    let img = new Image()
    let ctx = imgCanvas.getContext("2d");
    
    img.onload = () => {
        let ratio = 1 * Math.min(img.height, MAX_HEIGHT) / img.height;
        console.log(ratio)
        img.width = ratio * img.width;
        img.height = ratio * img.height;
        imgCanvas.width = img.width;
        imgCanvas.height = img.height;
        ctx.drawImage(img, 0, 0, imgCanvas.width, imgCanvas.height);
    }
    img.onerror = () => {
        console.error("Couldn't load the image file");
    }
    img.src = evt.target.result;
  }
  reader.readAsDataURL(e.target.files[0]);

  loadModel().then((model) => {
    console.log(model)
    console.log(`Loaded the model successfully!`)
  });
}

const loadModel = async () => {
  const modelName = 'pascal';   // set to your preferred model, either `pascal`, `cityscapes` or `ade20k`
  const quantizationBytes = 2;  // either 1, 2 or 4
  return await deeplab.load({base: modelName, quantizationBytes});
};

const runSegmentation = async () => {
  const imgCanvas = document.getElementById("img-canvas");
  console.time("loadModel");
  const model = await loadModel();
  console.timeEnd("loadModel");

  console.time("segment");
  model.segment(imgCanvas).then((output) => {
    displaySegmentationMap(output)
  });
  console.timeEnd("segment");
}

const displaySegmentationMap = (deeplabOutput) => {
  const {
      legend,
      height,
      width,
      segmentationMap
  } = deeplabOutput;
  console.log(width, height, legend)
  const canvas = document.getElementById('img-canvas');
  const ctx = canvas.getContext('2d');

  const segmentationMapData = new ImageData(segmentationMap, width, height);
  canvas.width = width;
  canvas.height = height;
  ctx.putImageData(segmentationMapData, 0, 0);
};
