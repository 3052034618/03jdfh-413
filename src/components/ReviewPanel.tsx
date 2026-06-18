import { useState } from "react";
import { MessageSquare, Star, Save, Trash2, Clock, BookOpen, AlertCircle, Sparkles } from "lucide-react";
import { useStoryStore } from "../store/useStoryStore";
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

export default function ReviewPanel() {
  const { review, setReview, clearReview } = useStoryStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (review) {
      setReview({ createdAt: new Date().toISOString() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
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
            className="horror-input resize-none h-36"
            placeholder="请从规则设定、玩家体验、叙事技巧等方面给出简短评语，指出优点和改进建议..."
          />
          <p className="text-xs text-horror-muted mt-1.5">
            {defaultReview.comment.length} / 500 字
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
