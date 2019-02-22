import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import ImageActions from 'Actions/ImageActions';
import MeasureActions from 'Actions/MeasureActions';
import MaterialSelect from 'Components/MaterialSelect';
import SidebarFirmImages from 'Views/templates/TemplateList/Sidebar/SidebarFirmware/SidebarFirmImages';
import SidebarButton from 'Views/templates/TemplateList/Sidebar/SidebarButton';
import DeviceActions from 'Actions/DeviceActions';
import toaster from 'Comms/util/materialize';

class SidebarImage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            showFirmwareImage: false,
            attrs: { current_state: '', update_result: '', current_version: '' },
            currentImageId: '0',
        };
        this.callUploadImage = this.callUploadImage.bind(this);
        this.callApplyImage = this.callApplyImage.bind(this);
        this.toogleSidebarFirmImage = this.toogleSidebarFirmImage.bind(this);
        this.createImageOptions = this.createImageOptions.bind(this);
        this.onChangeImage = this.onChangeImage.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.templateIdAllowedImage !== state.templateIdAllowedImage) {
            return {
                ...state,
                templateIdAllowedImage: props.templateIdAllowedImage,
                loaded: false,
            };
        }
        if (props.ms.data[props.deviceId]
            && props.ms.data[props.deviceId].current_state !== state.attrs.current_state) {
            return {
                ...state,
                attrs: { current_state: props.ms.data[props.deviceId].current_state },
            };
        }
        return null;
    }


    componentDidUpdate() {
        const { loaded, templateIdAllowedImage } = this.state;
        if (!loaded && templateIdAllowedImage !== '') {
            const { deviceId } = this.props;
            const templateId = templateIdAllowedImage;
            ImageActions.fetchImages.defer(templateId);
            DeviceActions.fetchSingle.defer(deviceId, (device) => {
                toaster.success('Device requested');
                // We should ask data for 3 measures...
                MeasureActions.fetchMeasure.defer(device, 'current_state', 1);
                MeasureActions.fetchMeasure.defer(device, 'update_result', 1);
                MeasureActions.fetchMeasure.defer(device, 'current_version', 1);
            });
            this.setState({
                loaded: true,
            });
        }
    }

    onChangeImage(e) {
        const newImageId = e.target.value;
        this.setState({
            currentImageId: newImageId,
        });
    }


    callUploadImage() {
        // find the actuator responsable for upload image
        const uploadImageAlias = 'upload_image';
        // sets the new value;
        const { currentImageId } = this.state;
        const { deviceId, ds } = this.props;
        const device = ds.devices[deviceId];
        device.attrs[uploadImageAlias] = currentImageId;
        DeviceActions.triggerUpdate(device, () => {
            toaster.success('Image successfully transferred');
        });
    }

    callApplyImage() {
        // find the actuator responsable for apply image
        const { deviceId, ds } = this.props;
        const device = ds.devices[deviceId];
        device.attrs.apply_image = 1;

        DeviceActions.triggerUpdate(device, () => {
            toaster.success('Image Applied');
            // hashHistory.push('/device/list');
        });
    }

    toogleSidebarFirmImage() {
        const { showFirmwareImage } = this.state;
        this.setState({
            showFirmwareImage: !showFirmwareImage,
        });
    }

    createImageOptions() {
        const items = [];
        items.push(<option key="selectedImage" value="0">Select an image</option>);
        const { is: images } = this.props;
        if (images) {
            Object.values(images).forEach((key, el) => {
                items.push(<option key={el.id} value={el.id}>{el.fw_version}</option>);
            });
        }
        return items;
    }


    render() {
        const { toogleSidebarImages, showSidebarImage, is } = this.props;
        const { images } = is;
        const { attrs, showFirmwareImage, templateIdAllowedImage } = this.state;
        const opts = this.createImageOptions();

        return (
            <Fragment>
                <Slide right when={showSidebarImage} duration={300}>
                    { showSidebarImage
                        ? (
                            <div className="-sidebar sidebar-attribute sidebar-firmware">
                                <div className="header">
                                    <div className="title">Firmware</div>
                                    <div className="icon">
                                        <img src="images/firmware-red.png" alt="firmware-icon" />
                                    </div>
                                    <div className="header-path">
                                        {'device > image management'}
                                    </div>
                                </div>

                                <div className="body box-image-info">
                                    <div className="info firmware-enabled">
                                        <div className="icon">
                                            <img src="images/icons/firmware-gray.png" alt="device-icon" />
                                        </div>
                                        <div className="desc">
                                            <div className="line">
                                                <div className="label">Current Version</div>
                                                <div className="value">{attrs.current_version}</div>
                                            </div>
                                            <div className="line">
                                                <div className="label">Current State</div>
                                                <div className="value">{attrs.current_state}</div>
                                            </div>
                                            <div className="line">
                                                <div className="label">Update Result</div>
                                                <div className="value">{attrs.update_result}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="line-2" />
                                    <div className="body-form pl50">
                                        <div className="header2">Image to be transfer</div>
                                        <div className="cid_select">
                                            <MaterialSelect id="flr_images" name="images" label="Available images" value={this.currentImageId} onChange={e => this.onChangeImage(e)}>
                                                {opts}
                                            </MaterialSelect>
                                        </div>
                                        <div className="cid_upload_button">
                                            <div className="square-button" onKeyPress={this.callUploadImage} tabIndex="0" role="button" onClick={this.callUploadImage}>
                                                <i className="fa fa-download fa-2x" />
                                                Transfer
                                            </div>
                                        </div>
                                    </div>
                                    <div className="body-actions">
                                        <div className="body-actions--divider" />
                                        <SidebarButton
                                            onClick={() => this.toogleSidebarFirmImage()}
                                            icon="firmware"
                                            text="Manage Images"
                                        />
                                    </div>
                                </div>
                                <div className="footer">
                                    <Fragment>
                                        <DojotBtnClassic label="discard" type="secondary" onClick={toogleSidebarImages} />
                                        <DojotBtnClassic color="red" label="Apply" type="primary" onClick={e => this.callApplyImage(e)} />
                                    </Fragment>
                                </div>
                            </div>
                        )
                        : <div />
                    }
                </Slide>
                <SidebarFirmImages
                    showFirmware={showFirmwareImage}
                    templateId={templateIdAllowedImage}
                    images={images}
                    toogleSidebarFirmware={this.toogleSidebarFirmImage}
                />
            </Fragment>
        );
    }
}


SidebarImage.defaultProps = {
    showSidebarImage: false,
    deviceId: '',
    is: {},
    ds: {},
};

SidebarImage.propTypes = {
    deviceId: PropTypes.string,
    showSidebarImage: PropTypes.bool,
    toogleSidebarImages: PropTypes.func.isRequired,
    is: PropTypes.shape({
        images: PropTypes.array,
    }),
    ds: PropTypes.shape({
        devices: PropTypes.array,
    }),
};

export default SidebarImage;
