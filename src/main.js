console.log("Hello, world 👋🏽")

// window.$ = window.jQuery = jquery;

$(() =>{
    $("#uploadBtn, #img-canvas").on("click", () => {
        $("#uploadImg").trigger("click")
    })

    $("#uploadImg").on("change", (e) => {
        handleImage(e);
    })

    initializeCanvas();
})

const MAX_HEIGHT = 500;

const initializeCanvas = () => {
    let canvas = document.getElementById("img-canvas")
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "gray";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let text = "Upload an image here";
    ctx.fillStyle = "black";
    ctx.font = '20px sans-serif';
    let textWidth = ctx.measureText(text).width;

    ctx.fillText(text, (canvas.width/2) - (textWidth / 2), canvas.height/2);
}

const handleImage = (e) => {
    let reader = new FileReader();
    reader.onload = function(evt) {
        let img = new Image();
        let canvas = document.getElementById("img-canvas")
        let ctx = canvas.getContext("2d");
        img.onload = function(){
            let ratio = 1 * Math.min(img.height, MAX_HEIGHT) / img.height;
            canvas.width = ratio * img.width;
            canvas.height = ratio * img.height;
            console.log(canvas);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        img.onerror = function(){
            console.error("Couldn't load the image file");
        }
        img.src = evt.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
}