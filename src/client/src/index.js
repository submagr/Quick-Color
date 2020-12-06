function handleImgUpload() {
    if (this.files && this.files[0]) {
        const imgID = `#myImg`;
        let img = document.querySelector(imgID);
        if (!img) {
            img = document.createElement("img");
            img.setAttribute("id", imgID);
            img.setAttribute("alt", "user uploaded img");
            img.setAttribute("height", 400);
            img.setAttribute("width", 400);
            document.body.appendChild(img);
        } 
        img.src = URL.createObjectURL(this.files[0]);
    }
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