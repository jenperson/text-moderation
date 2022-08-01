/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
let toxicity_model;

// Initializes the Guestbook.
function Guestbook() {

  // The minimum prediction confidence.
  const threshold = 0.9;
  // Load the model. Users optionally pass in a threshold and an array of
  // labels to include.
  toxicity.load(threshold).then(model => {
    console.log('model loaded');
    toxicity_model = model;
  });

  // Shortcuts to DOM Elements.
  this.messageList = document.getElementById('message-list');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.nameInput = document.getElementById('name');
  this.submitButton = document.getElementById('submit');
  this.snackbar = document.getElementById('snackbar');

  // Saves message on form submit.
  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.nameInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);
  this.nameInput.addEventListener('change', buttonTogglingHandler);

  // Function calling displayMessage with correct attributes from Firebase data.
  var callDisplayMessage = function (data) {
    var val = data.val();
    this.displayMessage(data.key, val.name, val.text);
  }.bind(this);

  // Function removing message from view when deleted from database
  var callRemoveMessage = function (data) {
    var val = data.val();
    this.displayMessage(data.key);
  }.bind(this);

  // Loads the last 12 messages and listen for new ones.
  Guestbook.fbMessagesRef.limitToLast(12).on('child_added', callDisplayMessage);
  // Listen for messages updates.
  Guestbook.fbMessagesRef.limitToLast(12).on('child_changed', callDisplayMessage);
  // Listen for messages updates.
  Guestbook.fbMessagesRef.limitToLast(12).on('child_removed', callRemoveMessage);
}

// Reference to the new messages feed in the Firebase DB.
Guestbook.fbMessagesRef = firebase.database().ref('/messages');

// Saves a new message on the Firebase DB.
Guestbook.prototype.saveMessage = function(e) {
  e.preventDefault();
  if (!this.messageInput.value || !this.nameInput.value) { 
    return;
  }

  Guestbook.checkContent(this.messageInput.value).then((toxic) => {
    if (toxic === true) {
      // display a message to the user to be kind
      Guestbook.displaySnackbar();
      // clear the message field
      Guestbook.resetMaterialTextfield(this.messageInput);
      return;
    }
    Guestbook.fbMessagesRef.push({
      name: this.nameInput.value,
      text: this.messageInput.value,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }, function (error) {
      if (error) {
        console.log(error);
      } else {
        Guestbook.resetMaterialTextfield(this.messageInput);
        Guestbook.resetMaterialTextfield(this.nameInput);
        this.toggleButton();
      }
    }.bind(this));
  });
};

// Resets the given MaterialTextField.
Guestbook.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  element.blur();
};

// Template for message cards.
Guestbook.MESSAGE_CARD_TEMPLATE =
  '<div class="mdl-card mdl-cell mdl-cell--12-col mdl-card__supporting-text mdl-shadow--2dp ' +
              'message-card mdl-cell--4-col-tablet mdl-cell--4-col-desktop">' +
      '<div class="message"></div>' +
      '<div class="author"></div>' +
  '</div>';

// Displays a Visitor's Book Message in the UI.
Guestbook.prototype.displayMessage = function(key, name, message) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = Guestbook.MESSAGE_CARD_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.insertBefore(div, document.getElementById('message-title').nextSibling);
  }
  if (!name) {
    div.remove();
    return;
  }
  div.querySelector('.author').textContent = name;
  var messageElement = div.querySelector('.message');
  messageElement.textContent = message;
  // Replace all line breaks by <br>.
  messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
};

// Enables or disables the submit button depending on the values of the input
// fields.
Guestbook.prototype.toggleButton = function() {
  if (this.messageInput.value && this.nameInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

Guestbook.checkContent = function(message) {
  if (!toxicity_model) {
    console.log('no model found');
    return false;
  }

  const messages = [message];

  return toxicity_model.classify(messages).then(predictions => {
    // `predictions` is an array of objects, one for each prediction head,
    // that contains the raw probabilities for each input along with the
    // final prediction in `match` (either `true` or `false`).
    // If neither prediction exceeds the threshold, `match` is `null`.

    for (let item of predictions) {
      for (let i in item.results) {
        console.log(item.results[i].match)
        if (item.results[i].match === true) {
          console.log('toxicity found');
          return true;
        }
      }
    }
    console.log('no toxicity found');
    return false;
  });
}

Guestbook.displaySnackbar = function() {
  snackbar.className = 'show';

  // After 3 seconds, remove the show class from DIV
  setTimeout(function(){ snackbar.className = snackbar.className.replace('show', ''); }, 8000);
}

// Bindings on load.
window.addEventListener('load', function() {
  new Guestbook();
});
