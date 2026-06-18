import { useMemo } from "react";
import { Route, Play, Square, GitBranch, Circle, AlertTriangle, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { useStoryStore } from "../store/useStoryStore";
import { traverseStory, getStatusColor, getStatusLabel } from "../utils/storyEngine";
import { cn } from "../lib/utils";
import type { StoryCard } from "../types";

export default function RouteTestPanel() {
  const { cards, testResult, setTestResult } = useStoryStore();

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
  };

  const handleClearTest = () => {
    setTestResult(null);
  };

  const allPaths = useMemo(() => {
    if (!testResult) return [];
    const paths: { ending: StoryCard; path: string[]; clues: number }[] = [];
    endingCards.forEach((ending) => {
      const pathsToEnding = testResult[ending.id]?.reachedPaths || [];
      pathsToEnding.forEach((p) => {
        let clueCount = 0;
        p.forEach((cid) => {
          const c = cards.find((card) => card.id === cid);
          if (c) clueCount += c.clueTags.length;
        });
        paths.push({ ending, path: p, clues: clueCount });
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
                  {getStatusLabel("clue-deficient")} — 结局路径线索少于2个，伏笔不足
                </span>
              </div>
            </div>
          </div>
        )}

        {allPaths.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-horror-warning" />
              <span className="text-sm font-medium">剧情路径一览</span>
              <span className="text-xs text-horror-muted">（点击左栏卡片查看详情）</span>
            </div>
            {allPaths.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded border",
                  item.clues < 2
                    ? "bg-horror-deficient/10 border-horror-deficient/50"
                    : "bg-horror-trigger/10 border-horror-trigger/30",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    {item.ending.endingType === "good" && (
                      <CheckCircle className="w-3 h-3 text-horror-triggerLight" />
                    )}
                    {item.ending.endingType === "bad" && (
                      <XCircle className="w-3 h-3 text-horror-bloodLight" />
                    )}
                    {item.ending.endingType === "neutral" && (
                      <Circle className="w-3 h-3 text-horror-warning" />
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
                <div className="flex flex-wrap items-center gap-1 text-xs">
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
              </div>
            ))}
          </div>
        )}

        {!testResult && (
          <div className="text-center py-12 text-horror-muted">
            <Route className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">点击"运行路线测试"</p>
            <p className="text-xs mt-1">工具将自动遍历所有剧情分支</p>
            <p className="text-xs mt-3">并标记哪些卡片从未触发、哪些结局线索不足</p>
          </div>
        )}
      </div>
    </div>
  );
}
