import type { StoryCard, TestResult, CardTriggerStatus, Choice } from "../types";

const CLUE_THRESHOLD = 2;

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export type PathDetail = {
  cardId: string;
  cardTitle: string;
  choiceText?: string;
  consequence?: string;
  cluesAtThisStep: string[];
  accumulatedClues: string[];
};

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

  function dfs(currentId: string, path: string[]) {
    const current = cardMap.get(currentId);
    if (!current) return;

    const newPath = [...path, currentId];

    if (result[currentId]) {
      result[currentId].status = "triggered";
    }

    if (current.isEnding) {
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

      const pathClueCounts = pathsToEnding.map((path) => {
        const uniqueClues = new Set<string>();
        path.forEach((cid) => {
          const c = cardMap.get(cid);
          if (c) c.clueTags.forEach((t) => uniqueClues.add(t));
        });
        return uniqueClues.size;
      });

      const allPathsDeficient = pathClueCounts.every((count) => count < CLUE_THRESHOLD);

      if (allPathsDeficient && pathClueCounts.length > 0) {
        result[card.id].status = "clue-deficient";
      }
    }
  });

  return result;
}

export function getPathDetails(
  path: string[],
  cards: StoryCard[],
): PathDetail[] {
  const details: PathDetail[] = [];
  const accumulatedClues: string[] = [];
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  path.forEach((cardId, idx) => {
    const card = cardMap.get(cardId);
    if (!card) return;

    card.clueTags.forEach((t) => {
      if (!accumulatedClues.includes(t)) accumulatedClues.push(t);
    });

    let choiceText: string | undefined;
    let consequence: string | undefined;

    if (idx > 0) {
      const prevCard = cardMap.get(path[idx - 1]);
      if (prevCard) {
        const chosen: Choice | undefined = prevCard.choices.find(
          (ch) => ch.nextCardId === cardId,
        );
        if (chosen) {
          choiceText = chosen.text;
          consequence = chosen.consequence;
        }
      }
    }

    details.push({
      cardId,
      cardTitle: card.title,
      choiceText,
      consequence,
      cluesAtThisStep: [...card.clueTags],
      accumulatedClues: [...accumulatedClues],
    });
  });

  return details;
}

export function getUniqueCluesForPath(path: string[], cards: StoryCard[]): string[] {
  const clues = new Set<string>();
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  path.forEach((cid) => {
    const c = cardMap.get(cid);
    if (c) c.clueTags.forEach((t) => clues.add(t));
  });
  return Array.from(clues);
}

export type ReviewHint = {
  type: "warning" | "success" | "info";
  title: string;
  detail: string;
  suggestedText: string;
};

