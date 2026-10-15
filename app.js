import flashcards from "./data/flashcards.js";
import { loadState, saveState } from "./storage.js";

const form = document.querySelector("#card-form");
const frontInput = document.querySelector("#card-form-front");
const backInput = document.querySelector("#card-form-back");
const dialog = document.querySelector("#card-dialog");
const dialogTitle = document.querySelector("#card-dialog-title");
const deckDialog = document.querySelector("#deck-dialog");
const deckForm = document.querySelector("#deck-form");
const deckDialogTitle = document.querySelector("#deck-dialog-title");
const deckNameInput = document.querySelector("#deck-name");
const deckFormError = document.querySelector("#deck-form-error");
const studyCard = document.querySelector("#study-card");
const cardFrontContent = document.querySelector("#card-front-content");
const cardEmptyState = document.querySelector("#card-empty-state");
const cardBackContent = document.querySelector("#card-back-content");
const cardCount = document.querySelector("#card-count");
const noDecksMessage = document.querySelector("#no-decks");
const storageMessage = document.querySelector("#storage-message");
const formError = document.querySelector("#card-form-error");
const cardActions = document.querySelector("#card-actions");
const deckList = document.querySelector("#deck-list");
const deckActions = document.querySelector("#deck-actions");
const newDeckButton = document.querySelector("#new-deck");
const editDeckButton = document.querySelector("#edit-deck");
const deleteDeckButton = document.querySelector("#delete-deck");
const searchInput = document.querySelector("#card-search");
const previousButton = document.querySelector("#previous-card");
const flipButton = document.querySelector("#flip-card");
const nextButton = document.querySelector("#next-card");
const shuffleButton = document.querySelector("#shuffle-cards");
const newCardButton = document.querySelector("#new-card");
const cancelCardButton = document.querySelector("#cancel-card");
const cancelDeckButton = document.querySelector("#cancel-deck");
let canPersistCards = true;
let searchQuery = searchInput.value.trim().toLocaleLowerCase();
let searchTimer;

function showStorageMessage(message) {
    storageMessage.textContent = message;
    storageMessage.hidden = !message;
}

function persistState() {
    if (!canPersistCards) return;

    try {
        saveState({
            activeDeckId,
            decks: Object.fromEntries(
                Object.entries(decks).map(([deckId, deck]) => [
                    deckId,
                    { name: deck.name, cards: deck.cards },
                ])
            ),
        });
        showStorageMessage("");
    } catch (error) {
        canPersistCards = false;
        console.error("Unable to save flashcard state.", error);
        showStorageMessage("Changes are only available until you leave or reload this page; browser storage is unavailable.");
    }
}

const { state: savedState, error: loadError } = loadState();
if (loadError) {
    canPersistCards = false;
    console.error("Unable to load saved flashcard state.", loadError);
    showStorageMessage("Saved cards could not be loaded. Showing the starter deck; changes will not be saved.");
}

const decks = {
    ...(savedState?.decks
        ? Object.fromEntries(
            Object.entries(savedState.decks).map(([deckId, deck]) => [
                deckId,
                { ...deck, currentIndex: 0 },
            ])
        )
        : {
            javascript: {
                name: "JavaScript",
                cards: flashcards.map(({ term, definition }) => ({
                    cardId: crypto.randomUUID(),
                    front: term,
                    back: definition,
                })),
                currentIndex: 0,
            },
        }),
};

let activeDeckId = savedState && decks[savedState.activeDeckId]
    ? savedState.activeDeckId
    : Object.keys(decks)[0] ?? null;
let showingAnswer = false;
let editingCardId = null;
let editingDeckId = null;

function renderDeckList() {
    deckList.replaceChildren();

    for (const [deckId, deck] of Object.entries(decks)) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.deck = deckId;
        button.setAttribute("aria-current", String(deckId === activeDeckId));
        button.textContent = deck.name;
        deckList.append(button);
    }
}

function getVisibleCards() {
    if (!activeDeckId || !decks[activeDeckId]) return [];

    return decks[activeDeckId].cards.filter(({ front, back }) =>
        `${front} ${back}`.toLocaleLowerCase().includes(searchQuery)
    );
}

