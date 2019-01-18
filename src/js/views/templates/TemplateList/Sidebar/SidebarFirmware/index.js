import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import ImageActions from 'Actions/ImageActions';
import util from 'Comms/util';
import toaster from 'Comms/util/materialize';
import ImageList from './ImageList';

class SidebarFirmware extends Component {
    constructor(props) {
        super(props);
        this.state = {
            new_image: false,
        };
        this.images = {};
        this.createNewImage = this.createNewImage.bind(this);
        this.changeAttrValue = this.changeAttrValue.bind(this);
        this.removeBinary = this.removeBinary.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.saveImages = this.saveImages.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    componentDidMount() {
        console.log('componentDidMount', this.props.template, this.props.isNewTemplate);
        if (this.props.isNewTemplate) {
            console.log('Is a new template. ');
        } else {
            ImageActions.fetchImages.defer(this.props.template.id);
        }
    }

    onDrop(files, element) {
        console.log('onDrop', files, element);
        this.images[element.id].file = files;
        this.images[element.id].saved = false;
    }

    createNewImage() {
        console.log('createNewImage');
        if (!this.state.new_image) {
            ImageActions.insertEmptyImage({
                id: 'x111', image_version: '', created: null, new: true, saved: false, image_hash: null,
            });
            this.setState({ new_image: true });
        }
        console.log("this.props.images", this.props.images);
    }

    saveImages(e) {
        e.preventDefault();

        this.props.images.forEach((image) => {
            if (!image.saved) {
                // for each non saved image,
                // 1. update or create image
                // 2. upload binary
                // 3. set as saved image

                const json_img = {
                    template_id: this.props.template.id,
                    fw_version: image.image_version,
                    sha1: '',
                };
                ImageActions.triggerInsert(json_img, (img) => {
                    toaster.success('Image created.');
                    console.log('img', img);
                    console.log('image.files', image.files);
                    if (image.files) {
                        const img_binary = {
                            id: img.id,
                            binary: image.files[0],
                        };
                        ImageActions.triggerUpdate(img_binary, () => {
                            toaster.success('Image added.');
                        });
                    }
                    this.props.images[img].saved = true; // we should use an action..
                });
            }
        });
    }

    removeBinary(e, image) {
        console.log('removeBinary', image);
        e.preventDefault();

        ImageActions.triggerRemovalBinary(image.id, () => {
            toaster.success('Image updated.');
        });
    }

    removeImage(e, image) {
        e.preventDefault();
        // this.images = this.images.filter(el => el.id !== image.id);

        if (image.new)
        {
            ImageActions.removeSingle(image.id);
            this.setState({ new_image: false });
        }
        else {
            ImageActions.triggerRemoval(image, () => {
                toaster.error('Image removed.');
            });
        }
    }

    changeAttrValue(event, attr) {
        // FirmwareActions.update({ f: f, v: v });
        //    this.setState({ fw_version: event.target.value });
        // const values = { ...attr };
        console.log(event, attr);
        // values[event.target.name] = event.target.value;
        this.props.images[attr.id].saved = false;
        this.props.images[attr.id][attr.name] = attr.value;
    }

    render() {
        console.log("SidebarFirmware. render", this.props.images);
        const { showFirmware, toogleSidebarFirmware } = this.props;

        return (
            <Fragment>
                <Slide right when={showFirmware} duration={300}>
                    { showFirmware
                        ? (
                            <div className="-sidebar sidebar-attribute">
                                <div className="header">
                                    <div className="title">Firmware</div>
                                    <div className="icon">
                                        <img src="images/icons/template-cyan.png" alt="device-icon" />
                                    </div>
                                    <div className="header-path">
                                        {'template > firmware management'}
                                    </div>
                                </div>

                                <div className="body">
                                    <ImageList list={this.props.images} changeAttrValue={this.changeAttrValue} removeImage={this.removeImage} removeBinary={this.removeBinary} onDrop={this.onDrop} />
                                    {(!this.state.new_image)
                                        ? (
<div className="body-form-nodata clickable" onClick={this.createNewImage}>
                                        Click here to add a new image
                                        </div>
)
                                        : null }
                                </div>
                                <div className="footer">
                                    <Fragment>
                                        <DojotBtnClassic label="discard" type="secondary" onClick={toogleSidebarFirmware} />
                                        <DojotBtnClassic color="red" label="save" type="primary" onClick={e => this.saveImages(e)} />
                                    </Fragment>
                                </div>
                            </div>
                        )
                        : <div />
                    }
                </Slide>
            </Fragment>
        );
    }
}


SidebarFirmware.defaultProps = {
    showFirmware: false,
    newImage: false,
};

SidebarFirmware.propTypes = {
    showFirmware: PropTypes.bool,
    newImage: PropTypes.bool,
    toogleSidebarFirmware: PropTypes.func.isRequired,

};

export default SidebarFirmware;
