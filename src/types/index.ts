export type Choice = {
  id: string;
  cardId: string;
  text: string;
  nextCardId: string;
  consequence: string;
};

export type EndingType = "good" | "bad" | "neutral";

export type StoryCard = {
  id: string;
  title: string;
  description: string;
  triggerCondition: string;
  isOpening: boolean;
  isEnding: boolean;
  endingType?: EndingType;
  clueTags: string[];
  order: number;
  choices: Choice[];
};

export type CardTriggerStatus = "triggered" | "untriggered" | "clue-deficient";

export type PathStep = {
  cardId: string;
  choiceId?: string;
};

export type TestResult = {
  [cardId: string]: {
    status: CardTriggerStatus;
    reachedPaths: PathStep[][];
  };
};

export type Review = {
  id: string;
  ruleStability: number;
  costClarity: number;
  foreshadowing: number;
  comment: string;
  createdAt: string;
};

export type AppState = {
  cards: StoryCard[];
  testResult: TestResult | null;
  review: Review | null;
};
