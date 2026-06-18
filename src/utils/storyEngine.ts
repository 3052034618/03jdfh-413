import type { StoryCard, TestResult, CardTriggerStatus, Choice } from "../types";

const CLUE_THRESHOLD = 2;
const MAX_PATH_LENGTH = 50;
const MAX_PATHS = 200;

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export type PathStep = {
  cardId: string;
  choiceId?: string;
};

export type PathDetail = {
  cardId: string;
  cardTitle: string;
  choiceId?: string;
  choiceText?: string;
  consequence?: string;
  cluesAtThisStep: string[];
  accumulatedClues: string[];
  isFirstClueAppearance: string[];
  isLoopBack?: boolean;
  loopBackToStep?: number;
};

export type PathWeakPoint = {
  step: number;
  cardTitle: string;
  reason: string;
};

export type PathAnalysis = {
  totalSteps: number;
  uniqueClues: string[];
  clueAppearanceSteps: { [clue: string]: number };
  weakPoints: PathWeakPoint[];
  longestDrySpell: { start: number; end: number; length: number };
  preEndingClueCount: number;
  endingClueDensity: number;
  endingDrySpellLength: number;
  hasEndingDrySpell: boolean;
};

export type PathComparison = {
  sharedSteps: number;
  divergenceStep: number;
  divergenceCardTitle: string;
  sharedCards: string[];
  uniqueToPath1: string[];
  uniqueToPath2: string[];
  sharedClues: string[];
  uniqueToPath1Clues: string[];
  uniqueToPath2Clues: string[];
  choice1AtDivergence: string;
  choice2AtDivergence: string;
};

export type OverallReviewDraft = {
  summary: string;
  strengths: string[];
  improvements: string[];
  fullText: string;
};

export type ScoreRecommendation = {
  ruleStability: number;
  costClarity: number;
  foreshadowing: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  choiceText?: string;
};

export type StoryGraph = {
  nodes: {
    id: string;
    title: string;
    type: "opening" | "normal" | "ending";
    endingType?: "good" | "bad" | "neutral";
  }[];
  edges: GraphEdge[];
};

