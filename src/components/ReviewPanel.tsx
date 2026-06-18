import { useState, useMemo } from "react";
import {
  MessageSquare,
  Star,
  Save,
  Trash2,
  Clock,
  BookOpen,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Wand2,
  ChevronRight,
  ThumbsUp,
  BrainCircuit,
  Sparkle,
  FileText,
  Copy,
  Check,
  ScrollText,
} from "lucide-react";
import { useStoryStore } from "../store/useStoryStore";
import {
  generateReviewHints,
  recommendScores,
  generateOverallReviewDraft,
  type ReviewHint,
  type ScoreRecommendation,
  type OverallReviewDraft,
} from "../utils/storyEngine";
import { cn } from "../lib/utils";

type CriterionKey = "ruleStability" | "costClarity" | "foreshadowing";

const criteria: {
  key: CriterionKey;
  title: string;
  subtitle: string;
  icon: typeof BookOpen;
  descriptions: string[];
}[] = [
  {
    key: "ruleStability",
    title: "恐怖规则是否稳定",
    subtitle: "鬼魂/诅咒的设定前后一致吗？",
    icon: BookOpen,
    descriptions: [
      "规则完全混乱，毫无逻辑",
      "规则有明显矛盾，容易出戏",
      "规则基本自洽，但有小漏洞",
      "规则稳定清晰，玩家能理解边界",
      "规则完美自洽，所有事件都在规则内发生",
    ],
  },
  {
    key: "costClarity",
    title: "玩家是否能理解代价",
    subtitle: "每个选择的后果是否有预兆？",
    icon: AlertCircle,
    descriptions: [
      "选择后果完全随机，玩家不知所措",
      "代价隐晦，大部分玩家察觉不到",
      "代价有一定提示，但不够明确",
      "选择前能感知风险，代价合理",
      "每个选择的代价都有充分铺垫，玩家选择时心知肚明",
    ],
  },
  {
    key: "foreshadowing",
    title: "反转是否有伏笔",
    subtitle: "结局是否在前文埋下线索？",
    icon: Sparkles,
    descriptions: [
      "反转毫无铺垫，纯属突兀",
      "伏笔极少，结局出人意料但不讲道理",
      "有少量伏笔，但不够支撑反转",
      "伏笔分布合理，回头看能发现线索",
      "伏笔精心埋设，二刷时处处呼应，令人拍案",
    ],
  },
];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              (hover || value) >= i
                ? "text-horror-warning fill-horror-warning"
                : "text-horror-muted",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ScoreRecommendCard({
  rec,
  onApply,
  applied,
}: {
  rec: ScoreRecommendation;
  onApply: () => void;
  applied: boolean;
}) {
  const confColor =
    rec.confidence === "high"
      ? "text-horror-triggerLight"
      : rec.confidence === "medium"
      ? "text-horror-warning"
      : "text-horror-muted";

  const confLabel =
    rec.confidence === "high" ? "高置信度" : rec.confidence === "medium" ? "中置信度" : "参考";

  return (
    <div className="p-3 rounded bg-gradient-to-br from-horror-card/80 to-horror-bg/50 border border-horror-border/80 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BrainCircuit className="w-4 h-4 text-horror-bloodLight" />
          <span className="text-sm font-medium">AI 推荐评分</span>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded bg-current/10", confColor)}>
            {confLabel}
          </span>
        </div>
        <button
          onClick={onApply}
          disabled={applied}
          className={cn(
            "text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 transition-colors",
            applied
              ? "border-horror-trigger/30 text-horror-triggerLight bg-horror-trigger/10 cursor-default"
              : "border-horror-blood/40 text-horror-bloodLight hover:bg-horror-blood/10",
          )}
        >
          {applied ? (
            <>
              <CheckCircle2 className="w-3 h-3" /> 已应用
            </>
          ) : (
            <>
              <Sparkle className="w-3 h-3" /> 一键带入评分+评语
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded bg-horror-bg/50">
          <div className="text-[10px] text-horror-muted mb-0.5">规则稳定性</div>
          <div className="text-xl font-display font-bold text-horror-text">
            {rec.ruleStability}
            <span className="text-xs text-horror-muted font-normal"> / 5</span>
          </div>
          <div className="flex justify-center gap-0 mt-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn(
                  "w-2.5 h-2.5",
                  i <= rec.ruleStability
                    ? "text-horror-warning fill-horror-warning"
                    : "text-horror-muted/40",
                )}
              />
            ))}
          </div>
        </div>
        <div className="p-2 rounded bg-horror-bg/50">
          <div className="text-[10px] text-horror-muted mb-0.5">代价清晰度</div>
          <div className="text-xl font-display font-bold text-horror-text">
            {rec.costClarity}
            <span className="text-xs text-horror-muted font-normal"> / 5</span>
          </div>
          <div className="flex justify-center gap-0 mt-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn(
                  "w-2.5 h-2.5",
                  i <= rec.costClarity
                    ? "text-horror-warning fill-horror-warning"
                    : "text-horror-muted/40",
                )}
              />
            ))}
          </div>
        </div>
        <div className="p-2 rounded bg-horror-bg/50">
          <div className="text-[10px] text-horror-muted mb-0.5">伏笔合理性</div>
          <div className="text-xl font-display font-bold text-horror-text">
            {rec.foreshadowing}
            <span className="text-xs text-horror-muted font-normal"> / 5</span>
          </div>
          <div className="flex justify-center gap-0 mt-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn(
                  "w-2.5 h-2.5",
                  i <= rec.foreshadowing
                    ? "text-horror-warning fill-horror-warning"
                    : "text-horror-muted/40",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-horror-muted">{rec.reasoning}</div>
    </div>
  );
}

