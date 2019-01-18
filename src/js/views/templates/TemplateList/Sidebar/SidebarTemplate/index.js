import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Slide from 'react-reveal/Slide';
import { DojotBtnClassic } from 'Components/DojotButton';
import SidebarForm from './SidebarForm';
import SidebarDelete from '../SidebarDelete';
import { templateType } from '../../../TemplatePropTypes';

const SidebarTemplate = ({
    template,
    showSidebar,
    toogleSidebar,
    toogleSidebarAttribute,
    toogleSidebarFirmware,
    changeValue,
    saveTemplate,
    updateTemplate,
    isNewTemplate,
    toogleSidebarDelete,
    deleteTemplate,
    showDeleteTemplate,
}) => (
    <Fragment>
        <Slide right when={showSidebar} duration={300}>
            { showSidebar
                ? (
                    <div className="template-sidebar">
                        <div className="header">
                            <div className="title">manage template</div>
                            <div className="icon">
                                <img src="images/icons/template-cyan.png" alt="device-icon" />
                            </div>
                            <div className="header-path">
                                {'template'}
                            </div>
                        </div>
                        <SidebarForm
                            template={template}
                            toogleSidebarAttribute={toogleSidebarAttribute}
                            toogleSidebarFirmware={toogleSidebarFirmware}
                            changeValue={changeValue}
                        />
                        <div className="footer">
                            <DojotBtnClassic type="secondary" label="discard" onClick={() => toogleSidebar()} />
                            { isNewTemplate
                                ? <DojotBtnClassic color="blue" type="primary" label="add" onClick={saveTemplate} />
                                : (
                                    <Fragment>
                                        <DojotBtnClassic label="delete" type="secondary" onClick={() => toogleSidebarDelete('showDeleteTemplate')} />
                                        <DojotBtnClassic color="red" label="save" type="primary" onClick={updateTemplate} />
                                    </Fragment>
                                )
                            }
                        </div>
                    </div>
)
                : <div />
            }
        </Slide>
        <SidebarDelete
            cancel={() => toogleSidebarDelete('showDeleteTemplate')}
            confirm={deleteTemplate}
            showSidebar={showDeleteTemplate}
            message="You are about to remove this template. Are you sure?"
        />
    </Fragment>
);

SidebarTemplate.defaultProps = {
    showSidebar: false,
    showDeleteTemplate: false,
    isNewTemplate: false,
};

SidebarTemplate.propTypes = {
    template: PropTypes.shape(templateType).isRequired,
    showSidebar: PropTypes.bool,
    toogleSidebar: PropTypes.func.isRequired,
    toogleSidebarAttribute: PropTypes.func.isRequired,
    toogleSidebarFirmware: PropTypes.func.isRequired,
    changeValue: PropTypes.func.isRequired,
    saveTemplate: PropTypes.func.isRequired,
    updateTemplate: PropTypes.func.isRequired,
    isNewTemplate: PropTypes.bool,
    toogleSidebarDelete: PropTypes.func.isRequired,
    deleteTemplate: PropTypes.func.isRequired,
    showDeleteTemplate: PropTypes.bool,
};

export default SidebarTemplate;
