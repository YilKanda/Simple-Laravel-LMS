'use strict';

var Editor = require('./editor');
var helper = require('./helper');
var titleEditor; //editor for the title

var coursePanelEl;
var titleEl; //course title element
var lecturersEl;
var studentsEl;
var adminActionsEl; //parent element containing the buttons of the admin actions
var contentActionsEl; //parent element containing the buttons of the content actions
var initialTitle; //variable used to store initial title (for reverting changes made)

function init() {
    coursePanelEl = document.getElementById('course-panel');
    titleEl = document.getElementById('course-title-content');

    if (coursePanelEl) {
        initialTitle = titleEl.innerHTML;
        attachEventListeners();
    }
}

function attachEventListeners() {
    lecturersEl = document.getElementById('lecturers-list');
    studentsEl = document.getElementById('students-list');

    coursePanelEl.addEventListener('click', function(evt){
        adminActionsEl = document.getElementById('course-admin-actions');
        contentActionsEl = document.getElementById('course-content-actions');

        if (evt.target && (contentActionsEl.contains(evt.target) || adminActionsEl.contains(evt.target))) {
            if (evt.target.id === 'edit-course-btn') {
                editCourseListener();
            } else if (evt.target.id === 'cancel-changes-btn') {
                cancelChangesListener();
            } else if(evt.target.id === 'save-changes-btn') {
                saveChangesListener(evt.target);
            }
        }
    });

    if (lecturersEl) {
        lecturersEl.addEventListener('change', function(evt) {
            if (evt.target && evt.target.matches('input[type="checkbox"]')) {
                setLecturersListener();
            }
        });
    }

    if (studentsEl) {
        studentsEl.addEventListener('change', function(evt) {
            if (evt.target && evt.target.matches('input[type="checkbox"]')) {
                setStudentsListener();
            }
        });
    }

    function editCourseListener() {
        changeButtons();
        initEditors();
        titleEditor.setFocus();
        toggleCheckboxlists();
    }

    function cancelChangesListener() {
        revertChanges();
        titleEditor.destroy();
        toggleCheckboxlists();
        changeButtons();
    }

    function saveChangesListener(saveBtnEl) {
         helper.disableButton(saveBtnEl);

         var newTitle = titleEditor.getContent()[titleEl.id].value;
         var updateData = {title: newTitle};

         // Send ajax request to update lesson
        var success = function(response) {
            initialTitle = newTitle;

            helper.setAlert(JSON.parse(response).response, 'alert--success');
        };
        var failure = function(response) {
            revertChanges();

            //display errors to alert element
            var errors = JSON.parse(response);
            var errorMsg = '';

            for (var error in errors) {
                errorMsg = errors[error].reduce(function(previousMsg, currentMsg) {
                    return previousMsg + currentMsg;
                });
            }
            helper.setAlert(errorMsg, 'alert--danger');
        };
        var always = function() {
             helper.enableButton(saveBtnEl);
        };

        helper.sendAjaxRequest('PATCH', '/courses/'+ document.getElementById('course-id').value, success, failure, always, JSON.stringify(updateData));

        titleEditor.destroy();
        toggleCheckboxlists();
        changeButtons();
    }

    function setLecturersListener() {
        setCheckboxlistListener(helper.serialize(lecturersEl.querySelector('#lecturers-form')), 
            '/courses/'+ document.getElementById('course-id').value + '/lecturers');
    }

    function setStudentsListener() {
        setCheckboxlistListener(helper.serialize(studentsEl.querySelector('#students-form')), '/courses/'+ document.getElementById('course-id').value + '/students');
    }

    /**
     * Sends ajax PATCH request to a specified url when checkbox is checked / unchecked
     * @param {String} data - data to be sent via ajax
     * @param {String} url - ajax url path
     */
    function setCheckboxlistListener(data, url) {
        var success = function(response) {
            helper.setAlert(JSON.parse(response).response, 'alert--success');
        };
        var failure = function(response) {
            //display errors to alert element
            helper.setAlert(JSON.parse(response), 'alert--danger');
        };
        var always = function() {};

        helper.sendAjaxRequest('PATCH', url, success, failure, always, data);
    }
}

/**
 * Toggle between showing either the admin actions or the lesson content actions
 */
function changeButtons() {
    if (contentActionsEl.classList.contains('hidden')) {
        contentActionsEl.classList.remove('hidden');
        adminActionsEl.classList.add('hidden');
    } else if (adminActionsEl.classList.contains('hidden')) {
        adminActionsEl.classList.remove('hidden');
        contentActionsEl.classList.add('hidden');
    }
}

/**
 * Revert changes made when 'Cancel' button is clicked
 */
function revertChanges() {
    titleEl.innerHTML = initialTitle;
}

/**
 * Initialize all Medium editors
 */
function initEditors() {
    titleEditor = new Editor();
    titleEditor.init(document.querySelector('.title-editable'), {
        toolbar:false,
        disableReturn: true,
        disableExtraSpaces: true
    });
}

function toggleCheckboxlists() {
    if (lecturersEl) {
        lecturersEl.classList.toggle('hidden');
    }
    if (studentsEl) {
        studentsEl.classList.toggle('hidden');
    }
}

module.exports = {
    init: init
};