import util from './util';

class ImageManager {
    constructor() {
        this.baseUrl = '';
    }

    getImages(label) {
        console.log('imageManager:getImages: ', label);
        return util.GET(`${this.baseUrl}/fw-image/image?label=${label}`);
    }


    getImage(id) {
        return util.GET(`${this.baseUrl}/image/${id}`);
    }


    addImage(image) {
        return util.POST(`${this.baseUrl}/fw-image/image/`, image);
    }

    setBinary(image) {
        return util.POST_MULTIPART(`${this.baseUrl}/fw-image/image/${image.image_id}/binary`, image);
    }

    deleteBinary(id) {
        return util.DELETE(`${this.baseUrl}/fw-image/image/${id}/binary`);
    }

    deleteImage(id) {
        return util.DELETE(`${this.baseUrl}/fw-image/image/${id}`);
    }
}

const imageManager = new ImageManager();
export default imageManager;