export function getStoryGraph(cards: StoryCard[]): StoryGraph {
  const nodes = cards.map((c) => ({
    id: c.id,
    title: c.title || "未命名",
    type: (c.isOpening ? "opening" : c.isEnding ? "ending" : "normal") as
      | "opening"
      | "normal"
      | "ending",
    endingType: c.endingType,
  }));

  const edges: GraphEdge[] = [];
  cards.forEach((c) => {
    c.choices.forEach((ch) => {
      if (ch.nextCardId && cards.some((x) => x.id === ch.nextCardId)) {
        edges.push({
          from: c.id,
          to: ch.nextCardId,
          choiceText: ch.text,
        });
      }
    });
  });

  return { nodes, edges };
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

  const pathSignatures = new Set<string>();
  let totalPaths = 0;

  function buildSignature(cardIds: string[], choiceIds: (string | undefined)[]): string {
    const parts: string[] = [];
    cardIds.forEach((cid, i) => {
      if (i === 0) {
        parts.push(cid);
      } else {
        const chId = choiceIds[i - 1] || "?";
        parts.push(`[${chId}]→${cid}`);
      }
    });
    return parts.join("|");
  }

  function recordPath(cardPath: string[], choicePath: (string | undefined)[]) {
    const sig = buildSignature(cardPath, choicePath);
    if (pathSignatures.has(sig)) return;
    if (totalPaths >= MAX_PATHS) return;
    pathSignatures.add(sig);
    totalPaths++;

    cardPath.forEach((cid) => {
      if (result[cid]) {
        result[cid].status = "triggered";
        const already = result[cid].reachedPaths.some(
          (p) => p.length === cardPath.length && p.every((v, i) => v === cardPath[i]),
        );
        if (!already) {
          result[cid].reachedPaths.push([...cardPath]);
        }
      }
    });
  }

  function dfs(
    currentId: string,
    cardPath: string[],
    choicePath: (string | undefined)[],
  ) {
    const current = cardMap.get(currentId);
    if (!current) return;

    if (cardPath.length >= MAX_PATH_LENGTH) {
      recordPath([...cardPath, currentId], choicePath);
      return;
    }

    const loopIndex = cardPath.indexOf(currentId);
    if (loopIndex !== -1) {
      recordPath([...cardPath, currentId], choicePath);
      return;
    }

    const newCardPath = [...cardPath, currentId];

    if (result[currentId]) {
      result[currentId].status = "triggered";
    }

    if (current.isEnding) {
      recordPath(newCardPath, choicePath);
      return;
    }

    if (current.choices.length === 0) {
      recordPath(newCardPath, choicePath);
      return;
    }

    let hasValidNext = false;
    current.choices.forEach((choice) => {
      if (choice.nextCardId && cardMap.has(choice.nextCardId)) {
        hasValidNext = true;
        dfs(choice.nextCardId, newCardPath, [...choicePath, choice.id]);
      }
    });

    if (!hasValidNext) {
      recordPath(newCardPath, choicePath);
    }
  }

  dfs(openingCard.id, [], []);

  cards.forEach((card) => {
    if (card.isEnding && result[card.id]?.status === "triggered") {
      const pathsToEnding = result[card.id].reachedPaths;
      if (pathsToEnding.length === 0) return;

      const pathClueCounts = pathsToEnding.map((path) => {
        const uniqueClues = new Set<string>();
        path.forEach((cid) => {
          const c = cardMap.get(cid);
          if (c) c.clueTags.forEach((t) => uniqueClues.add(t));
        });
        return uniqueClues.size;
      });

      const allPathsDeficient = pathClueCounts.every((count) => count < CLUE_THRESHOLD);

      if (allPathsDeficient) {
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
  const seenIds = new Map<string, number>();

  path.forEach((cardId, idx) => {
    const card = cardMap.get(cardId);
    if (!card) return;

    const isLoopBack = seenIds.has(cardId);
    const loopBackToStep = seenIds.get(cardId);
    seenIds.set(cardId, idx);

    const firstAppearance: string[] = [];
    card.clueTags.forEach((t) => {
      if (!accumulatedClues.includes(t)) {
        accumulatedClues.push(t);
        firstAppearance.push(t);
      }
    });

    let choiceText: string | undefined;
    let consequence: string | undefined;
    let choiceId: string | undefined;

    if (idx > 0) {
      const prevCard = cardMap.get(path[idx - 1]);
      if (prevCard) {
        const chosen: Choice | undefined = prevCard.choices.find(
          (ch) => ch.nextCardId === cardId,
        );
        if (chosen) {
          choiceId = chosen.id;
          choiceText = chosen.text;
          consequence = chosen.consequence;
        }
      }
    }

    details.push({
      cardId,
      cardTitle: card.title || cardId,
      choiceId,
      choiceText,
      consequence,
      cluesAtThisStep: [...card.clueTags],
      accumulatedClues: [...accumulatedClues],
      isFirstClueAppearance: firstAppearance,
      isLoopBack,
      loopBackToStep,
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

export function analyzePath(
  path: string[],
  cards: StoryCard[],
  details: PathDetail[],
): PathAnalysis {
  const clueAppearanceSteps: { [clue: string]: number } = {};
  details.forEach((d, idx) => {
    d.isFirstClueAppearance.forEach((c) => {
      clueAppearanceSteps[c] = idx;
    });
  });

  const weakPoints: PathWeakPoint[] = [];
  let longestDrySpell = { start: 0, end: 0, length: 0 };
  let dryStart = -1;

  details.forEach((d, idx) => {
    if (d.isFirstClueAppearance.length === 0 && idx > 0) {
      if (dryStart === -1) dryStart = idx - 1;
      const currentLength = idx - dryStart;
      if (currentLength > longestDrySpell.length && currentLength >= 3) {
        longestDrySpell = { start: dryStart, end: idx, length: currentLength };
      }
    } else if (d.isFirstClueAppearance.length > 0) {
      if (dryStart !== -1 && idx - dryStart >= 3) {
        weakPoints.push({
          step: dryStart,
          cardTitle: details[dryStart]?.cardTitle || "",
          reason: `连续 ${idx - dryStart} 步没有出现新线索，叙事节奏偏平`,
        });
      }
      dryStart = -1;
    }
  });

  let endingDrySpellLength = 0;
  let hasEndingDrySpell = false;
  if (dryStart !== -1) {
    endingDrySpellLength = details.length - dryStart;
    hasEndingDrySpell = endingDrySpellLength >= 3;
    if (hasEndingDrySpell) {
      weakPoints.push({
        step: dryStart,
        cardTitle: details[dryStart]?.cardTitle || "",
        reason: `结局前连续 ${endingDrySpellLength} 步没有出现新线索，末尾铺垫偏弱，玩家走向结局时会觉得仓促`,
      });
      if (endingDrySpellLength > longestDrySpell.length) {
        longestDrySpell = {
          start: dryStart,
          end: details.length - 1,
          length: endingDrySpellLength,
        };
      }
    }
  }

  const lastThree = details.slice(Math.max(0, details.length - 3));
  let preEndingNewClues = 0;
  lastThree.forEach((d) => (preEndingNewClues += d.isFirstClueAppearance.length));

  const uniqueClues = Object.keys(clueAppearanceSteps);

  return {
    totalSteps: details.length,
    uniqueClues,
    clueAppearanceSteps,
    weakPoints,
    longestDrySpell,
    preEndingClueCount: preEndingNewClues,
    endingClueDensity: details.length > 0 ? uniqueClues.length / details.length : 0,
    endingDrySpellLength,
    hasEndingDrySpell,
  };
}

export function comparePaths(
  path1: string[],
  path2: string[],
  cards: StoryCard[],
  details1: PathDetail[],
  details2: PathDetail[],
): PathComparison {
  let sharedSteps = 0;
  let divergenceStep = -1;
  let divergenceCardTitle = "";
  const sharedCards: string[] = [];

  const minLen = Math.min(path1.length, path2.length);
  for (let i = 0; i < minLen; i++) {
    if (path1[i] === path2[i]) {
      sharedSteps++;
      sharedCards.push(path1[i]);
    } else {
      divergenceStep = i;
      divergenceCardTitle = i > 0 ? details1[i - 1]?.cardTitle || "" : "";
      break;
    }
  }

  if (divergenceStep === -1) {
    divergenceStep = minLen;
    if (minLen > 0) {
      divergenceCardTitle = details1[minLen - 1]?.cardTitle || "";
    }
  }

  const uniqueToPath1: string[] = path1.slice(divergenceStep);
  const uniqueToPath2: string[] = path2.slice(divergenceStep);

  const clues1 = new Set(getUniqueCluesForPath(path1, cards));
  const clues2 = new Set(getUniqueCluesForPath(path2, cards));
  const sharedClues: string[] = [];
  const uniqueToPath1Clues: string[] = [];
  const uniqueToPath2Clues: string[] = [];

  clues1.forEach((c) => {
    if (clues2.has(c)) sharedClues.push(c);
    else uniqueToPath1Clues.push(c);
  });
  clues2.forEach((c) => {
    if (!clues1.has(c)) uniqueToPath2Clues.push(c);
  });

  const choice1AtDivergence =
    divergenceStep > 0 && divergenceStep < details1.length
      ? details1[divergenceStep]?.choiceText || "（无选择文字）"
      : "—";
  const choice2AtDivergence =
    divergenceStep > 0 && divergenceStep < details2.length
      ? details2[divergenceStep]?.choiceText || "（无选择文字）"
      : "—";

  return {
    sharedSteps,
    divergenceStep,
    divergenceCardTitle,
    sharedCards,
    uniqueToPath1,
    uniqueToPath2,
    sharedClues,
    uniqueToPath1Clues,
    uniqueToPath2Clues,
    choice1AtDivergence,
    choice2AtDivergence,
  };
}

export function generatePathSummary(
  path: string[],
  cards: StoryCard[],
  details: PathDetail[],
  analysis: PathAnalysis,
): string {
  const ending = details[details.length - 1];
  const endingCard = cards.find((c) => c.id === path[path.length - 1]);
  const steps: string[] = [];

  details.forEach((d, i) => {
    if (d.choiceText) {
      steps.push(`第${i + 1}步[选择: ${d.choiceText}] → ${d.cardTitle}`);
    } else {
      steps.push(`第${i + 1}步: ${d.cardTitle}`);
    }
    if (d.isFirstClueAppearance.length > 0) {
      steps[steps.length - 1] += ` ⭐线索: ${d.isFirstClueAppearance.join("、")}`;
    }
    if (d.isLoopBack) {
      steps[steps.length - 1] += ` 🔄(回到第${(d.loopBackToStep || 0) + 1}步)`;
    }
  });

  const endingLabel = endingCard?.endingType
    ? endingCard.endingType === "good"
      ? "好结局"
      : endingCard.endingType === "bad"
      ? "坏结局"
      : "中性结局"
    : "结局";

  const weakPointText =
    analysis.weakPoints.length > 0
      ? `\n\n⚠️ 铺垫薄弱点:\n${analysis.weakPoints.map((w) => `  - 第${w.step + 1}步「${w.cardTitle}」: ${w.reason}`).join("\n")}`
      : "\n\n✅ 线索分布均匀，没有明显薄弱段";

  const verdict =
    analysis.uniqueClues.length >= 2
      ? `伏笔充足（共 ${analysis.uniqueClues.length} 个线索: ${analysis.uniqueClues.join("、")}）`
      : `伏笔不足（仅 ${analysis.uniqueClues.length} 个线索）`;

  return `【路线讲评摘要】${endingLabel}「${ending?.cardTitle}」\n\n剧情走向 (共 ${details.length} 步):\n${steps.join("\n")}\n\n线索首次出现步骤:\n${Object.entries(analysis.clueAppearanceSteps)
    .map(([c, s]) => `  · ${c}: 第${s + 1}步`)
    .join("\n") || "  · 无线索"}${weakPointText}\n\n结论: ${verdict}`;
}

export function generatePathComparisonSummary(
  path1: string[],
  path2: string[],
  cards: StoryCard[],
  details1: PathDetail[],
  details2: PathDetail[],
  comparison: PathComparison,
): string {
  const ending1 = details1[details1.length - 1];
  const ending2 = details2[details2.length - 1];
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  const sharedCardNames = comparison.sharedCards
    .map((id) => cardMap.get(id)?.title || id)
    .join(" → ");
  const unique1Names = comparison.uniqueToPath1
    .map((id) => cardMap.get(id)?.title || id)
    .join(" → ");
  const unique2Names = comparison.uniqueToPath2
    .map((id) => cardMap.get(id)?.title || id)
    .join(" → ");

  return `【路径对比】${ending1?.cardTitle} VS ${ending2?.cardTitle}\n\n一、共同点:\n  · 共享 ${comparison.sharedSteps} 个场景: ${sharedCardNames || "（无）"}\n  · 共享 ${comparison.sharedClues.length} 个线索: ${comparison.sharedClues.join("、") || "（无）"}\n\n二、分歧点:\n  · 第 ${comparison.divergenceStep + 1} 步在「${comparison.divergenceCardTitle}」处开始分歧\n  · 路线1选择: ${comparison.choice1AtDivergence}\n  · 路线2选择: ${comparison.choice2AtDivergence}\n\n三、分支走向差异:\n  · 路线1独有场景: ${unique1Names || "（无）"}\n  · 路线2独有场景: ${unique2Names || "（无）"}\n\n四、线索差异:\n  · 路线1独有线索 (${comparison.uniqueToPath1Clues.length}): ${comparison.uniqueToPath1Clues.join("、") || "（无）"}\n  · 路线2独有线索 (${comparison.uniqueToPath2Clues.length}): ${comparison.uniqueToPath2Clues.join("、") || "（无）"}\n\n五、课堂讲评建议:\n  · 这个分歧点是本课分支设计的典型例子，可以引导学生讨论"不同选择如何走向不同结局"\n  · 两条路线的线索差异可以用来讲解"选择性线索"和"公共线索"的设计区别`;
}

export function generateOverallReviewDraft(
  cards: StoryCard[],
  testResult: TestResult | null,
): OverallReviewDraft {
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (!testResult) {
    return {
      summary: "请先运行路线测试以生成总评草稿。",
      strengths: [],
      improvements: [],
      fullText: "请先运行路线测试，系统将基于测试结果自动生成完整的总评草稿。",
    };
  }

  const values = Object.values(testResult);
  const total = values.length;
  const triggered = values.filter((v) => v.status === "triggered").length;
  const untriggered = values.filter((v) => v.status === "untriggered").length;
  const deficient = values.filter((v) => v.status === "clue-deficient").length;
  const coverage = total > 0 ? Math.round((triggered / total) * 100) : 0;

  const endingCards = cards.filter((c) => c.isEnding);
  const goodEndings = endingCards.filter((c) => c.endingType === "good");
  const badEndings = endingCards.filter((c) => c.endingType === "bad");
  const deficientEndings = endingCards.filter(
    (c) => testResult[c.id]?.status === "clue-deficient",
  );
  const deficientGoodEndings = goodEndings.filter(
    (c) => testResult[c.id]?.status === "clue-deficient",
  );

  const totalPaths = endingCards
    .map((c) => testResult[c.id]?.reachedPaths.length || 0)
    .reduce((a, b) => a + b, 0);

  const allDetailsByEnding: { [endingId: string]: PathDetail[][] } = {};
  endingCards.forEach((e) => {
    allDetailsByEnding[e.id] = (testResult[e.id]?.reachedPaths || []).map((p) =>
      getPathDetails(p, cards),
    );
  });

  const triggeredNonEnding = cards.filter(
    (c) => !c.isEnding && testResult[c.id]?.status === "triggered",
  );
  const avgClues =
    triggeredNonEnding.length > 0
      ? triggeredNonEnding.reduce((s, c) => s + c.clueTags.length, 0) /
        triggeredNonEnding.length
      : 0;

  let summaryParts: string[] = [];
  summaryParts.push(`本次作业共 ${total} 张卡片，${endingCards.length} 个结局（${goodEndings.length} 好 / ${badEndings.length} 坏），完整剧情路径 ${totalPaths} 条。`);
  summaryParts.push(`触发覆盖率 ${coverage}%（${triggered}/${total} 张卡片可到达）。`);

  if (coverage === 100) {
    strengths.push("触发覆盖率 100%，所有设计的场景都能被玩家体验到，结构完整性很好");
  } else if (coverage >= 70) {
    strengths.push(`触发覆盖率 ${coverage}%，大部分卡片已接入主线`);
  } else {
    improvements.push(`${untriggered} 张卡片（${100 - coverage}%）无论如何选择都无法到达，建议检查是否有卡片没有被任何选项指向，或存在断连的分支`);
  }

  if (endingCards.length >= 3) {
    strengths.push(`设计了 ${endingCards.length} 个结局，分支丰富度符合多结局叙事练习的要求`);
  } else if (endingCards.length === 0) {
    improvements.push("还没有标记任何结局卡片，一个完整的互动故事至少需要 1 个结局");
  } else if (endingCards.length < 3) {
    improvements.push(`目前只有 ${endingCards.length} 个结局，作为多结局练习建议至少设计 3 个不同走向（好/坏/中性）`);
  }

  if (deficientEndings.length === 0 && endingCards.length > 0) {
    strengths.push("所有结局的伏笔铺垫都达到了 2 个线索以上的要求，玩家走向结局时不会觉得突兀");
  } else if (deficientEndings.length > 0) {
    const names = deficientEndings.map((c) => `「${c.title}」`).join("、");
    improvements.push(`${deficientEndings.length} 个结局线索不足：${names}。建议在通向这些结局的路径上至少提前 2 张卡片埋下相关线索`);
  }

  if (deficientGoodEndings.length === 0 && goodEndings.length > 0) {
    strengths.push(`所有 ${goodEndings.length} 个好结局伏笔充足，玩家能通过线索感受到好结局是「自己挣来的」`);
  }

  if (avgClues >= 1) {
    strengths.push(`线索密度良好（平均每张触发卡片 ${avgClues.toFixed(1)} 个线索），伏笔分布比较均匀`);
  } else if (avgClues < 0.5 && triggeredNonEnding.length > 3) {
    improvements.push(`线索密度偏低（平均每张触发卡片仅 ${avgClues.toFixed(1)} 个线索），建议在关键转折点多设置线索标签`);
  }

  const divergencePoints: { cardId: string; cardTitle: string; count: number }[] = [];
  triggeredNonEnding.forEach((c) => {
    const validChoices = c.choices.filter(
      (ch) => ch.nextCardId && cards.some((x) => x.id === ch.nextCardId),
    );
    if (validChoices.length >= 2) {
      const allReachable = validChoices.every(
        (ch) => testResult[ch.nextCardId!]?.status !== "untriggered",
      );
      if (allReachable) {
        divergencePoints.push({
          cardId: c.id,
          cardTitle: c.title,
          count: validChoices.length,
        });
      }
    }
  });

  if (divergencePoints.length > 0) {
    strengths.push(
      `设计了 ${divergencePoints.length} 个有意义的分支点：${divergencePoints.map((d) => `「${d.cardTitle}」(${d.count} 个选择)`).join("、")}，玩家的选择能真正影响故事走向`,
    );
  }

  const hasEndingWeakness = Object.entries(allDetailsByEnding).some(([_, allDetails]) =>
    allDetails.some((details) => {
      const a = analyzePath([], cards, details);
      return a.hasEndingDrySpell;
    }),
  );

  if (hasEndingWeakness) {
    improvements.push(
      "部分结局的末尾几步存在「空转」现象——连续多步没有新线索出现。建议在接近结局时保持一定的线索密度，让玩家走向结局时仍有紧张感和预期",
    );
  }

  const summary = summaryParts.join(" ");

  const fullTextParts: string[] = [];
  fullTextParts.push("【作业总评草稿】");
  fullTextParts.push("");
  fullTextParts.push(summary);
  fullTextParts.push("");
  fullTextParts.push("一、做得好的地方：");
  if (strengths.length > 0) {
    strengths.forEach((s, i) => {
      fullTextParts.push(`${i + 1}. ${s}`);
    });
  } else {
    fullTextParts.push("  （待继续挖掘亮点）");
  }
  fullTextParts.push("");
  fullTextParts.push("二、需要改进的地方：");
  if (improvements.length > 0) {
    improvements.forEach((im, i) => {
      fullTextParts.push(`${i + 1}. ${im}`);
    });
  } else {
    fullTextParts.push("  整体完成度不错，可以考虑进一步挑战更复杂的分支结构和线索设计。");
  }
  fullTextParts.push("");
  fullTextParts.push("三、课堂讨论建议：");
  if (divergencePoints.length > 0) {
    fullTextParts.push(
      `  · 可以围绕「${divergencePoints[0].cardTitle}」这个分支点展开讨论：不同选择带来的代价是什么？玩家是否能预见到后果？`,
    );
  }
  if (goodEndings.length > 0 && badEndings.length > 0) {
    fullTextParts.push(
      `  · 对比好结局和坏结局的线索密度差异，讨论"惩罚是否公平"这一设计原则`,
    );
  }
  if (deficientEndings.length > 0) {
    fullTextParts.push(
      `  · 请同学上台为 ${deficientEndings[0].title} 这个结局添加两个合理的线索，现场演示如何让伏笔更自然`,
    );
  }

  return {
    summary,
    strengths,
    improvements,
    fullText: fullTextParts.join("\n"),
  };
}

export type ReviewHint = {
  type: "warning" | "success" | "info";
  title: string;
  detail: string;
  suggestedText: string;
  affectsScore?: Partial<{ ruleStability: number; costClarity: number; foreshadowing: number }>;
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
  const endingCards = cards.filter((c) => c.isEnding);
  const deficientEndings = endingCards.filter(
    (c) => testResult[c.id]?.status === "clue-deficient",
  );
  const goodEndings = endingCards.filter((c) => c.endingType === "good");
  const badEndings = endingCards.filter((c) => c.endingType === "bad");
  const deficientGoodEndings = goodEndings.filter(
    (c) => testResult[c.id]?.status === "clue-deficient",
  );
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

  const graph = getStoryGraph(cards);
  const danglingCards = cards.filter(
    (c) => !c.isOpening && !graph.edges.some((e) => e.to === c.id),
  );

  const allPaths = endingCards.flatMap((e) => testResult[e.id]?.reachedPaths || []);
  let hasEndingDrySpell = false;
  allPaths.forEach((p) => {
    const details = getPathDetails(p, cards);
    const analysis = analyzePath(p, cards, details);
    if (analysis.hasEndingDrySpell) hasEndingDrySpell = true;
  });

  if (total > 0 && untriggered / total > 0.3) {
    hints.push({
      type: "warning",
      title: `${untriggered} 张卡片未被触发（占 ${Math.round((untriggered / total) * 100)}%）`,
      detail: "超过三成的卡片玩家永远走不到，故事结构可能存在断裂",
      suggestedText: `目前有 ${untriggered} 张卡片（约 ${Math.round((untriggered / total) * 100)}%）无论玩家如何选择都无法到达。建议检查：1) 是否有卡片没有被任何选项指向；2) 选项的「指向卡片」是否填写正确；3) 是否存在设计了但没接入主线的废弃剧情。这种覆盖率会让玩家感觉规则飘忽不定。`,
      affectsScore: { ruleStability: -1, costClarity: 0 },
    });
  } else if (untriggered === 0 && total > 0) {
    hints.push({
      type: "success",
      title: "所有卡片均已触发 ✓",
      detail: "每张卡片都至少有一条路径可以到达，结构完整性很好",
      suggestedText: "触发覆盖率做得非常好，所有设计的场景都能被玩家体验到，这体现了故事结构的完整性。",
      affectsScore: { ruleStability: 1, costClarity: 0 },
    });
  }

  if (danglingCards.length > 0 && untriggered > 0) {
    const names = danglingCards.slice(0, 3).map((c) => `「${c.title}」`).join("、");
    hints.push({
      type: "info",
      title: `${danglingCards.length} 张卡片无任何指向`,
      detail: `例如：${names}${danglingCards.length > 3 ? " 等" : ""}`,
      suggestedText: `有 ${danglingCards.length} 张卡片没有被任何其他卡片的选项指向。如果不是故意设计的隐藏彩蛋，建议补上接入方式（如：从某张已触发卡片增加一个选项指向它）。`,
    });
  }

  if (deficientEndings.length > 0) {
    const names = deficientEndings.map((c) => `「${c.title}」`).join("、");
    hints.push({
      type: "warning",
      title: `${deficientEndings.length} 个结局线索不足`,
      detail: `这些结局的所有路径累计线索均少于 2 个：${names}`,
      suggestedText: `${names} 这${deficientEndings.length > 1 ? "些" : "个"}结局的伏笔铺垫明显不够。玩家走到结局时会觉得突兀，缺乏「原来如此」的恍然大悟感。建议在通向这些结局的路径上，至少提前 2 张卡片埋下相关线索标签（如物品、异象、对话暗示等），让玩家在二刷时能呼应上。`,
      affectsScore: { foreshadowing: -2 },
    });
  }

  if (hasEndingDrySpell) {
    hints.push({
      type: "warning",
      title: "部分结局末尾铺垫偏弱",
      detail: "结局前连续多步没有新线索，玩家走向结局时会觉得仓促",
      suggestedText:
        "注意结局前的节奏把控。部分结局在最后 3 步以上没有任何新线索出现，玩家走向结局时会觉得铺垫不足、节奏空转。建议在接近结局的关键几步保持一定的线索密度，或者在结局卡片本身补充一些揭示性信息，让结局落地更扎实。",
      affectsScore: { foreshadowing: -1 },
    });
  }

  if (deficientGoodEndings.length > 0) {
    hints.push({
      type: "warning",
      title: `${deficientGoodEndings.length} 个好结局伏笔不足`,
      detail: "好结局特别需要充足铺垫才能让玩家有「我靠努力换来了好结果」的感觉",
      suggestedText: `好结局尤其需要铺垫。如果玩家做对了所有选择却感觉赢的莫名其妙，成就感会大打折扣。建议为每个好结局至少设计 3 个分散在不同步骤的线索。`,
      affectsScore: { foreshadowing: -1, costClarity: -1 },
    });
  } else if (goodEndings.length > 0 && deficientGoodEndings.length === 0) {
    hints.push({
      type: "success",
      title: "所有好结局伏笔充足 ✓",
      detail: "玩家能通过线索感受到好结局是「自己挣来的」",
      suggestedText: "好结局的铺垫做得不错，玩家应该能通过选择和线索的积累感受到好结果的合理性。",
      affectsScore: { foreshadowing: 1 },
    });
  }

  if (deficientBadEndings.length > 0 && badEndings.length > 0) {
    hints.push({
      type: "info",
      title: `${deficientBadEndings.length} 个坏结局也缺少线索铺垫`,
      detail: "坏结局同样需要让玩家明白「为什么是我死了」",
      suggestedText: "注意：坏结局不代表可以不讲道理。即使玩家选错了，也应该让他回头看时能发现「原来那时候我就应该注意到」。建议为每个坏结局也设置至少 1 个警示性线索。",
      affectsScore: { costClarity: -1 },
    });
  }

  if (avgCluesPerCard < 0.5 && triggeredCards.length > 3) {
    hints.push({
      type: "warning",
      title: `平均每张卡片仅 ${avgCluesPerCard.toFixed(1)} 个线索`,
      detail: "整体线索密度偏低，反转时可能缺乏足够支撑",
      suggestedText: `目前整体线索密度偏低（平均每张触发卡片仅 ${avgCluesPerCard.toFixed(1)} 个线索标签）。建议在关键转折点卡片上多设置线索标签，让伏笔散落在整条故事线上。`,
      affectsScore: { foreshadowing: -1 },
    });
  } else if (avgCluesPerCard >= 1 && triggeredCards.length > 3) {
    hints.push({
      type: "success",
      title: `线索密度良好（平均 ${avgCluesPerCard.toFixed(1)} 个/卡）`,
      detail: "伏笔分布比较均匀",
      suggestedText: "线索密度做得不错，伏笔在故事中有均匀分布，反转时应该有足够的支撑。",
      affectsScore: { foreshadowing: 1 },
    });
  }

  if (endingCards.length === 0) {
    hints.push({
      type: "warning",
      title: "还没有标记任何结局卡片",
      detail: "故事需要至少一个结局",
      suggestedText: "目前没有任何被标记为「结局」的卡片。一个完整的互动故事至少需要一个结局。建议在故事的终点卡片上勾选「结局」选项。",
      affectsScore: { ruleStability: -2, foreshadowing: -1 },
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
      affectsScore: { costClarity: 1 },
    });
  }

  return hints;
}

export function recommendScores(
  cards: StoryCard[],
  testResult: TestResult | null,
  hints: ReviewHint[],
): ScoreRecommendation {
  if (!testResult) {
    return {
      ruleStability: 3,
      costClarity: 3,
      foreshadowing: 3,
      confidence: "low",
      reasoning: "请先运行路线测试以获取评分推荐。",
    };
  }

  let ruleScore = 3;
  let costScore = 3;
  let forescore = 3;

  hints.forEach((h) => {
    if (h.affectsScore) {
      ruleScore += h.affectsScore.ruleStability || 0;
      costScore += h.affectsScore.costClarity || 0;
      forescore += h.affectsScore.foreshadowing || 0;
    }
  });

  ruleScore = Math.max(1, Math.min(5, ruleScore));
  costScore = Math.max(1, Math.min(5, costScore));
  forescore = Math.max(1, Math.min(5, forescore));

  const triggeredCount = Object.values(testResult).filter(
    (v) => v.status !== "untriggered",
  ).length;
  const confidence: "low" | "medium" | "high" =
    cards.length >= 5 && triggeredCount >= 3 ? "high" : cards.length >= 3 ? "medium" : "low";

  const reasoningParts: string[] = [];
  if (confidence === "low") reasoningParts.push("卡片数量较少，推荐仅供参考。");
  reasoningParts.push(
    `规则稳定性: ${ruleScore}/5, 代价清晰度: ${costScore}/5, 伏笔合理性: ${forescore}/5。`,
  );

  return {
    ruleStability: ruleScore,
    costClarity: costScore,
    foreshadowing: forescore,
    confidence,
    reasoning: reasoningParts.join(" "),
  };
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