function renderCard() {
    const activeDeck = activeDeckId ? decks[activeDeckId] ?? null : null;
    const cards = getVisibleCards();
    const hasCards = cards.length > 0;
    const hasDeck = activeDeck !== null;

    studyCard.classList.toggle("is-flipped", showingAnswer && hasCards);
    cardFrontContent.setAttribute("aria-hidden", String(showingAnswer && hasCards));
    cardBackContent.setAttribute("aria-hidden", String(!showingAnswer || !hasCards));
    previousButton.disabled = !hasCards;
    nextButton.disabled = !hasCards;
    flipButton.disabled = !hasCards;
    shuffleButton.disabled = !hasDeck || activeDeck.cards.length < 2;
    newCardButton.disabled = !hasDeck;
    searchInput.disabled = !hasDeck;
    deckList.hidden = !hasDeck;
    noDecksMessage.hidden = hasDeck;
    editDeckButton.disabled = !hasDeck;
    deleteDeckButton.disabled = !hasDeck;
    cardActions.querySelectorAll("button").forEach((button) => {
        button.disabled = !hasCards;
    });
    cardEmptyState.hidden = hasCards;

    if (!hasCards) {
        cardEmptyState.textContent = !hasDeck
            ? "No decks yet. Add a deck to start studying."
            : activeDeck.cards.length === 0
                ? "No cards found. Select New Card to add one."
                : "No cards found. Try another keyword or clear Search.";
        cardFrontContent.textContent = "";
        cardBackContent.textContent = "";
        cardCount.textContent = hasDeck ? `${activeDeck.name} · 0 matches` : "No decks yet";
        return;
    }

    activeDeck.currentIndex = Math.min(activeDeck.currentIndex, cards.length - 1);
    const card = cards[activeDeck.currentIndex];
    cardFrontContent.textContent = card.front;
    cardBackContent.textContent = card.back;
    cardCount.textContent = `${activeDeck.name} · Card ${activeDeck.currentIndex + 1} of ${cards.length} matches`;
}

function openCardDialog(card = null) {
    if (!activeDeckId || !decks[activeDeckId]) return;

    editingCardId = card?.cardId ?? null;
    dialogTitle.textContent = card ? "Edit Card" : "New Card";
    frontInput.value = card?.front ?? "";
    backInput.value = card?.back ?? "";
    dialog.showModal();
    frontInput.focus();
}

deckList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-deck]");
    if (!button || !decks[button.dataset.deck]) return;

    window.clearTimeout(searchTimer);
    activeDeckId = button.dataset.deck;
    searchInput.value = "";
    searchQuery = "";
    showingAnswer = false;

    deckList.querySelectorAll("button[data-deck]").forEach((deckButton) => {
        deckButton.setAttribute("aria-current", String(deckButton === button));
    });

    persistState();
    renderDeckList();
    renderCard();
});

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const front = frontInput.value.trim();
    const back = backInput.value.trim();
    frontInput.setCustomValidity(front ? "" : "Enter non-blank text for the front of the card.");
    backInput.setCustomValidity(back ? "" : "Enter non-blank text for the back of the card.");
    if (!front || !back) {
        formError.textContent = "Both the front and back need non-blank text.";
        formError.hidden = false;
        form.reportValidity();
        return;
    }
    formError.textContent = "";
    formError.hidden = true;

    const activeDeck = activeDeckId ? decks[activeDeckId] : null;
    if (!activeDeck) return;
    window.clearTimeout(searchTimer);
    searchInput.value = "";
    searchQuery = "";
    if (editingCardId) {
        const card = activeDeck.cards.find(({ cardId }) => cardId === editingCardId);
        if (!card) {
            dialog.close();
            return;
        }
        card.front = front;
        card.back = back;
        activeDeck.currentIndex = activeDeck.cards.findIndex(({ cardId }) => cardId === card.cardId);
    } else {
        activeDeck.cards.push({ cardId: crypto.randomUUID(), front, back });
        activeDeck.currentIndex = activeDeck.cards.length - 1;
        showingAnswer = false;
    }

    persistState();
    editingCardId = null;
    dialog.close();
    renderCard();
});

form.addEventListener("input", (event) => {
    if (event.target === frontInput || event.target === backInput) {
        event.target.setCustomValidity("");
        formError.textContent = "";
        formError.hidden = true;
    }
});

previousButton.addEventListener("click", () => {
    const activeDeck = decks[activeDeckId];
    const cards = getVisibleCards();
    if (!cards.length) return;
    activeDeck.currentIndex = (activeDeck.currentIndex - 1 + cards.length) % cards.length;
    showingAnswer = false;
    renderCard();
});

