const STORAGE_KEY = "flashcards.state";
const LEGACY_CARDS_KEY = "flashcards.javascript.cards";
const CURRENT_VERSION = 2;

function isCardList(cards) {
    if (!Array.isArray(cards)) return false;

    const cardIds = new Set();
    return cards.every((card) => {
        if (
            !card ||
            typeof card.cardId !== "string" ||
            !card.cardId ||
            typeof card.front !== "string" ||
            !card.front.trim() ||
            typeof card.back !== "string" ||
            !card.back.trim() ||
            cardIds.has(card.cardId)
        ) {
            return false;
        }

        cardIds.add(card.cardId);
        return true;
    });
}

export function loadState() {
    try {
        const serializedState = localStorage.getItem(STORAGE_KEY);
        if (serializedState !== null) {
            const parsedState = JSON.parse(serializedState);
            if (
                !parsedState ||
                ![1, CURRENT_VERSION].includes(parsedState.version) ||
                !(typeof parsedState.activeDeckId === "string" || parsedState.activeDeckId === null) ||
                !parsedState.decks ||
                typeof parsedState.decks !== "object" ||
                Array.isArray(parsedState.decks)
            ) {
                throw new Error("Saved flashcard state has an invalid or unsupported format.");
            }

            const decks = {};
            for (const [deckId, savedDeck] of Object.entries(parsedState.decks)) {
                if (!deckId || ["__proto__", "constructor", "prototype"].includes(deckId)) {
                    throw new Error("Saved flashcard state contains an invalid deck ID.");
                }

                if (parsedState.version === 1) {
                    if (!isCardList(savedDeck)) {
                        throw new Error(`Saved cards for "${deckId}" are invalid.`);
                    }
                    decks[deckId] = {
                        name: deckId === "javascript" ? "JavaScript" : deckId,
                        cards: savedDeck,
                    };
                    continue;
                }

                if (
                    !savedDeck ||
                    typeof savedDeck.name !== "string" ||
                    !savedDeck.name.trim() ||
                    !isCardList(savedDeck.cards)
                ) {
                    throw new Error(`Saved deck "${deckId}" is invalid.`);
                }
                decks[deckId] = {
                    name: savedDeck.name.trim(),
                    cards: savedDeck.cards,
                };
            }

            const activeDeckId = parsedState.activeDeckId &&
                Object.hasOwn(decks, parsedState.activeDeckId)
                ? parsedState.activeDeckId
                : Object.keys(decks)[0] ?? null;

            return {
                state: {
                    activeDeckId,
                    decks,
                },
                error: null,
            };
        }

        const legacyCards = localStorage.getItem(LEGACY_CARDS_KEY);
        if (legacyCards === null) return { state: null, error: null };

        const parsedCards = JSON.parse(legacyCards);
        if (!isCardList(parsedCards)) {
            throw new Error("Saved flashcards contain invalid or duplicate card IDs.");
        }

        return {
            state: {
                activeDeckId: "javascript",
                decks: {
                    javascript: {
                        name: "JavaScript",
                        cards: parsedCards,
                    },
                },
            },
            error: null,
        };
    } catch (error) {
        return { state: null, error };
    }
}

export function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: CURRENT_VERSION,
        activeDeckId: state.activeDeckId,
        decks: state.decks,
    }));
}
