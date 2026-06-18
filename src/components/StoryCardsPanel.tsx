import { useState } from "react";
import {
  Layers,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  Flag,
  Target,
  Tag,
  ArrowRight,
  Play,
  Copy,
  GitBranch,
} from "lucide-react";
import { useStoryStore } from "../store/useStoryStore";
import { getStatusStyle, getStatusLabel, getStatusColor } from "../utils/storyEngine";
import type { StoryCard, EndingType } from "../types";
import { cn } from "../lib/utils";

function CardItem({ card }: { card: StoryCard }) {
  const [expanded, setExpanded] = useState(false);
  const {
    cards,
    updateCard,
    deleteCard,
    duplicateCard,
    duplicateBranch,
    addChoice,
    updateChoice,
    deleteChoice,
    testResult,
  } = useStoryStore();

  const status = testResult?.[card.id]?.status;
  const endingTypes: { value: EndingType; label: string; color: string }[] = [
    { value: "bad", label: "坏结局", color: "text-horror-bloodLight" },
    { value: "neutral", label: "中性结局", color: "text-horror-warning" },
    { value: "good", label: "好结局", color: "text-horror-triggerLight" },
  ];

  const otherCards = cards.filter((c) => c.id !== card.id);

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-all duration-200",
        status ? getStatusStyle(status) : "bg-horror-card border-horror-border",
      )}
    >
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-horror-panel/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-horror-muted flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-horror-muted flex-shrink-0" />
          )}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {card.isOpening && (
              <Play className="w-3.5 h-3.5 text-horror-bloodLight" />
            )}
            {card.isEnding && (
              <Flag
                className={cn(
                  "w-3.5 h-3.5",
                  card.endingType === "bad" && "text-horror-bloodLight",
                  card.endingType === "neutral" && "text-horror-warning",
                  card.endingType === "good" && "text-horror-triggerLight",
                )}
              />
            )}
          </div>
          <span className="font-display font-medium text-sm truncate">
            {card.title || "未命名卡片"}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {status && (
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${getStatusColor(status)}20`,
                color: getStatusColor(status),
              }}
            >
              {getStatusLabel(status)}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateCard(card.id);
            }}
            title="复制此卡片"
            className="p-1 rounded hover:bg-horror-panel text-horror-muted hover:text-horror-text transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const count = (() => {
                const cardMap = new Map(cards.map((c) => [c.id, c]));
                const collected = new Set<string>();
                function walk(id: string) {
                  if (collected.has(id)) return;
                  collected.add(id);
                  const c = cardMap.get(id);
                  if (!c) return;
                  c.choices.forEach((ch) => {
                    if (ch.nextCardId) walk(ch.nextCardId);
                  });
                }
                walk(card.id);
                return collected.size;
              })();
              if (
                confirm(
                  count > 1
                    ? `将复制此卡片及其后续 ${count - 1} 张卡片（共 ${count} 张），确定吗？`
                    : "确定复制这张卡片吗？",
                )
              ) {
                duplicateBranch(card.id);
              }
            }}
            title="复制此分支（含所有后续卡片）"
            className="p-1 rounded hover:bg-horror-panel text-horror-muted hover:text-horror-text transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("确定删除这张卡片吗？")) deleteCard(card.id);
            }}
            className="p-1 rounded hover:bg-horror-deficient/30 text-horror-muted hover:text-horror-bloodLight transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 py-3 border-t border-horror-border/50 space-y-3 bg-horror-bg/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-horror-muted mb-1 block">场景名称</label>
              <input
                type="text"
                value={card.title}
                onChange={(e) => updateCard(card.id, { title: e.target.value })}
                className="horror-input"
                placeholder="如：午夜宿舍"
              />
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs text-horror-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={card.isOpening}
                  onChange={(e) => {
                    if (e.target.checked) {
                      cards.forEach((c) => updateCard(c.id, { isOpening: false }));
                    }
                    updateCard(card.id, { isOpening: e.target.checked });
                  }}
                  className="accent-horror-blood"
                />
                <Play className="w-3 h-3 text-horror-bloodLight" />
                开场
              </label>
              <label className="flex items-center gap-1.5 text-xs text-horror-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={card.isEnding}
                  onChange={(e) =>
                    updateCard(card.id, {
                      isEnding: e.target.checked,
                      choices: e.target.checked ? [] : card.choices,
                    })
                  }
                  className="accent-horror-blood"
                />
                <Flag className="w-3 h-3 text-horror-warning" />
                结局
              </label>
            </div>
          </div>

          {card.isEnding && (
            <div>
              <label className="text-xs text-horror-muted mb-1 block">结局类型</label>
              <div className="flex gap-2">
                {endingTypes.map((et) => (
                  <button
                    key={et.value}
                    onClick={() => updateCard(card.id, { endingType: et.value })}
                    className={cn(
                      "px-3 py-1 text-xs rounded border transition-colors",
                      card.endingType === et.value
                        ? cn("border-current", et.color, "bg-current/10")
                        : "border-horror-border text-horror-muted hover:border-horror-muted",
                    )}
                  >
                    {et.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-horror-muted mb-1 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              场景描述
            </label>
            <textarea
              value={card.description}
              onChange={(e) => updateCard(card.id, { description: e.target.value })}
              className="horror-input resize-none h-20"
              placeholder="描写玩家进入这个场景时看到、听到、感受到的一切..."
            />
          </div>

          <div>
            <label className="text-xs text-horror-muted mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              触发条件
            </label>
            <input
              type="text"
              value={card.triggerCondition}
              onChange={(e) => updateCard(card.id, { triggerCondition: e.target.value })}
              className="horror-input"
              placeholder="如：从开场卡片选择查看走廊"
            />
          </div>

          <div>
            <label className="text-xs text-horror-muted mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              线索标签（用逗号分隔，好结局建议路径累计≥2个线索）
            </label>
            <input
              type="text"
              value={card.clueTags.join(", ")}
              onChange={(e) =>
                updateCard(card.id, {
                  clueTags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              className="horror-input"
              placeholder="如：白衣身影, 录像带, 滴水声"
            />
            {card.clueTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {card.clueTags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded bg-horror-blood/15 text-horror-bloodLight border border-horror-blood/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!card.isEnding && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-horror-muted flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  玩家选择（{card.choices.length}）
                </label>
                <button
                  onClick={() => addChoice(card.id)}
                  className="text-xs px-2 py-1 rounded border border-horror-border text-horror-muted hover:border-horror-blood hover:text-horror-bloodLight transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  添加选项
                </button>
              </div>
              <div className="space-y-2">
                {card.choices.map((choice, idx) => (
                  <div
                    key={choice.id}
                    className="p-2.5 rounded border border-horror-border bg-horror-panel/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-horror-muted">选项 {idx + 1}</span>
                      <button
                        onClick={() => deleteChoice(card.id, choice.id)}
                        className="p-1 rounded hover:bg-horror-deficient/30 text-horror-muted hover:text-horror-bloodLight transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) =>
                        updateChoice(card.id, choice.id, { text: e.target.value })
                      }
                      className="horror-input text-xs"
                      placeholder="选项文字，如：披上外套去走廊查看"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={choice.nextCardId}
                        onChange={(e) =>
                          updateChoice(card.id, choice.id, { nextCardId: e.target.value })
                        }
                        className="horror-input text-xs"
                      >
                        <option value="">→ 指向卡片...</option>
                        {otherCards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.isOpening ? "[开场] " : c.isEnding ? "[结局] " : ""}
                            {c.title || "未命名"}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={choice.consequence}
                        onChange={(e) =>
                          updateChoice(card.id, choice.id, { consequence: e.target.value })
                        }
                        className="horror-input text-xs"
                        placeholder="后果描述"
                      />
                    </div>
                  </div>
                ))}
                {card.choices.length === 0 && (
                  <p className="text-xs text-horror-muted text-center py-4 border border-dashed border-horror-border rounded">
                    还没有选项，点击"添加选项"为玩家设计分支
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StoryCardsPanel() {
  const { cards, addCard, resetToSample, clearAll } = useStoryStore();
  const sortedCards = [...cards].sort((a, b) => a.order - b.order);

  return (
    <div className="panel-container flex flex-col h-full">
      <div className="panel-header">
        <Layers className="w-5 h-5 text-horror-bloodLight" />
        <h2 className="font-display font-semibold text-lg tracking-wide">故事卡片区</h2>
        <span className="ml-auto text-xs text-horror-muted">
          共 {cards.length} 张卡片
        </span>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-horror-border/50 flex-wrap">
        <button onClick={() => addCard()} className="horror-btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          新增卡片
        </button>
        <button onClick={resetToSample} className="horror-btn text-xs">
          重置示例
        </button>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-horror-muted">
          <span className="flex items-center gap-0.5">
            <Copy className="w-3 h-3" /> 复制单卡
          </span>
          <span className="flex items-center gap-0.5">
            <GitBranch className="w-3 h-3" /> 复制分支
          </span>
        </div>
        <button onClick={clearAll} className="horror-btn text-xs">
          清空所有
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedCards.map((card) => (
          <CardItem key={card.id} card={card} />
        ))}
        {cards.length === 0 && (
          <div className="text-center py-12 text-horror-muted">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">还没有故事卡片</p>
            <p className="text-xs mt-1">点击上方"新增卡片"开始创作</p>
          </div>
        )}
      </div>
    </div>
  );
}
