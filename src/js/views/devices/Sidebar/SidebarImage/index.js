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
        this.getAttrLabel = this.getAttrLabel.bind(this);
        this.formatDevice = this.formatDevice.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.templateIdAllowedImage !== state.templateIdAllowedImage) {
            return {
                ...state,
                templateIdAllowedImage: props.templateIdAllowedImage,
                loaded: false,
            };
        }

        // TODO we need to get the new states using socket.io and remove
        // the requests made using  MeasureAction
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
                MeasureActions.fetchMeasure.defer(device,
                    this.getAttrLabel('dojot:firmware_update:state'), 1);
                MeasureActions.fetchMeasure.defer(device,
                    this.getAttrLabel('dojot:firmware_update:update_result'), 1);
                MeasureActions.fetchMeasure.defer(device,
                    this.getAttrLabel('dojot:firmware_update:version'), 1);
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

    getAttrLabel(dojotLabel) {
        const { deviceId, ds } = this.props;
        const { templateIdAllowedImage: templateId } = this.state;
        const device = ds.devices[deviceId];
        let relatedLabel = '';
        device.attrs[templateId].forEach((attr) => {
            if (attr.metadata) {
                const el = attr.metadata.filter(meta => meta.label == dojotLabel);
                if (el.length) { relatedLabel = attr.label; } // found the attr
            }
        });
        return relatedLabel;
    }


    formatDevice(device) {
        const dev = { ...device };
        dev.attrs = [];
        Object.values(device.attrs).forEach((templ) => {
            dev.attrs.push(...templ);
        });
        return dev;
    }

    callUploadImage() {
        const { currentImageId } = this.state;
        if (currentImageId === '0') {
            toaster.warning('Select a valid image');
            return;
        }
        const { deviceId, ds } = this.props;
        const device = ds.devices[deviceId];
        const formattedDevice = this.formatDevice(device);
        // 1. find the actuator's label used to upload image
        const uploadImageAlias = this.getAttrLabel('dojot:firmware_update:desired_version');

        // 2. find the location of this actuator and set the new value
        for (let index = 0; index < formattedDevice.attrs.length; index++) {
            if (formattedDevice.attrs[index].label === uploadImageAlias) {
                formattedDevice.attrs[index].static_value = currentImageId;
            }
        }
        DeviceActions.triggerUpdate(formattedDevice, () => {
            toaster.success('Image successfully transferred');
        });
    }

    callApplyImage() {
        const { deviceId, ds } = this.props;
        const device = ds.devices[deviceId];
        const formattedDevice = this.formatDevice(device);
        // 1. find the actuator's label used to upload image
        const applyAlias = this.getAttrLabel('dojot:firmware_update:update');

        // 2. find the location of this actuator and set the new value
        for (let index = 0; index < formattedDevice.attrs.length; index++) {
            if (formattedDevice.attrs[index].label === applyAlias) {
                formattedDevice.attrs[index].static_value = '1';
                // customized value used to notify device to apply its image
            }
        }

        DeviceActions.triggerUpdate(formattedDevice, () => {
            toaster.success('Image Applied');
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
        const { is: { images } } = this.props;
        if (Object.keys(images).length) {
            Object.values(images).forEach((el) => {
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
                            <div className="sidebar-firmware">
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
                                    <div className="sub-content">
                                        <div className="info firmware-enabled">
                                            <div className="icon">
                                                <img src="images/icons/firmware-big-gray.png" alt="device-icon" />
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
                                            <div className="header2">Image to be transferred</div>
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
