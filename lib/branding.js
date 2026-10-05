const fs = require('fs');
const path = require('path');

const MAIN_IMAGE_PATH = path.join(__dirname, '../assets/nyx-main.jpg');
let mainImage;

function getMainImage() {
    if (mainImage === undefined) {
        try {
            mainImage = fs.readFileSync(MAIN_IMAGE_PATH);
        } catch (error) {
            mainImage = null;
            console.error('Branding image unavailable:', error.message);
        }
    }
    return mainImage;
}

module.exports = { MAIN_IMAGE_PATH, getMainImage };
