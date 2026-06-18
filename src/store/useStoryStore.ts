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
