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
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Lightbulb,
  GitCompare,
  X,
  ArrowLeftRight,
  Zap,
  Flag,
  Merge,
  GitCommit,
} from "lucide-react";
import { useStoryStore } from "../store/useStoryStore";
import {
  traverseStory,
  getStatusColor,
  getStatusLabel,
  getPathDetails,
  getUniqueCluesForPath,
  analyzePath,
  generatePathSummary,
  comparePaths,
  generatePathComparisonSummary,
  type PathDetail,
  type PathAnalysis,
  type PathComparison,
  type ComparisonTimeline,
} from "../utils/storyEngine";
import { cn } from "../lib/utils";
import type { StoryCard, PathStep } from "../types";

function PathChainView({
  path,
  cards,
  ending,
}: {
  path: PathStep[];
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
  const analysis: PathAnalysis = useMemo(
    () => analyzePath(path, cards, details),
    [path, cards, details],
  );
  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    const summary = generatePathSummary(path, cards, details, analysis);
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("复制失败，请手动选择文本复制");
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-horror-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-horror-warning" />
          <span className="font-medium text-horror-text">因果链详情</span>
          <span className="text-horror-muted">（共 {details.length} 步）</span>
        </div>
        <button
          onClick={handleCopySummary}
          className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded border border-horror-blood/40 text-horror-bloodLight hover:bg-horror-blood/10 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" /> 已复制讲评摘要
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> 复制讲评摘要
            </>
          )}
        </button>
      </div>

      <div className="space-y-2">
        {details.map((step, idx) => (
          <div key={`${step.cardId}-${step.choiceId || "none"}-${idx}`} className="relative pl-5">
            {idx < details.length - 1 && (
              <div
                className={cn(
                  "absolute left-[7px] top-5 bottom-[-8px] w-px",
                  step.isLoopBack ? "bg-horror-warning" : "bg-horror-border",
                )}
              />
            )}
            <div
              className={cn(
                "absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-horror-panel flex items-center justify-center",
                step.isLoopBack
                  ? "border-horror-warning"
                  : step.isFirstClueAppearance.length > 0
                  ? "border-horror-triggerLight"
                  : "border-horror-blood",
              )}
            >
              {step.isFirstClueAppearance.length > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-horror-triggerLight" />
              )}
            </div>

            <div className="text-[10px] text-horror-muted mb-0.5">
              第 {idx + 1} 步
              {step.isLoopBack && (
                <span className="ml-1 text-horror-warning">
                  🔄 循环回指第 {(step.loopBackToStep || 0) + 1} 步
                </span>
              )}
              {step.isFirstClueAppearance.length > 0 && (
                <span className="ml-1 text-horror-triggerLight">
                  ⭐ 新线索出现
                </span>
              )}
            </div>

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
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded border",
                      step.isFirstClueAppearance.includes(t)
                        ? "bg-horror-trigger/20 text-horror-triggerLight border-horror-trigger/40 font-medium"
                        : "bg-horror-blood/15 text-horror-bloodLight border-horror-blood/30",
                    )}
                  >
                    <Tag className="w-2 h-2 inline mr-0.5 -mt-0.5" />
                    {t}
                    {step.isFirstClueAppearance.includes(t) && " 首次"}
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

      <div className="space-y-2">
        <div className="p-2.5 rounded bg-horror-bg/50 border border-horror-border/50">
          <div className="flex items-center gap-1.5 text-xs mb-1.5">
            <Sparkles className="w-3 h-3 text-horror-warning" />
            <span className="text-horror-warning font-medium">
              本路径共收集 {uniqueClues.length} 个不重复线索
            </span>
            {uniqueClues.length < 2 && (
              <span className="text-horror-bloodLight text-[10px] ml-1">
                （不足 2 个，伏笔不够）
              </span>
            )}
          </div>
          {uniqueClues.length > 0 && (
            <div className="space-y-1">
              {uniqueClues.map((c) => {
                const step = analysis.clueAppearanceSteps[c];
                return (
                  <div
                    key={c}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-horror-warning/15 text-horror-warning border border-horror-warning/30">
                      {c}
                    </span>
                    <span className="text-horror-muted">
                      首次出现于第 {typeof step === "number" ? step + 1 : "-"} 步
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {analysis.weakPoints.length > 0 ? (
          <div className="p-2.5 rounded bg-horror-deficient/10 border border-horror-deficient/40">
            <div className="flex items-center gap-1.5 text-xs mb-1.5">
              <AlertCircle className="w-3 h-3 text-horror-bloodLight" />
              <span className="text-horror-bloodLight font-medium">
                ⚠️ 铺垫薄弱段（{analysis.weakPoints.length} 处）
              </span>
            </div>
            <div className="space-y-1">
              {analysis.weakPoints.map((w, i) => (
                <div key={i} className="text-[10px] text-horror-muted">
                  · 第 {w.step + 1} 步「{w.cardTitle}」：{w.reason}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded bg-horror-trigger/10 border border-horror-trigger/30">
            <div className="flex items-center gap-1.5 text-xs">
              <Lightbulb className="w-3 h-3 text-horror-triggerLight" />
              <span className="text-horror-triggerLight font-medium">
                ✅ 线索分布均匀，没有明显薄弱段
              </span>
            </div>
          </div>
        )}

        <div className="p-2.5 rounded bg-horror-card/50 border border-horror-border/50 grid grid-cols-3 gap-2">
          <div>
            <div className="text-[10px] text-horror-muted">结局前 3 步新增线索</div>
            <div className="text-sm font-display font-bold text-horror-text">
              {analysis.preEndingClueCount} 个
              {analysis.preEndingClueCount === 0 && (
                <span className="text-[10px] text-horror-bloodLight ml-1">（太少）</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-horror-muted">线索密度</div>
            <div className="text-sm font-display font-bold text-horror-text">
              {(analysis.endingClueDensity * 10).toFixed(1)} / 10
            </div>
          </div>
          <div>
            <div className="text-[10px] text-horror-muted">末尾空转</div>
            <div
              className={cn(
                "text-sm font-display font-bold",
                analysis.hasEndingDrySpell ? "text-horror-bloodLight" : "text-horror-triggerLight",
              )}
            >
              {analysis.hasEndingDrySpell ? `${analysis.endingDrySpellLength} 步 ⚠️` : "无"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonTimelineView({
  timeline,
  cards,
}: {
  timeline: ComparisonTimeline;
  cards: StoryCard[];
}) {
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  if (timeline.segments.length === 0) return null;

  return (
    <div className="p-2.5 rounded bg-horror-bg/50 border border-horror-border/50">
      <div className="flex items-center gap-1.5 text-xs mb-2">
        <GitCommit className="w-3.5 h-3.5 text-horror-warning" />
        <span className="font-medium text-horror-warning">课堂讲解时间线</span>
      </div>
      <div className="space-y-2">
        {timeline.segments.map((seg, i) => {
          if (seg.type === "shared") {
            return (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-1 w-5 h-5 rounded-full bg-horror-warning/20 border border-horror-warning/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] text-horror-warning font-bold">同</span>
                </div>
                <div>
                  <div className="text-[10px] text-horror-warning font-medium">{seg.label}</div>
                  <div className="text-[10px] text-horror-text flex flex-wrap items-center gap-0.5">
                    {seg.cards1.map((id, j) => (
                      <span key={j} className="flex items-center gap-0.5">
                        <span className="px-1 py-0 rounded bg-horror-warning/10 text-horror-warning text-[9px]">
                          {cardMap.get(id)?.title || id}
                        </span>
                        {j < seg.cards1.length - 1 && <ChevronRight className="w-2 h-2 text-horror-muted" />}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          } else if (seg.type === "divergent") {
            return (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-1 w-5 h-5 rounded-full bg-horror-deficient/20 border border-horror-deficient/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] text-horror-bloodLight font-bold">分</span>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-horror-bloodLight font-medium">{seg.label}</div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    <div className="p-1.5 rounded bg-horror-blood/10 border border-horror-blood/20">
                      <div className="text-[9px] text-horror-bloodLight font-medium">
                        选择「{seg.choice1}」
                      </div>
                      <div className="text-[9px] text-horror-muted flex flex-wrap items-center gap-0.5 mt-0.5">
                        {seg.cards1.map((id, j) => (
                          <span key={j} className="flex items-center gap-0.5">
                            <span>{cardMap.get(id)?.title || id}</span>
                            {j < seg.cards1.length - 1 && <ChevronRight className="w-2 h-2" />}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-horror-trigger/10 border border-horror-trigger/20">
                      <div className="text-[9px] text-horror-triggerLight font-medium">
                        选择「{seg.choice2}」
                      </div>
                      <div className="text-[9px] text-horror-muted flex flex-wrap items-center gap-0.5 mt-0.5">
                        {seg.cards2.map((id, j) => (
                          <span key={j} className="flex items-center gap-0.5">
                            <span>{cardMap.get(id)?.title || id}</span>
                            {j < seg.cards2.length - 1 && <ChevronRight className="w-2 h-2" />}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-1 w-5 h-5 rounded-full bg-horror-trigger/20 border border-horror-trigger/40 flex items-center justify-center flex-shrink-0">
                  <Merge className="w-2.5 h-2.5 text-horror-triggerLight" />
                </div>
                <div>
                  <div className="text-[10px] text-horror-triggerLight font-medium">{seg.label}</div>
                  <div className="text-[9px] text-horror-muted">两条路线在此处重新汇合到同一场景</div>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

function PathComparisonView({
  path1,
  path2,
  cards,
  onClose,
}: {
  path1: { ending: StoryCard; path: PathStep[]; key: string };
  path2: { ending: StoryCard; path: PathStep[]; key: string };
  cards: StoryCard[];
  onClose: () => void;
}) {
  const details1 = useMemo(() => getPathDetails(path1.path, cards), [path1.path, cards]);
  const details2 = useMemo(() => getPathDetails(path2.path, cards), [path2.path, cards]);
  const comparison: PathComparison = useMemo(
    () => comparePaths(path1.path, path2.path, cards, details1, details2),
    [path1.path, path2.path, cards, details1, details2],
  );
  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    const summary = generatePathComparisonSummary(
      path1.path,
      path2.path,
      cards,
      details1,
      details2,
      comparison,
    );
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("复制失败，请手动选择文本复制");
    }
  };

  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const sharedNames = comparison.sharedCards.map((id) => cardMap.get(id)?.title || id);
  const unique1Names = comparison.uniqueToPath1.map((id) => cardMap.get(id)?.title || id);
  const unique2Names = comparison.uniqueToPath2.map((id) => cardMap.get(id)?.title || id);

  return (
    <div className="p-3 rounded-lg bg-gradient-to-br from-horror-card to-horror-bg border-2 border-horror-warning/40 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GitCompare className="w-4 h-4 text-horror-warning" />
          <span className="text-sm font-medium text-horror-text">路径对比视图</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded border border-horror-blood/40 text-horror-bloodLight hover:bg-horror-blood/10 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" /> 已复制
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> 复制对比摘要
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-horror-deficient/20 text-horror-muted hover:text-horror-bloodLight transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded bg-horror-blood/10 border border-horror-blood/30">
          <div className="flex items-center gap-1 text-[11px]">
            {path1.ending.endingType === "good" ? (
              <CheckCircle className="w-3 h-3 text-horror-triggerLight" />
            ) : path1.ending.endingType === "bad" ? (
              <XCircle className="w-3 h-3 text-horror-bloodLight" />
            ) : (
              <Flag className="w-3 h-3 text-horror-warning" />
            )}
            <span className="font-medium text-horror-text truncate">{path1.ending.title}</span>
          </div>
          <div className="text-[10px] text-horror-muted mt-0.5">{path1.path.length} 步</div>
        </div>
        <div className="p-2 rounded bg-horror-trigger/10 border border-horror-trigger/30">
          <div className="flex items-center gap-1 text-[11px]">
            {path2.ending.endingType === "good" ? (
              <CheckCircle className="w-3 h-3 text-horror-triggerLight" />
            ) : path2.ending.endingType === "bad" ? (
              <XCircle className="w-3 h-3 text-horror-bloodLight" />
            ) : (
              <Flag className="w-3 h-3 text-horror-warning" />
            )}
            <span className="font-medium text-horror-text truncate">{path2.ending.title}</span>
          </div>
          <div className="text-[10px] text-horror-muted mt-0.5">{path2.path.length} 步</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2 rounded bg-horror-bg/50 border border-horror-border/50">
          <div className="text-[10px] text-horror-muted mb-0.5">共享场景</div>
          <div className="text-xl font-display font-bold text-horror-warning">
            {comparison.sharedSteps}
          </div>
        </div>
        <div className="p-2 rounded bg-horror-bg/50 border border-horror-border/50">
          <div className="text-[10px] text-horror-muted mb-0.5">共享线索</div>
          <div className="text-xl font-display font-bold text-horror-warning">
            {comparison.sharedClues.length}
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded bg-horror-warning/10 border border-horror-warning/40">
        <div className="flex items-center gap-1.5 text-xs mb-1.5">
          <ArrowLeftRight className="w-3.5 h-3.5 text-horror-warning" />
          <span className="font-medium text-horror-warning">
            第 {comparison.divergenceStep + 1} 步在「{comparison.divergenceCardTitle}」处分歧
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-1.5 rounded bg-horror-blood/10 border border-horror-blood/30">
            <div className="text-horror-bloodLight font-medium mb-0.5">路线 1 选择：</div>
            <div className="text-horror-text">{comparison.choice1AtDivergence}</div>
          </div>
          <div className="p-1.5 rounded bg-horror-trigger/10 border border-horror-trigger/30">
            <div className="text-horror-triggerLight font-medium mb-0.5">路线 2 选择：</div>
            <div className="text-horror-text">{comparison.choice2AtDivergence}</div>
          </div>
        </div>
      </div>

      <ComparisonTimelineView timeline={comparison.timeline} cards={cards} />

      <div className="space-y-2">
        {sharedNames.length > 0 && (
          <div>
            <div className="text-[10px] text-horror-warning font-medium mb-1 flex items-center gap-1">
              <Circle className="w-2.5 h-2.5 fill-horror-warning text-horror-warning" />
              共享场景（{comparison.sharedSteps}）:
            </div>
            <div className="text-[10px] text-horror-text flex flex-wrap items-center gap-1">
              {sharedNames.map((n, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-horror-warning/15 border border-horror-warning/30">
                    {n}
                  </span>
                  {i < sharedNames.length - 1 && <ChevronRight className="w-2.5 h-2.5 text-horror-muted" />}
                </span>
              ))}
            </div>
          </div>
        )}
        {unique1Names.length > 0 && (
          <div>
            <div className="text-[10px] text-horror-bloodLight font-medium mb-1 flex items-center gap-1">
              <XCircle className="w-2.5 h-2.5 text-horror-bloodLight" />
              {path1.ending.title} 独有场景（{comparison.uniqueToPath1.length}）:
            </div>
            <div className="text-[10px] text-horror-text flex flex-wrap items-center gap-1">
              {unique1Names.map((n, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-horror-blood/15 border border-horror-blood/30">
                    {n}
                  </span>
                  {i < unique1Names.length - 1 && <ChevronRight className="w-2.5 h-2.5 text-horror-muted" />}
                </span>
              ))}
            </div>
          </div>
        )}
        {unique2Names.length > 0 && (
          <div>
            <div className="text-[10px] text-horror-triggerLight font-medium mb-1 flex items-center gap-1">
              <CheckCircle className="w-2.5 h-2.5 text-horror-triggerLight" />
              {path2.ending.title} 独有场景（{comparison.uniqueToPath2.length}）:
            </div>
            <div className="text-[10px] text-horror-text flex flex-wrap items-center gap-1">
              {unique2Names.map((n, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-horror-trigger/15 border border-horror-trigger/30">
                    {n}
                  </span>
                  {i < unique2Names.length - 1 && <ChevronRight className="w-2.5 h-2.5 text-horror-muted" />}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {comparison.sharedClues.length > 0 && (
          <div className="p-2 rounded bg-horror-bg/50 border border-horror-border/50">
            <div className="text-[10px] text-horror-warning font-medium mb-1">
              共享线索（{comparison.sharedClues.length}）: {comparison.sharedClues.join("、")}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-horror-blood/10 border border-horror-blood/30">
            <div className="text-[10px] text-horror-bloodLight font-medium mb-0.5">
              {path1.ending.title} 独有线索
            </div>
            <div className="text-[10px] text-horror-text">
              {comparison.uniqueToPath1Clues.length > 0
                ? comparison.uniqueToPath1Clues.join("、")
                : "（无）"}
            </div>
          </div>
          <div className="p-2 rounded bg-horror-trigger/10 border border-horror-trigger/30">
            <div className="text-[10px] text-horror-triggerLight font-medium mb-0.5">
              {path2.ending.title} 独有线索
            </div>
            <div className="text-[10px] text-horror-text">
              {comparison.uniqueToPath2Clues.length > 0
                ? comparison.uniqueToPath2Clues.join("、")
                : "（无）"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RouteTestPanel() {
  const { cards, testResult, setTestResult } = useStoryStore();
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const openingCard = useMemo(() => cards.find((c) => c.isOpening), [cards]);
  const endingCards = useMemo(() => cards.filter((c) => c.isEnding), [cards]);

  const stats = useMemo(() => {
    if (!testResult) return null;
    const values = Object.values(testResult);
    const untriggered = values.filter((v) => v.status === "untriggered").length;
    const deficient = values.filter((v) => v.status === "clue-deficient").length;
    const reachable = values.length - untriggered;
    return {
      reachable,
      untriggered,
      deficient,
      total: values.length,
      coverage: values.length > 0 ? Math.round((reachable / values.length) * 100) : 0,
      paths: endingCards
        .map((c) => testResult[c.id]?.reachedPaths.length || 0)
        .reduce((a, b) => a + b, 0),
    };
  }, [testResult, endingCards]);

  const handleRunTest = () => {
    const result = traverseStory(cards);
    setTestResult(result);
    setExpandedPath(null);
    setCompareMode(false);
    setSelectedForCompare([]);
  };

  const handleClearTest = () => {
    setTestResult(null);
    setExpandedPath(null);
    setCompareMode(false);
    setSelectedForCompare([]);
  };

  function normalizeStep(step: PathStep | string): PathStep {
    if (typeof step === "string") {
      return { cardId: step };
    }
    return step;
  }

  const allPaths = useMemo(() => {
    if (!testResult) return [];
    const paths: {
      key: string;
      ending: StoryCard;
      path: PathStep[];
      clues: number;
      hasLoop: boolean;
      choiceLabel: string;
    }[] = [];
    const cardMap = new Map(cards.map((c) => [c.id, c]));
    endingCards.forEach((ending) => {
      const rawPaths = testResult[ending.id]?.reachedPaths || [];
      rawPaths.forEach((rawP, pIdx) => {
        const p: PathStep[] = rawP.map(normalizeStep);
        const uniqueClues = new Set<string>();
        const seenIds = new Set<string>();
        let hasLoop = false;
        const choiceLabels: string[] = [];
        p.forEach((step) => {
          const c = cardMap.get(step.cardId);
          if (c) c.clueTags.forEach((t) => uniqueClues.add(t));
          if (seenIds.has(step.cardId)) hasLoop = true;
          seenIds.add(step.cardId);
          if (step.choiceId && c) {
            const stepIdx = p.findIndex((s) => s.cardId === step.cardId);
            if (stepIdx > 0) {
              const prevCard = cardMap.get(p[stepIdx - 1].cardId);
              if (prevCard) {
                const ch = prevCard.choices.find((c2) => c2.id === step.choiceId);
                if (ch) choiceLabels.push(ch.text);
              }
            }
          }
        });
        paths.push({
          key: `${ending.id}-${pIdx}`,
          ending,
          path: p,
          clues: uniqueClues.size,
          hasLoop,
          choiceLabel: choiceLabels.join(" → ") || ending.title,
        });
      });
    });
    return paths;
  }, [testResult, endingCards, cards]);

  const toggleCompareSelect = (key: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 2) {
        return [prev[1], key];
      }
      return [...prev, key];
    });
  };

  const selectedItems = useMemo(() => {
    if (selectedForCompare.length !== 2) return null;
    const item1 = allPaths.find((p) => p.key === selectedForCompare[0]);
    const item2 = allPaths.find((p) => p.key === selectedForCompare[1]);
    if (!item1 || !item2) return null;
    return { path1: item1, path2: item2 };
  }, [selectedForCompare, allPaths]);

  return (
    <div className="panel-container flex flex-col h-full">
      <div className="panel-header">
        <Route className="w-5 h-5 text-horror-bloodLight" />
        <h2 className="font-display font-semibold text-lg tracking-wide">路线测试区</h2>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-b border-horror-border/50 flex-wrap">
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
          <>
            <button onClick={handleClearTest} className="horror-btn flex items-center gap-1.5">
              <Square className="w-4 h-4" />
              清除测试结果
            </button>
            <button
              onClick={handleRunTest}
              className="horror-btn flex items-center gap-1.5"
              title="重新运行"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重测
            </button>
            {allPaths.length >= 2 && (
              <button
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedForCompare([]);
                }}
                className={cn(
                  "horror-btn flex items-center gap-1.5 text-xs",
                  compareMode && "bg-horror-warning/20 border-horror-warning/40 text-horror-warning",
                )}
                title="进入路径对比模式"
              >
                <GitCompare className="w-3.5 h-3.5" />
                {compareMode ? "退出对比" : "对比模式"}
              </button>
            )}
          </>
        )}
        {!openingCard && (
          <span className="text-xs text-horror-warning flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            请先标记一张开场卡片
          </span>
        )}
        {compareMode && (
          <span className="ml-auto text-[11px] text-horror-warning flex items-center gap-1">
            <Zap className="w-3 h-3" />
            请选择两条路径进行对比（已选 {selectedForCompare.length}/2）
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {compareMode && selectedItems && (
          <PathComparisonView
            path1={selectedItems.path1}
            path2={selectedItems.path2}
            cards={cards}
            onClose={() => setSelectedForCompare([])}
          />
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded bg-horror-card border border-horror-border">
              <div className="text-xs text-horror-muted mb-1">触发覆盖率</div>
              <div className="text-2xl font-display font-bold text-horror-triggerLight">
                {stats.coverage}
                <span className="text-sm text-horror-muted font-normal">%</span>
              </div>
              <div className="text-[10px] text-horror-muted mt-0.5">
                {stats.reachable} / {stats.total} 张可到达
                {stats.deficient > 0 && (
                  <span className="text-horror-bloodLight">（含 {stats.deficient} 张线索不足）</span>
                )}
              </div>
              <div className="h-1.5 mt-2 rounded-full bg-horror-bg overflow-hidden">
                <div
                  className="h-full bg-horror-trigger transition-all duration-500"
                  style={{ width: `${stats.coverage}%` }}
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
                    {stats.untriggered} 不可达
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
                  {getStatusLabel("clue-deficient")} — 可到达但所有路径线索均少于 2 个
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
              <span className="text-xs text-horror-muted">
                （点击路径展开详情
                {compareMode ? "，或点击左侧复选框加入对比" : "，可复制讲评摘要）"}
              </span>
            </div>
            {allPaths.map((item) => {
              const isExpanded = expandedPath === item.key;
              const isSelected = selectedForCompare.includes(item.key);
              return (
                <div
                  key={item.key}
                  className={cn(
                    "rounded border overflow-hidden transition-all",
                    isSelected
                      ? "ring-2 ring-horror-warning border-horror-warning"
                      : item.clues < 2
                      ? "bg-horror-deficient/10 border-horror-deficient/50"
                      : "bg-horror-trigger/10 border-horror-trigger/30",
                  )}
                >
                  <div className="flex">
                    {compareMode && (
                      <button
                        onClick={() => toggleCompareSelect(item.key)}
                        className={cn(
                          "px-2 flex items-center justify-center border-r transition-colors",
                          isSelected
                            ? "bg-horror-warning/20 border-horror-warning/50 text-horror-warning"
                            : "bg-horror-bg/50 border-horror-border/50 text-horror-muted hover:text-horror-warning",
                        )}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded border border-current" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedPath(isExpanded ? null : item.key)}
                      className="flex-1 p-3 text-left flex flex-col gap-2 hover:bg-horror-bg/30 transition-colors"
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
                          {item.hasLoop && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-horror-warning/20 text-horror-warning ml-1">
                              含循环
                            </span>
                          )}
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
                        {item.path.map((step, i) => {
                          const c = cards.find((card) => card.id === step.cardId);
                          const isRepeat =
                            i > 0 && item.path.slice(0, i).some((s) => s.cardId === step.cardId);
                          const showChoice = step.choiceId && i > 0;
                          return (
                            <span key={`${step.cardId}-${step.choiceId || "no"}-${i}`} className="flex items-center gap-1">
                              {showChoice && (
                                <span className="text-[9px] px-1 py-0 rounded bg-horror-blood/15 text-horror-bloodLight">
                                  {(() => {
                                    if (i === 0) return "";
                                    const prevCard = cards.find((card) => card.id === item.path[i - 1].cardId);
                                    if (!prevCard) return "";
                                    const ch = prevCard.choices.find((c2) => c2.id === step.choiceId);
                                    return ch ? (ch.text.length > 4 ? ch.text.slice(0, 4) + "…" : ch.text) : "";
                                  })()}
                                </span>
                              )}
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded",
                                  isRepeat
                                    ? "bg-horror-warning/20 text-horror-warning border border-horror-warning/40 border-dashed"
                                    : "",
                                )}
                                style={
                                  !isRepeat && testResult?.[step.cardId]
                                    ? {
                                        backgroundColor: `${getStatusColor(testResult[step.cardId].status)}20`,
                                        color: getStatusColor(testResult[step.cardId].status),
                                      }
                                    : undefined
                                }
                              >
                                {c?.title || step.cardId}
                                {isRepeat && " 🔄"}
                              </span>
                              {i < item.path.length - 1 && (
                                <ChevronRight className="w-3 h-3 text-horror-muted" />
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  </div>
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
            <p className="text-sm">点击「运行路线测试」</p>
            <p className="text-xs mt-1">工具将自动遍历所有剧情分支（支持循环和汇合）</p>
            <p className="text-xs mt-3">并标记未触发卡片和线索不足的结局</p>
            <p className="text-xs mt-1">展开路径可查看完整因果链报告和讲评摘要</p>
            <p className="text-xs mt-1">点击「对比模式」可选择两条路径进行分支分析</p>
          </div>
        )}
      </div>
    </div>
  );
}