function OverallDraftCard({
  draft,
  onApply,
  onCopy,
  copied,
}: {
  draft: OverallReviewDraft;
  onApply: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="p-3 rounded bg-gradient-to-br from-horror-card to-horror-bg border border-horror-border space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ScrollText className="w-4 h-4 text-horror-bloodLight" />
          <span className="text-sm font-medium">AI 总评草稿</span>
          <span className="text-[10px] text-horror-muted">
            覆盖率 / 伏笔 / 分支结构一站式汇总
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCopy}
            className="text-[11px] px-2 py-0.5 rounded border border-horror-border text-horror-muted hover:text-horror-text hover:border-horror-muted transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" /> 已复制
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> 复制
              </>
            )}
          </button>
          <button
            onClick={onApply}
            className="text-[11px] px-2 py-0.5 rounded border border-horror-blood/40 text-horror-bloodLight hover:bg-horror-blood/10 transition-colors flex items-center gap-1"
          >
            <Wand2 className="w-3 h-3" /> 带入评语
          </button>
        </div>
      </div>

      <div className="text-xs text-horror-text bg-horror-bg/60 p-2.5 rounded border border-horror-border/50 whitespace-pre-wrap font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto">
        {draft.fullText}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {draft.strengths.length > 0 && (
          <div className="p-2 rounded bg-horror-trigger/10 border border-horror-trigger/30">
            <div className="flex items-center gap-1 text-horror-triggerLight font-medium mb-1">
              <ThumbsUp className="w-3 h-3" /> 亮点 ({draft.strengths.length})
            </div>
            <div className="text-horror-muted space-y-0.5">
              {draft.strengths.slice(0, 3).map((s, i) => (
                <div key={i} className="line-clamp-2">· {s}</div>
              ))}
            </div>
          </div>
        )}
        {draft.improvements.length > 0 && (
          <div className="p-2 rounded bg-horror-deficient/10 border border-horror-deficient/30">
            <div className="flex items-center gap-1 text-horror-bloodLight font-medium mb-1">
              <AlertTriangle className="w-3 h-3" /> 改进点 ({draft.improvements.length})
            </div>
            <div className="text-horror-muted space-y-0.5">
              {draft.improvements.slice(0, 3).map((s, i) => (
                <div key={i} className="line-clamp-2">· {s}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HintCard({
  hint,
  onApply,
}: {
  hint: ReviewHint;
  onApply: () => void;
}) {
  const icon =
    hint.type === "warning" ? (
      <AlertTriangle className="w-4 h-4 text-horror-bloodLight" />
    ) : hint.type === "success" ? (
      <CheckCircle2 className="w-4 h-4 text-horror-triggerLight" />
    ) : (
      <Info className="w-4 h-4 text-horror-warning" />
    );

  const borderColor =
    hint.type === "warning"
      ? "border-horror-deficient/50 bg-horror-deficient/10"
      : hint.type === "success"
      ? "border-horror-trigger/30 bg-horror-trigger/10"
      : "border-horror-warning/30 bg-horror-warning/10";

  return (
    <div className={cn("p-2.5 rounded border", borderColor)}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-horror-text">{hint.title}</div>
          <div className="text-[11px] text-horror-muted mt-0.5">{hint.detail}</div>
          <button
            onClick={onApply}
            className="mt-1.5 text-[11px] flex items-center gap-1 text-horror-bloodLight hover:text-horror-blood transition-colors"
          >
            <Wand2 className="w-3 h-3" />
            带入评语
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPanel() {
  const { cards, testResult, review, setReview, clearReview } = useStoryStore();
  const [saved, setSaved] = useState(false);
  const [scoreApplied, setScoreApplied] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);

  const hints = useMemo(
    () => generateReviewHints(cards, testResult),
    [cards, testResult],
  );

  const scoreRec = useMemo(
    () => recommendScores(cards, testResult, hints),
    [cards, testResult, hints],
  );

  const overallDraft = useMemo(
    () => generateOverallReviewDraft(cards, testResult),
    [cards, testResult],
  );

  const handleSave = () => {
    if (review || hints.length > 0) {
      setReview({ createdAt: new Date().toISOString() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const applyHint = (hint: ReviewHint) => {
    const currentComment = review?.comment || "";
    const prefix = currentComment ? `${currentComment}\n\n` : "";
    setReview({ comment: `${prefix}${hint.suggestedText}` });
    setScoreApplied(false);
  };

  const applyAllHints = () => {
    const text = hints.map((h, i) => `${i + 1}. ${h.suggestedText}`).join("\n\n");
    setReview({ comment: text });
    setScoreApplied(false);
  };

  const applyOverallDraft = () => {
    const currentComment = review?.comment || "";
    const prefix = currentComment ? `${currentComment}\n\n` : "";
    setReview({ comment: `${prefix}${overallDraft.fullText}` });
    setScoreApplied(false);
  };

  const copyOverallDraft = async () => {
    try {
      await navigator.clipboard.writeText(overallDraft.fullText);
      setDraftCopied(true);
      setTimeout(() => setDraftCopied(false), 2000);
    } catch {
      alert("复制失败，请手动选择文本复制");
    }
  };

  const applyScoreRecommendation = () => {
    const scoreText = `综合评分建议：规则稳定性 ${scoreRec.ruleStability}/5，代价清晰度 ${scoreRec.costClarity}/5，伏笔合理性 ${scoreRec.foreshadowing}/5。`;
    const hintsIntro =
      hints.length > 0
        ? `\n\n详细点评要点：\n${hints.map((h, i) => `${i + 1}. ${h.suggestedText}`).join("\n\n")}`
        : "";
    setReview({
      ruleStability: scoreRec.ruleStability,
      costClarity: scoreRec.costClarity,
      foreshadowing: scoreRec.foreshadowing,
      comment: scoreText + hintsIntro,
    });
    setScoreApplied(true);
  };

  const totalScore = review
    ? ((review.ruleStability + review.costClarity + review.foreshadowing) / 15) * 100
    : 0;

  const defaultReview = review || {
    ruleStability: 3,
    costClarity: 3,
    foreshadowing: 3,
    comment: "",
  };

  return (
    <div className="panel-container flex flex-col h-full">
      <div className="panel-header">
        <MessageSquare className="w-5 h-5 text-horror-bloodLight" />
        <h2 className="font-display font-semibold text-lg tracking-wide">课堂点评区</h2>
        {review && (
          <span className="ml-auto text-xs text-horror-muted flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(review.createdAt).toLocaleString("zh-CN", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {testResult && (
          <ScoreRecommendCard
            rec={scoreRec}
            onApply={applyScoreRecommendation}
            applied={scoreApplied}
          />
        )}

        {testResult && (
          <OverallDraftCard
            draft={overallDraft}
            onApply={applyOverallDraft}
            onCopy={copyOverallDraft}
            copied={draftCopied}
          />
        )}

        {hints.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-horror-bloodLight" />
                <span className="text-sm font-medium">AI 点评提示</span>
                <span className="text-[10px] text-horror-muted">
                  基于路线测试结果自动生成
                </span>
              </div>
              {hints.length > 1 && (
                <button
                  onClick={applyAllHints}
                  className="text-[11px] px-2 py-0.5 rounded border border-horror-blood/40 text-horror-bloodLight hover:bg-horror-blood/10 transition-colors flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  全部带入
                </button>
              )}
            </div>
            <div className="space-y-2">
              {hints.map((h, i) => (
                <HintCard key={i} hint={h} onApply={() => applyHint(h)} />
              ))}
            </div>
          </div>
        )}

        {!testResult && hints.length === 0 && (
          <div className="p-3 rounded bg-horror-card border border-horror-border/60 text-xs text-horror-muted">
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5 text-horror-warning" />
              <span className="text-horror-warning">小提示</span>
            </div>
            先在中间栏运行路线测试，这里会根据测试结果自动生成评分推荐、总评草稿和点评建议。
          </div>
        )}

        {(review || totalScore > 0) && (
          <div className="p-4 rounded bg-gradient-to-br from-horror-card to-horror-bg border border-horror-border">
            <div className="text-xs text-horror-muted mb-1">综合评分</div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-display font-bold text-horror-warning">
                {totalScore.toFixed(0)}
              </span>
              <span className="text-horror-muted text-sm mb-1">/ 100</span>
            </div>
            <div className="h-2 mt-2 rounded-full bg-horror-bg overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-horror-blood via-horror-warning to-horror-trigger transition-all duration-700"
                style={{ width: `${totalScore}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          {criteria.map((c) => (
            <div
              key={c.key}
              className="p-3 rounded bg-horror-card border border-horror-border space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <c.icon className="w-4 h-4 text-horror-bloodLight flex-shrink-0" />
                    <span className="text-sm font-medium">{c.title}</span>
                  </div>
                  <p className="text-xs text-horror-muted mt-0.5">{c.subtitle}</p>
                </div>
                <StarRating
                  value={defaultReview[c.key]}
                  onChange={(v) => {
                    setReview({ [c.key]: v });
                    setScoreApplied(false);
                  }}
                />
              </div>
              <p className="text-xs text-horror-warning/80 italic bg-horror-bg/50 px-2 py-1.5 rounded border border-horror-border/50">
                "{c.descriptions[defaultReview[c.key] - 1]}"
              </p>
            </div>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-horror-bloodLight" />
            教师评语
          </label>
          <textarea
            value={defaultReview.comment}
            onChange={(e) => {
              setReview({ comment: e.target.value });
              setScoreApplied(false);
            }}
            className="horror-input resize-none h-40"
            placeholder="请从规则设定、玩家体验、叙事技巧等方面给出简短评语，指出优点和改进建议...（可使用上方AI推荐评分、总评草稿或点评提示一键带入）"
          />
          <p className="text-xs text-horror-muted mt-1.5">
            {defaultReview.comment.length} / 800 字
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-horror-border/50">
        <button
          onClick={handleSave}
          className="horror-btn-primary flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          {saved ? "已保存 ✓" : "保存点评"}
        </button>
        {review && (
          <button
            onClick={() => {
              if (confirm("确定清空点评吗？")) {
                clearReview();
                setScoreApplied(false);
              }
            }}
            className="horror-btn-danger flex items-center gap-1.5 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空
          </button>
        )}
      </div>
    </div>
  );
}
