import { useMemo, useState } from "react";
import {
  Route,
  Play,
  Square,
  GitBranch,
  Circle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Tag,
  Eye,
  Sparkles,
} from "lucide-react";
import { useStoryStore } from "../store/useStoryStore";
import {
  traverseStory,
  getStatusColor,
  getStatusLabel,
  getPathDetails,
  getUniqueCluesForPath,
  type PathDetail,
} from "../utils/storyEngine";
import { cn } from "../lib/utils";
import type { StoryCard } from "../types";

function PathChainView({
  path,
  cards,
  ending,
}: {
  path: string[];
  cards: StoryCard[];
  ending: StoryCard;
}) {
  const details: PathDetail[] = useMemo(
    () => getPathDetails(path, cards),
    [path, cards],
  );

  const uniqueClues = useMemo(
    () => getUniqueCluesForPath(path, cards),
    [path, cards],
  );

  return (
    <div className="mt-3 pt-3 border-t border-horror-border/50 space-y-3">
      <div className="space-y-2">
        {details.map((step, idx) => (
          <div key={idx} className="relative pl-5">
            {idx < details.length - 1 && (
              <div className="absolute left-[7px] top-5 bottom-[-8px] w-px bg-horror-border" />
            )}
            <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-horror-blood bg-horror-panel" />

            {step.choiceText && (
              <div className="mb-1.5 flex items-start gap-1.5 text-xs">
                <ArrowRight className="w-3 h-3 mt-0.5 text-horror-bloodLight flex-shrink-0" />
                <span className="text-horror-bloodLight font-medium">
                  玩家选择：
                </span>
                <span className="text-horror-text">{step.choiceText}</span>
              </div>
            )}
            {step.consequence && (
              <div className="mb-1.5 ml-4 text-xs text-horror-muted italic">
                → {step.consequence}
              </div>
            )}

            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="w-3 h-3 text-horror-warning flex-shrink-0" />
              <span className="text-sm font-medium text-horror-text">
                {step.cardTitle}
                {idx === 0 && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-horror-blood/20 text-horror-bloodLight">
                    开场
                  </span>
                )}
                {idx === details.length - 1 && ending.isEnding && (
                  <span
                    className={cn(
                      "ml-1.5 text-[10px] px-1.5 py-0.5 rounded",
                      ending.endingType === "good" &&
                        "bg-horror-trigger/20 text-horror-triggerLight",
                      ending.endingType === "bad" &&
                        "bg-horror-deficient/30 text-horror-bloodLight",
                      (ending.endingType === "neutral" || !ending.endingType) &&
                        "bg-horror-warning/20 text-horror-warning",
                    )}
                  >
                    {ending.endingType === "good" && "好结局"}
                    {ending.endingType === "bad" && "坏结局"}
                    {ending.endingType === "neutral" && "中性结局"}
                    {!ending.endingType && "结局"}
                  </span>
                )}
              </span>
            </div>

            {step.cluesAtThisStep.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {step.cluesAtThisStep.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-horror-blood/15 text-horror-bloodLight border border-horror-blood/30"
                  >
                    <Tag className="w-2 h-2 inline mr-0.5 -mt-0.5" />
                    {t}
                  </span>
                ))}
              </div>
            )}

            {step.accumulatedClues.length > 0 && idx > 0 && (
              <div className="text-[10px] text-horror-muted">
                累计线索：
                <span className="text-horror-warning">
                  {step.accumulatedClues.length}
                </span>{" "}
                个（{step.accumulatedClues.join("、")}）
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-2.5 rounded bg-horror-bg/50 border border-horror-border/50">
        <div className="flex items-center gap-1.5 text-xs mb-1">
          <Sparkles className="w-3 h-3 text-horror-warning" />
          <span className="text-horror-warning font-medium">
            本路径共收集 {uniqueClues.length} 个不重复线索
          </span>
          {uniqueClues.length < 2 && (
            <span className="text-horror-bloodLight text-[10px] ml-1">
              （不足2个，伏笔不够）
            </span>
          )}
        </div>
        {uniqueClues.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {uniqueClues.map((c, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-horror-warning/15 text-horror-warning border border-horror-warning/30"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RouteTestPanel() {
  const { cards, testResult, setTestResult } = useStoryStore();
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  const openingCard = useMemo(() => cards.find((c) => c.isOpening), [cards]);
  const endingCards = useMemo(() => cards.filter((c) => c.isEnding), [cards]);

  const stats = useMemo(() => {
    if (!testResult) return null;
    const values = Object.values(testResult);
    return {
      triggered: values.filter((v) => v.status === "triggered").length,
      untriggered: values.filter((v) => v.status === "untriggered").length,
      deficient: values.filter((v) => v.status === "clue-deficient").length,
      total: values.length,
      paths: endingCards
        .map((c) => testResult[c.id]?.reachedPaths.length || 0)
        .reduce((a, b) => a + b, 0),
    };
  }, [testResult, endingCards]);

  const handleRunTest = () => {
    const result = traverseStory(cards);
    setTestResult(result);
    setExpandedPath(null);
  };

  const handleClearTest = () => {
    setTestResult(null);
    setExpandedPath(null);
  };

  const allPaths = useMemo(() => {
    if (!testResult) return [];
    const paths: {
      key: string;
      ending: StoryCard;
      path: string[];
      clues: number;
    }[] = [];
    endingCards.forEach((ending) => {
      const pathsToEnding = testResult[ending.id]?.reachedPaths || [];
      pathsToEnding.forEach((p, pIdx) => {
        const uniqueClues = new Set<string>();
        p.forEach((cid) => {
          const c = cards.find((card) => card.id === cid);
          if (c) c.clueTags.forEach((t) => uniqueClues.add(t));
        });
        paths.push({
          key: `${ending.id}-${pIdx}`,
          ending,
          path: p,
          clues: uniqueClues.size,
        });
      });
    });
    return paths;
  }, [testResult, endingCards, cards]);

  return (
    <div className="panel-container flex flex-col h-full">
      <div className="panel-header">
        <Route className="w-5 h-5 text-horror-bloodLight" />
        <h2 className="font-display font-semibold text-lg tracking-wide">路线测试区</h2>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-b border-horror-border/50">
        {!testResult ? (
          <button
            onClick={handleRunTest}
            disabled={!openingCard}
            className="horror-btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            运行路线测试
          </button>
        ) : (
          <button onClick={handleClearTest} className="horror-btn flex items-center gap-1.5">
            <Square className="w-4 h-4" />
            清除测试结果
          </button>
        )}
        {!openingCard && (
          <span className="text-xs text-horror-warning flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            请先标记一张开场卡片
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {stats && (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded bg-horror-card border border-horror-border">
              <div className="text-xs text-horror-muted mb-1">触发覆盖率</div>
              <div className="text-2xl font-display font-bold text-horror-triggerLight">
                {stats.triggered}
                <span className="text-sm text-horror-muted font-normal"> / {stats.total}</span>
              </div>
              <div className="h-1.5 mt-2 rounded-full bg-horror-bg overflow-hidden">
                <div
                  className="h-full bg-horror-trigger transition-all duration-500"
                  style={{ width: `${(stats.triggered / stats.total) * 100}%` }}
                />
              </div>
            </div>
            <div className="p-3 rounded bg-horror-card border border-horror-border">
              <div className="text-xs text-horror-muted mb-1">完整剧情路径</div>
              <div className="text-2xl font-display font-bold text-horror-bloodLight">
                {stats.paths}
                <span className="text-sm text-horror-muted font-normal"> 条</span>
              </div>
              <div className="flex gap-2 mt-2 text-xs">
                {stats.untriggered > 0 && (
                  <span className="flex items-center gap-1 text-horror-muted">
                    <XCircle className="w-3 h-3" />
                    {stats.untriggered} 未触发
                  </span>
                )}
                {stats.deficient > 0 && (
                  <span className="flex items-center gap-1 text-horror-bloodLight">
                    <AlertTriangle className="w-3 h-3" />
                    {stats.deficient} 线索不足
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {testResult && (
          <div className="p-3 rounded bg-horror-card border border-horror-border">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-horror-bloodLight" />
              <span className="text-sm font-medium">颜色图例</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: getStatusColor("triggered") }}
                />
                <span className="text-horror-muted">
                  {getStatusLabel("triggered")} — 玩家可通过选择到达此卡片
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: getStatusColor("untriggered") }}
                />
                <span className="text-horror-muted">
                  {getStatusLabel("untriggered")} — 没有任何分支能到达这张卡片
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm animate-pulse"
                  style={{ backgroundColor: getStatusColor("clue-deficient") }}
                />
                <span className="text-horror-muted">
                  {getStatusLabel("clue-deficient")} — 所有到达路径线索均少于2个
                </span>
              </div>
            </div>
          </div>
        )}

        {allPaths.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-horror-warning" />
              <span className="text-sm font-medium">因果链报告</span>
              <span className="text-xs text-horror-muted">（点击路径展开详情）</span>
            </div>
            {allPaths.map((item) => {
              const isExpanded = expandedPath === item.key;
              return (
                <div
                  key={item.key}
                  className={cn(
                    "rounded border overflow-hidden transition-all",
                    item.clues < 2
                      ? "bg-horror-deficient/10 border-horror-deficient/50"
                      : "bg-horror-trigger/10 border-horror-trigger/30",
                  )}
                >
                  <button
                    onClick={() => setExpandedPath(isExpanded ? null : item.key)}
                    className="w-full p-3 text-left flex flex-col gap-2 hover:bg-horror-bg/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium flex items-center gap-1.5">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-horror-muted" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-horror-muted" />
                        )}
                        {item.ending.endingType === "good" && (
                          <CheckCircle className="w-3.5 h-3.5 text-horror-triggerLight" />
                        )}
                        {item.ending.endingType === "bad" && (
                          <XCircle className="w-3.5 h-3.5 text-horror-bloodLight" />
                        )}
                        {item.ending.endingType === "neutral" && (
                          <Circle className="w-3.5 h-3.5 text-horror-warning" />
                        )}
                        {item.ending.title}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          item.clues < 2
                            ? "bg-horror-deficient/30 text-horror-bloodLight"
                            : "bg-horror-trigger/30 text-horror-triggerLight",
                        )}
                      >
                        {item.clues} 个线索{item.clues < 2 && " · 不足"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-xs ml-5">
                      {item.path.map((cid, i) => {
                        const c = cards.find((card) => card.id === cid);
                        return (
                          <span key={cid} className="flex items-center gap-1">
                            <span
                              className="px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: testResult?.[cid]
                                  ? `${getStatusColor(testResult[cid].status)}20`
                                  : undefined,
                                color: testResult?.[cid]
                                  ? getStatusColor(testResult[cid].status)
                                  : undefined,
                              }}
                            >
                              {c?.title || cid}
                            </span>
                            {i < item.path.length - 1 && (
                              <ChevronRight className="w-3 h-3 text-horror-muted" />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3">
                      <PathChainView
                        path={item.path}
                        cards={cards}
                        ending={item.ending}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!testResult && (
          <div className="text-center py-12 text-horror-muted">
            <Route className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">点击"运行路线测试"</p>
            <p className="text-xs mt-1">工具将自动遍历所有剧情分支</p>
            <p className="text-xs mt-3">并标记未触发卡片和线索不足的结局</p>
            <p className="text-xs mt-1">展开路径可查看完整因果链报告</p>
          </div>
        )}
      </div>
    </div>
  );
}
