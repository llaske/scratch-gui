import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import log from '../lib/log';
import sharedMessages from '../lib/shared-messages';

import {
    LoadingStates,
    getIsLoadingUpload,
    getIsShowingWithoutId,
    onLoadedProject,
    requestProjectUpload
} from '../reducers/project-state';

import {
    openLoadingProject,
    closeLoadingProject
} from '../reducers/modals';
import {
    closeFileMenu
} from '../reducers/menus';

/**
 * SugarizerLoader component passes a file input, load handler and props to its child.
 * It expects this child to be a function with the signature
 *     function (renderFileInput, loadProject) {}
 * The component can then be used to attach project loading functionality
 * to any other component:
 *
 * <SugarizerLoader>{(renderFileInput, loadProject) => (
 *     <MyCoolComponent
 *         onClick={loadProject}
 *     >
 *     </MyCoolComponent>
 * )}</SugarizerLoader>
 */

const messages = defineMessages({
    loadError: {
        id: 'gui.projectLoader.loadError',
        defaultMessage: 'The project file that was selected failed to load.',
        description: 'An error that displays when a local project file fails to load.'
    }
});

class SugarizerLoader extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'loadProject'
        ]);
    }
    loadProject() {
        this.props.onLoadingStarted();
        var dataURI = document.getElementById("myBlocks").value;
        if (dataURI) {
            var byteString = atob(dataURI.split(',')[1]);
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
            var ab = new ArrayBuffer(byteString.length);
            var ia = new Uint8Array(ab);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            var blob = new Blob([ab], {type: mimeString});
            var reader = new FileReader();
            var that = this;
            reader.addEventListener("loadend", function() {
                that.props.vm.loadProject(reader.result).then(() => {
                    that.props.onLoadingFinished(that.props.loadingState, true);
                })
                .catch(error => {
                    that.props.onLoadingFinished(that.props.loadingState, false);
                });
            });
            reader.readAsArrayBuffer(blob);
        } else {
            console.log("ERROR loading Sugarizer project");
            this.props.onLoadingFinished(this.props.loadingState, false);
        }
    }
    render () {
        const {
            children
        } = this.props;
        return children(
            this.loadProject
        );
    }
}

SugarizerLoader.propTypes = {
    canSave: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
    children: PropTypes.func,
    className: PropTypes.string,
    closeFileMenu: PropTypes.func,
    isLoadingUpload: PropTypes.bool,
    isShowingWithoutId: PropTypes.bool,
    loadingState: PropTypes.oneOf(LoadingStates),
    onLoadingFinished: PropTypes.func,
    onLoadingStarted: PropTypes.func,
    onUpdateProjectTitle: PropTypes.func,
    projectChanged: PropTypes.bool,
    requestProjectUpload: PropTypes.func,
    userOwnsProject: PropTypes.bool,
    vm: PropTypes.shape({
        loadProject: PropTypes.func
    })
};
SugarizerLoader.defaultProps = {
    className: ''
};
const mapStateToProps = state => {
    const loadingState = state.scratchGui.projectState.loadingState;
    return {
        isLoadingUpload: getIsLoadingUpload(loadingState),
        isShowingWithoutId: getIsShowingWithoutId(loadingState),
        loadingState: loadingState,
        projectChanged: state.scratchGui.projectChanged,
        vm: state.scratchGui.vm
    };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
    closeFileMenu: () => dispatch(closeFileMenu()),
    onLoadingFinished: (loadingState, success) => {
        dispatch(onLoadedProject(loadingState, ownProps.canSave, success));
        dispatch(closeLoadingProject());
        dispatch(closeFileMenu());
    },
    requestProjectUpload: loadingState => dispatch(requestProjectUpload(loadingState)),
    onLoadingStarted: () => dispatch(openLoadingProject())
});

// Allow incoming props to override redux-provided props. Used to mock in tests.
const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
    {}, stateProps, dispatchProps, ownProps
);

export default connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
)(SugarizerLoader);
