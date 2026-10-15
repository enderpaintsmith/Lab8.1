# Flashcards

A browser-based flashcard app with searchable decks, study navigation, card and deck management, and browser storage. Open `index.html` through a local web server to run it.

## Reflection

- AI saved time by scaffolding the app features and wiring the card, deck, search, and storage flows, allowing me to focus on testing behavior end-to-end.
- I identified a keyboard bug where arrow shortcuts were ignored while a button had focus. I changed the handler so arrow keys still navigate from focused buttons while Space retains normal button activation.
- I refactored saved-state handling into `loadState()` and `saveState()` in `storage.js`. This separates storage validation, migration, and serialization from the interface logic.
- One accessibility improvement was adding keyboard operation for flipping and navigating cards, with visible shortcut instructions and focusable study-card content.
- More specific prompts improved the output: listing exact interactions, edge cases such as flip-state resets and unique card IDs, and concrete quality checks made it easier to implement and verify the expected behavior.
# Lab8.1
