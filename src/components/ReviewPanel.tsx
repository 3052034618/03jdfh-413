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
} from "lucide-react";
import { useStoryStore } from "../store/useStoryStore";
import { generateReviewHints, type ReviewHint } from "../utils/storyEngine";
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

  const hints = useMemo(
    () => generateReviewHints(cards, testResult),
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
  };

  const applyAllHints = () => {
    const text = hints.map((h, i) => `${i + 1}. ${h.suggestedText}`).join("\n\n");
    setReview({ comment: text });
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
            先在中间栏运行路线测试，这里会根据测试结果自动生成点评建议。
          </div>
        )}

        {review && (
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
                  onChange={(v) => setReview({ [c.key]: v })}
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
            onChange={(e) => setReview({ comment: e.target.value })}
            className="horror-input resize-none h-40"
            placeholder="请从规则设定、玩家体验、叙事技巧等方面给出简短评语，指出优点和改进建议...（可使用上方AI提示一键带入）"
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
              if (confirm("确定清空点评吗？")) clearReview();
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
