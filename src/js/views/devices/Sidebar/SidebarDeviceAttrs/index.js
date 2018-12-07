import React from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotCustomButton } from 'Components/DojotButton';
import AttrCard from './AttrCard';

const SidebarDeviceAttrs = ({ showDeviceAttrs, handleShowDeviceAttrs, selectAttr }) => (
    <Slide right when={showDeviceAttrs} duration={300}>
        {
            showDeviceAttrs
                ? (
                    <div className="sidebar-device-attrs">
                        <div className="header">
                            <div className="title">
                                {'Manage Attributes'}
                            </div>
                            <div className="icon">
                                <img src="images/icons/chip-cyan.png" alt="device-icon" />
                            </div>
                        </div>
                        <div className="body">
                            <div className="title">
                                {'device > attribute'}
                            </div>
                            <div className="attr-type">
                                {'Static Value'}
                            </div>
                            <div className="attrs-list">
                                {
                                    selectAttr.map(attr => <AttrCard attr={attr} key={attr.id} />)
                                }
                            </div>
                        </div>
                        <div className="footer">
                            <DojotCustomButton
                                onClick={handleShowDeviceAttrs}
                                label="discard"
                                type="default"
                            />
                            <DojotCustomButton
                                onClick={console.log('teste')}
                                label="save"
                                type="primary"
                            />
                        </div>
                    </div>
                )
                : <div />
        }
    </Slide>
);

SidebarDeviceAttrs.defaultProps = {
    showDeviceAttrs: false,
};

SidebarDeviceAttrs.propTypes = {
    showDeviceAttrs: PropTypes.bool,
    handleShowDeviceAttrs: PropTypes.func.isRequired,
};

export default SidebarDeviceAttrs;
