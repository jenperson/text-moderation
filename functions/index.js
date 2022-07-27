/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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

const functions = require('firebase-functions');
const toxicity = require('@tensorflow-models/toxicity');

exports.moderator = functions.database.ref('/messages/{messageId}').onCreate(async (snapshot, context) => {
  
  const message = snapshot.val();

  // Verify that the snapshot has a value
  if (!message) { 
    return;
  }
  functions.logger.log('Retrieved message content: ', message);

  // Run moderation checks on the message and delete if needed.
  const moderateResult = await moderateMessage(message.text);
  functions.logger.log(
    'Message has been moderated. Does message violate rules? ',
    moderateResult
  );

  if (moderateResult === true) {
    var modRef = snapshot.ref;
    try {
      await modRef.remove();
    } catch (error) {
      functions.logger.error('Remove failed: ' + error.message);
    }
  }
});

async function moderateMessage(message) {
  const threshold = 0.9;

  let model = await toxicity.load(threshold);

  const messages = [message];

  let predictions = await model.classify(messages);

  for (let item of predictions) {
    for (let i in item.results) {
      if (item.results[i].match === true) {
        return true;
      }
    }
  }
  return false;
}


