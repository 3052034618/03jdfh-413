import type { StoryCard, TestResult, CardTriggerStatus } from "../types";

const CLUE_THRESHOLD = 2;

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function traverseStory(cards: StoryCard[]): TestResult {
  const result: TestResult = {};
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  cards.forEach((card) => {
    result[card.id] = {
      status: "untriggered",
      reachedPaths: [],
    };
  });

  const openingCard = cards.find((c) => c.isOpening);
  if (!openingCard) {
    return result;
  }

  const visited = new Set<string>();
  const allPaths: string[][] = [];

  function dfs(currentId: string, path: string[]) {
    const current = cardMap.get(currentId);
    if (!current) return;

    const newPath = [...path, currentId];

    if (result[currentId]) {
      result[currentId].status = "triggered";
    }

    if (current.isEnding) {
      allPaths.push(newPath);
      newPath.forEach((cid) => {
        if (result[cid] && !result[cid].reachedPaths.some((p) => JSON.stringify(p) === JSON.stringify(newPath))) {
          result[cid].reachedPaths.push(newPath);
        }
      });
      return;
    }

    const visitKey = `${currentId}-${path.join(",")}`;
    if (visited.has(visitKey)) return;
    visited.add(visitKey);

    if (current.choices.length === 0) {
      allPaths.push(newPath);
      newPath.forEach((cid) => {
        if (result[cid] && !result[cid].reachedPaths.some((p) => JSON.stringify(p) === JSON.stringify(newPath))) {
          result[cid].reachedPaths.push(newPath);
        }
      });
      return;
    }

    current.choices.forEach((choice) => {
      if (choice.nextCardId) {
        dfs(choice.nextCardId, newPath);
      }
    });
  }

  dfs(openingCard.id, []);

  cards.forEach((card) => {
    if (card.isEnding && result[card.id]?.status === "triggered") {
      const pathsToEnding = result[card.id].reachedPaths;
      const minClues = Math.min(
        ...pathsToEnding.map((path) => {
          let clueCount = 0;
          path.forEach((cid) => {
            const c = cardMap.get(cid);
            if (c) clueCount += c.clueTags.length;
          });
          return clueCount;
        }),
        0,
      );

      if (minClues < CLUE_THRESHOLD) {
        result[card.id].status = "clue-deficient";
      }
    }
  });

  return result;
}

export function getStatusStyle(status: CardTriggerStatus): string {
  switch (status) {
    case "triggered":
      return "status-triggered";
    case "untriggered":
      return "status-untriggered";
    case "clue-deficient":
      return "status-deficient";
    default:
      return "status-untriggered";
  }
}

export function getStatusLabel(status: CardTriggerStatus): string {
  switch (status) {
    case "triggered":
      return "已触发";
    case "untriggered":
      return "未触发";
    case "clue-deficient":
      return "线索不足";
    default:
      return "未知";
  }
}

export function getStatusColor(status: CardTriggerStatus): string {
  switch (status) {
    case "triggered":
      return "#3d7a4d";
    case "untriggered":
      return "#6b6b80";
    case "clue-deficient":
      return "#b22222";
    default:
      return "#6b6b80";
  }
}