export function generateReviewHints(
  cards: StoryCard[],
  testResult: TestResult | null,
): ReviewHint[] {
  const hints: ReviewHint[] = [];
  if (!testResult) return hints;

  const values = Object.values(testResult);
  const total = values.length;
  const untriggered = values.filter((v) => v.status === "untriggered").length;
  const deficient = values.filter((v) => v.status === "clue-deficient").length;
  const endingCards = cards.filter((c) => c.isEnding);
  const deficientEndings = endingCards.filter(
    (c) => testResult[c.id]?.status === "clue-deficient",
  );
  const badEndings = endingCards.filter((c) => c.endingType === "bad");
  const deficientBadEndings = badEndings.filter(
    (c) => testResult[c.id]?.status === "clue-deficient",
  );
  const triggeredCards = cards.filter(
    (c) => !c.isEnding && testResult[c.id]?.status === "triggered",
  );
  const avgCluesPerCard =
    triggeredCards.length > 0
      ? triggeredCards.reduce((sum, c) => sum + c.clueTags.length, 0) / triggeredCards.length
      : 0;

  if (total > 0 && untriggered / total > 0.3) {
    hints.push({
      type: "warning",
      title: `${untriggered} 张卡片未被触发（占 ${Math.round((untriggered / total) * 100)}%）`,
      detail: "超过三成的卡片玩家永远走不到，可能存在孤立分支或断裂的连线",
      suggestedText: `目前有 ${untriggered} 张卡片（约 ${Math.round((untriggered / total) * 100)}%）无论玩家如何选择都无法到达。建议检查：1) 是否有卡片没有被任何选项指向；2) 选项的"指向卡片"是否填写正确；3) 是否存在设计了但没接入主线的废弃剧情。`,
    });
  } else if (untriggered === 0 && total > 0) {
    hints.push({
      type: "success",
      title: "所有卡片均已触发 ✓",
      detail: "每张卡片都至少有一条路径可以到达",
      suggestedText: "触发覆盖率做得非常好，所有设计的场景都能被玩家体验到。",
    });
  }

  if (deficientEndings.length > 0) {
    const names = deficientEndings.map((c) => `「${c.title}」`).join("、");
    hints.push({
      type: "warning",
      title: `${deficientEndings.length} 个结局线索不足`,
      detail: `到达这些结局的所有路径累计线索均少于 2 个：${names}`,
      suggestedText: `${names} 这${deficientEndings.length > 1 ? "些" : "个"}结局的伏笔铺垫明显不够。玩家走到结局时会觉得突兀，缺乏"原来如此"的恍然大悟感。建议在通向这些结局的路径上，至少提前 2 张卡片埋下相关线索标签（如物品、异象、对话暗示等），让玩家在二刷时能呼应上。`,
    });
  }

  if (deficientBadEndings.length > 0 && badEndings.length > 0) {
    hints.push({
      type: "info",
      title: `${deficientBadEndings.length} 个坏结局也缺少线索铺垫`,
      detail: "坏结局同样需要让玩家明白'为什么是我死了'",
      suggestedText: "注意：坏结局不代表可以不讲道理。即使玩家选错了，也应该让他回头看时能发现'原来那时候我就应该注意到'。建议为每个坏结局也设置至少 1 个警示性线索。",
    });
  }

  if (avgCluesPerCard < 0.5 && triggeredCards.length > 3) {
    hints.push({
      type: "warning",
      title: `平均每张卡片仅 ${avgCluesPerCard.toFixed(1)} 个线索`,
      detail: "整体线索密度偏低，反转时可能缺乏足够支撑",
      suggestedText: `目前整体线索密度偏低（平均每张触发卡片仅 ${avgCluesPerCard.toFixed(1)} 个线索标签）。建议在关键转折点卡片上多设置线索标签，让伏笔散落在整条故事线上。`,
    });
  } else if (avgCluesPerCard >= 1 && triggeredCards.length > 3) {
    hints.push({
      type: "success",
      title: `线索密度良好（平均 ${avgCluesPerCard.toFixed(1)} 个/卡）`,
      detail: "伏笔分布比较均匀",
      suggestedText: "线索密度做得不错，伏笔在故事中有均匀分布。",
    });
  }

  if (endingCards.length === 0) {
    hints.push({
      type: "warning",
      title: "还没有标记任何结局卡片",
      detail: "故事需要至少一个结局",
      suggestedText: "目前没有任何被标记为「结局」的卡片。一个完整的互动故事至少需要一个结局。建议在故事的终点卡片上勾选「结局」选项。",
    });
  } else if (endingCards.length < 2) {
    hints.push({
      type: "info",
      title: "目前只有 1 个结局",
      detail: "可以尝试设计更多分支和不同结局",
      suggestedText: "目前故事只有单一结局。作为多结局叙事练习，建议尝试设计至少 2-3 个不同走向的结局（好结局、坏结局、中性结局），让玩家的选择真正影响故事走向。",
    });
  } else if (endingCards.length >= 3) {
    hints.push({
      type: "success",
      title: `设计了 ${endingCards.length} 个结局 ✓`,
      detail: "分支丰富度良好",
      suggestedText: `结局数量（${endingCards.length} 个）符合多结局叙事练习的要求，分支丰富度不错。`,
    });
  }

  return hints;
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
