import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {
    openLoadingProject,
    closeLoadingProject
} from '../reducers/modals';

/**
 * Project loader component passes a file input, load handler and props to its child.
 * It expects this child to be a function with the signature
 *     function (loadProject, props) {}
 * The component can then be used to attach project loading functionality
 * to any other component:
 *
 * <SugarizerLoader>{(loadProject, props) => (
 *     <MyCoolComponent
 *         onClick={loadProject}
 *         {...props}
 *     >
 *     </MyCoolComponent>
 * )}</SugarizerLoader>
 */
class SugarizerLoader extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'loadProject'
        ]);
        this.state = {
            loadingError: false,
            errorMessage: ''
        };
    }
    loadProject() {
		this.props.openLoadingState();
		var dataURI = document.getElementById("myBlocks").value;
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
		reader.onloadend = function() {
			that.props.vm.loadProject(reader.result).then(() => {
				that.props.closeLoadingState();
			})
			.catch(error => {
				that.setState({loadingError: true, errorMessage: error});
			});
		};
		reader.readAsArrayBuffer(blob);
    }
    render () {
        if (this.state.loadingError) throw new Error(`Failed to load project: ${this.state.errorMessage}`);
        const {
            /* eslint-disable no-unused-vars */
            children,
            closeLoadingState,
            openLoadingState,
            vm,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        return this.props.children(this.loadProject, props);
    }
}

SugarizerLoader.propTypes = {
    children: PropTypes.func,
    closeLoadingState: PropTypes.func,
    openLoadingState: PropTypes.func,
    vm: PropTypes.shape({
        loadProject: PropTypes.func
    })
};

const mapStateToProps = state => ({
    vm: state.vm
});

const mapDispatchToProps = dispatch => ({
    closeLoadingState: () => dispatch(closeLoadingProject()),
    openLoadingState: () => dispatch(openLoadingProject())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SugarizerLoader);
