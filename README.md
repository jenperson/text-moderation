# Text Moderation with Cloud Functions

This template shows how to perform client-side and server-side moderation of text.

Client-side text is moderated using the [Text Toxicity Classifier model](https://github.com/tensorflow/tfjs-models/tree/master/toxicity) from TensorFlow.js.
If the user tries to publish a toxic message to the guestbook, a message pops up reminding them
to be nice.

Server-side text is moderated once published to the Firebase Realtime Database using a
Cloud Function that is triggered by a write to the database.


## Functions Code

See file [functions/index.js](functions/index.js) for the moderation code.

The dependencies are listed in [functions/package.json](functions/package.json).


## Sample Database Structure

Users anonymously add a message - an object with a `text` attribute - to the `/messages` list:

```
/functions-project-12345
    /messages
        /key-123456
            text: "This is my first message!"
        /key-123457
            text: "IN THIS MESSAGE I AM SHOUTING!!!"
```


## Trigger rules

The function triggers every time a message is added. If the message is deemed toxic, then it
is deleted.


## Security Rules

The security rules only allow users to create message but not edit them afterwards.


## Deploy and test

This sample comes with a Function and web-based UI for testing the function. To configure it:

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Clone or download this repo and open the `text-moderation` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`
 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 2. Open the app and add messages to the message board. Write some good and bad messages to verify that toxic text is moderated.
