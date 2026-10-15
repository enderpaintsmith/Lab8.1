# Flashcards

A browser-based flashcard app with searchable decks, study navigation, card and deck management, and browser storage. Open `index.html` through a local web server to run it.

## Reflection

- AI helped save time by setting up the app and building features for creating decks and cards, searching, and saving data. This gave me more time to test the app and make sure everything worked.

- I found an issue where the arrow keys wouldn't work when a button was selected. I fixed the keyboard controls so the arrow keys could still navigate between cards without interfering with the Space key.

- I reorganized the code by separating `loadState()` and `saveState()` into `storage.js`. This made the code easier to read and kept the storage functions separate from the rest of the app.

- I improved accessibility by adding keyboard controls for flipping and navigating cards. I also made sure the cards could be accessed with the keyboard and added instructions for the shortcuts.

- I found that giving AI more specific instructions produced better results. Including details about how features should work, possible errors, and what needed to be tested helped me get more accurate code.