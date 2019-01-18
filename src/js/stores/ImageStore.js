/* eslint-disable */
const alt = require('../alt');
const ImageActions = require('../actions/ImageActions');

class ImageStore {
    constructor() {
        this.new_image = {};
        this.images = {};

        this.images[1] = {
            id: 1, image_version: '1.1 aplha', created: 1547221430000, saved: true, image_hash: 'AFB1231BA21',
        };

        this.error = null;
        this.loading = false;

        this.bindListeners({
            handleUpdateImageList: ImageActions.UPDATE_IMAGES,
            handleFetchImageList: ImageActions.FETCH_IMAGES,
        
            handleTriggerInsertion: ImageActions.TRIGGER_INSERT,
            handleInsertImage: ImageActions.INSERT_IMAGE,
            handleInsertEmptyImage: ImageActions.INSERT_EMPTY_IMAGE,
            
            handleTriggerUpdate: ImageActions.TRIGGER_UPDATE,
            handleUpdateSingle: ImageActions.UPDATE_SINGLE,


            handleTriggerRemovalBinary: ImageActions.TRIGGER_REMOVAL_BINARY,
            handleRemoveSingleBinary: ImageActions.REMOVE_SINGLE_BINARY,



            handleTriggerRemoval: ImageActions.TRIGGER_REMOVAL,
            handleRemoveSingle: ImageActions.REMOVE_SINGLE,

            fetchSingle: ImageActions.FETCH_SINGLE,

            handleFailure: ImageActions.IMAGES_FAILED,

        });
    }


    handleInsertEmptyImage(image)
    {
        this.images[image.id] = JSON.parse(JSON.stringify(image));
        console.log("this.images",this.images);
    }

    handleUpdateImageList(images) {
        console.log('images', images);
        // let images = images;
        this.images = {};
        for (let idx = 0; idx < images.length; idx++) {
            this.images[images[idx].id] = JSON.parse(JSON.stringify(images[idx]));
            this.images[images[idx].id].has_image = this.images[images[idx].id].confirmed;
        }
        console.log('handleUpdateImageList', this.images);
        // this.images = images;
        this.error = null;
        this.loading = false;
    }

    handleFetchImageList() {
        this.images = {};
        this.loading = true;
    }




    handleTriggerInsertion(newImage) {
        // this is actually just a intermediary while addition happens asynchonously
        this.error = null;
        this.loading = true;
    }

    handleInsertImage(image, oldimage) {
        console.log("handleInsertImage: image", image, oldimage);
        delete this.images[oldimage.id];
        this.images[image.id] = image; 
        this.error = null;
        this.loading = false;
    }




    handleUpdateSingle(image_id) {
        this.images[image_id].has_image = true;
        this.loading = false;
    }

    handleTriggerUpdate(image) {
        this.error = null;
        this.loading = true;
    }




    handleTriggerRemovalBinary(id) { 
        this.error = null;
        this.loading = true;
    }

    handleRemoveSingleBinary(id) {
        if (this.images.hasOwnProperty(id)) {
            this.images[id].has_image = false;
            this.images[id].image_hash = null;
        }
        this.loading = false;
    }




    handleTriggerRemoval(image) {
        this.error = null;
        this.loading = true;
    }

    handleRemoveSingle(id) {
        if (this.images.hasOwnProperty(id)) {
            delete this.images[id];
        }
        this.loading = false;
    }












    fetchImagesByTemplate() {
        this.images = {};
        this.loading = false;
    }

    fetchSingle(id) {
        this.images = { loading: true };
    }

    handleFailure(error) {
        this.error = error;
        this.loading = false;
    }
}

const _store = alt.createStore(ImageStore, 'ImageStore');
export default _store;