nextButton.addEventListener("click", () => {
    const activeDeck = decks[activeDeckId];
    const cards = getVisibleCards();
    if (!cards.length) return;
    activeDeck.currentIndex = (activeDeck.currentIndex + 1) % cards.length;
    showingAnswer = false;
    renderCard();
});

flipButton.addEventListener("click", () => {
    if (!getVisibleCards().length) return;
    showingAnswer = !showingAnswer;
    renderCard();
});

searchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
        searchQuery = searchInput.value.trim().toLocaleLowerCase();
        if (activeDeckId) decks[activeDeckId].currentIndex = 0;
        showingAnswer = false;
        renderCard();
    }, 300);
});

shuffleButton.addEventListener("click", () => {
    const { cards } = decks[activeDeckId];

    for (let index = cards.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
    }

    decks[activeDeckId].currentIndex = 0;
    showingAnswer = false;
    persistState();
    renderCard();
});

newCardButton.addEventListener("click", () => {
    openCardDialog();
});

function openDeckDialog(deckId = null) {
    editingDeckId = deckId;
    const deck = deckId ? decks[deckId] : null;
    deckDialogTitle.textContent = deck ? "Edit Deck" : "New Deck";
    deckNameInput.value = deck?.name ?? "";
    deckFormError.textContent = "";
    deckFormError.hidden = true;
    deckDialog.showModal();
    deckNameInput.focus();
}

newDeckButton.addEventListener("click", () => {
    openDeckDialog();
});

editDeckButton.addEventListener("click", () => {
    if (activeDeckId && decks[activeDeckId]) openDeckDialog(activeDeckId);
});

deckForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = deckNameInput.value.trim();
    deckNameInput.setCustomValidity(name ? "" : "Enter a non-blank deck name.");
    if (!name) {
        deckFormError.textContent = "Enter a deck name.";
        deckFormError.hidden = false;
        deckForm.reportValidity();
        return;
    }

    if (editingDeckId) {
        const deck = decks[editingDeckId];
        if (!deck) {
            deckDialog.close();
            return;
        }
        deck.name = name;
    } else {
        const deckId = `deck-${crypto.randomUUID()}`;
        decks[deckId] = { name, cards: [], currentIndex: 0 };
        activeDeckId = deckId;
        searchQuery = "";
        searchInput.value = "";
        showingAnswer = false;
    }

    editingDeckId = null;
    deckDialog.close();
    persistState();
    renderDeckList();
    renderCard();
});

deckForm.addEventListener("input", () => {
    deckNameInput.setCustomValidity("");
    deckFormError.textContent = "";
    deckFormError.hidden = true;
});

deleteDeckButton.addEventListener("click", () => {
    if (!activeDeckId || !decks[activeDeckId]) return;
    const deckName = decks[activeDeckId].name;
    if (!window.confirm(`Delete the "${deckName}" deck and all its cards?`)) return;

    delete decks[activeDeckId];
    activeDeckId = Object.keys(decks)[0] ?? null;
    searchQuery = "";
    searchInput.value = "";
    showingAnswer = false;
    persistState();
    renderDeckList();
    renderCard();
});

cardActions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const currentCard = getVisibleCards()[decks[activeDeckId].currentIndex];
    if (!currentCard) return;

    if (button.dataset.action === "edit-card") {
        openCardDialog(currentCard);
    } else if (button.dataset.action === "delete-card") {
        if (!window.confirm("Delete this flashcard?")) return;

        const activeDeck = decks[activeDeckId];
        const cardIndex = activeDeck.cards.findIndex(({ cardId }) => cardId === currentCard.cardId);
        if (cardIndex === -1) return;

        activeDeck.cards.splice(cardIndex, 1);
        activeDeck.currentIndex = Math.min(activeDeck.currentIndex, Math.max(0, getVisibleCards().length - 1));
        showingAnswer = false;
        persistState();
        renderCard();
    }
});

cancelCardButton.addEventListener("click", () => {
    dialog.close();
});

cancelDeckButton.addEventListener("click", () => {
    deckDialog.close();
});

document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isEditingText = target instanceof Element && target.closest(
        "input, textarea, select, [contenteditable='true']"
    );
    const isButton = target instanceof Element && target.closest("button");

    if (
        dialog.open ||
        deckDialog.open ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditingText
    ) {
        return;
    }

    if (event.code === "Space" || event.key === " ") {
        if (isButton) return;
        event.preventDefault();
        flipButton.click();
    } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousButton.click();
    } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nextButton.click();
    }
});

renderDeckList();
renderCard();