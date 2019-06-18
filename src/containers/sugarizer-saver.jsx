import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {projectTitleInitialState} from '../reducers/project-title';

/**
 * Project saver component passes a saveProject function to its child.
 * It expects this child to be a function with the signature
 *     function (saveProject, props) {}
 * The component can then be used to attach project saving functionality
 * to any other component:
 *
 * <SugarizerSaver>{(saveProject, props) => (
 *     <MyCoolComponent
 *         onClick={saveProject}
 *         {...props}
 *     />
 * )}</SugarizerSaver>
 */
class SugarizerSaver extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'saveProject'
        ]);
    }
    saveProject () {
        this.props.saveProjectSb3().then(content => {
            var reader = new FileReader();
            reader.addEventListener("loadend", function() {
                var json = reader.result;
                if (json) {
                    document.getElementById("myBlocks").value = json;
                    document.getElementById("myBlocks").click();
                } else {
                    console.log("ERROR saving Sugarizer project");
                }
            });
            reader.readAsDataURL(content)
        });
    }
    render () {
        const {
            children
        } = this.props;
        return children(
            this.saveProject
        );
    }
}

const getProjectFilename = (curTitle, defaultTitle) => {
    let filenameTitle = curTitle;
    if (!filenameTitle || filenameTitle.length === 0) {
        filenameTitle = defaultTitle;
    }
    return `${filenameTitle.substring(0, 100)}.sb3`;
};

SugarizerSaver.propTypes = {
    children: PropTypes.func,
    className: PropTypes.string,
    onSaveFinished: PropTypes.func,
    projectFilename: PropTypes.string,
    saveProjectSb3: PropTypes.func
};
SugarizerSaver.defaultProps = {
    className: ''
};

const mapStateToProps = state => ({
    saveProjectSb3: state.scratchGui.vm.saveProjectSb3.bind(state.scratchGui.vm),
    projectFilename: getProjectFilename(state.scratchGui.projectTitle, projectTitleInitialState)
});

export default connect(
    mapStateToProps,
    () => ({}) // omit dispatch prop
)(SugarizerSaver);
