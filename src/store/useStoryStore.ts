import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoryCard, TestResult, Review, Choice, EndingType } from "../types";
import { sampleCards } from "../data/sampleCards";
import { generateId } from "../utils/storyEngine";

type StoreState = {
  cards: StoryCard[];
  testResult: TestResult | null;
  review: Review | null;
  setCards: (cards: StoryCard[]) => void;
  addCard: (card?: Partial<StoryCard>) => void;
  updateCard: (id: string, updates: Partial<StoryCard>) => void;
  deleteCard: (id: string) => void;
  duplicateCard: (id: string) => void;
  duplicateBranch: (id: string) => void;
  addChoice: (cardId: string) => void;
  updateChoice: (cardId: string, choiceId: string, updates: Partial<Choice>) => void;
  deleteChoice: (cardId: string, choiceId: string) => void;
  setTestResult: (result: TestResult | null) => void;
  setReview: (review: Partial<Review>) => void;
  clearReview: () => void;
  resetToSample: () => void;
  clearAll: () => void;
};

const createEmptyCard = (order: number, isOpening = false): StoryCard => ({
  id: generateId(),
  title: isOpening ? "开场场景" : "新场景卡片",
  description: "",
  triggerCondition: "",
  isOpening,
  isEnding: false,
  endingType: undefined,
  clueTags: [],
  order,
  choices: [],
});

function cloneCardWithNewId(
  card: StoryCard,
  idMap: Map<string, string>,
  newOrder: number,
): StoryCard {
  const newId = generateId();
  idMap.set(card.id, newId);
  return {
    ...card,
    id: newId,
    isOpening: false,
    title: card.title ? `${card.title} (副本)` : "新场景卡片",
    order: newOrder,
    choices: card.choices.map((ch) => ({
      ...ch,
      id: generateId(),
      cardId: newId,
    })),
  };
}

function collectBranchIds(cardId: string, cards: StoryCard[]): string[] {
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const collected: string[] = [];
  const visited = new Set<string>();

  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const card = cardMap.get(id);
    if (!card) return;
    collected.push(id);
    card.choices.forEach((ch) => {
      if (ch.nextCardId) walk(ch.nextCardId);
    });
  }

  walk(cardId);
  return collected;
}

export const useStoryStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cards: sampleCards,
      testResult: null,
      review: null,

      setCards: (cards) => set({ cards }),

      addCard: (card) =>
        set((state) => {
          const hasOpening = state.cards.some((c) => c.isOpening);
          const newCard: StoryCard = {
            ...createEmptyCard(state.cards.length, !hasOpening),
            ...card,
            id: generateId(),
            order: state.cards.length,
          };
          return { cards: [...state.cards, newCard] };
        }),

      updateCard: (id, updates) =>
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteCard: (id) =>
        set((state) => {
          const filtered = state.cards
            .filter((c) => c.id !== id)
            .map((c, i) => ({ ...c, order: i }));
          const updatedCards = filtered.map((c) => ({
            ...c,
            choices: c.choices.map((ch) => ({
              ...ch,
              nextCardId: ch.nextCardId === id ? "" : ch.nextCardId,
            })),
          }));
          return { cards: updatedCards };
        }),

      duplicateCard: (id) =>
        set((state) => {
          const original = state.cards.find((c) => c.id === id);
          if (!original) return state;

          const idMap = new Map<string, string>();
          const cloned = cloneCardWithNewId(original, idMap, state.cards.length);
          cloned.choices = original.choices.map((ch) => ({
            ...ch,
            id: generateId(),
            cardId: cloned.id,
          }));

          return { cards: [...state.cards, cloned] };
        }),

      duplicateBranch: (id) =>
        set((state) => {
          const branchIds = collectBranchIds(id, state.cards);
          if (branchIds.length === 0) return state;

          const idMap = new Map<string, string>();
          const cardMap = new Map(state.cards.map((c) => [c.id, c]));

          const clonedCards: StoryCard[] = [];
          let orderOffset = state.cards.length;

          branchIds.forEach((bid) => {
            const original = cardMap.get(bid);
            if (!original) return;
            const cloned = cloneCardWithNewId(original, idMap, orderOffset);
            orderOffset++;
            clonedCards.push(cloned);
          });

          clonedCards.forEach((cloned) => {
            cloned.choices = cloned.choices.map((ch) => ({
              ...ch,
              nextCardId: idMap.get(ch.nextCardId) || ch.nextCardId,
            }));
          });

          return { cards: [...state.cards, ...clonedCards] };
        }),

      addChoice: (cardId) =>
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  choices: [
                    ...c.choices,
                    {
                      id: generateId(),
                      cardId,
                      text: "",
                      nextCardId: "",
                      consequence: "",
                    },
                  ],
                }
              : c,
          ),
        })),

      updateChoice: (cardId, choiceId, updates) =>
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  choices: c.choices.map((ch) =>
                    ch.id === choiceId ? { ...ch, ...updates } : ch,
                  ),
                }
              : c,
          ),
        })),

      deleteChoice: (cardId, choiceId) =>
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === cardId
              ? { ...c, choices: c.choices.filter((ch) => ch.id !== choiceId) }
              : c,
          ),
        })),

      setTestResult: (result) => set({ testResult: result }),

      setReview: (review) =>
        set((state) => ({
          review: {
            id: state.review?.id || generateId(),
            ruleStability: review.ruleStability ?? state.review?.ruleStability ?? 3,
            costClarity: review.costClarity ?? state.review?.costClarity ?? 3,
            foreshadowing: review.foreshadowing ?? state.review?.foreshadowing ?? 3,
            comment: review.comment ?? state.review?.comment ?? "",
            createdAt: state.review?.createdAt || new Date().toISOString(),
          },
        })),

      clearReview: () => set({ review: null }),

      resetToSample: () => set({ cards: sampleCards, testResult: null }),

      clearAll: () =>
        set({
          cards: [createEmptyCard(0, true)],
          testResult: null,
          review: null,
        }),
    }),
    {
      name: "horror-story-studio",
    },
  ),
);

export type { EndingType };
