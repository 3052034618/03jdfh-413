import { Skull, Moon } from "lucide-react";
import StoryCardsPanel from "../components/StoryCardsPanel";
import RouteTestPanel from "../components/RouteTestPanel";
import ReviewPanel from "../components/ReviewPanel";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <header className="relative z-10 border-b border-horror-border/60 bg-horror-panel/80 backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Skull className="w-8 h-8 text-horror-bloodLight" />
              <Moon className="w-3.5 h-3.5 text-horror-warning absolute -top-0.5 -right-0.5 animate-flicker" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-wider text-horror-text">
                午夜因果簿
              </h1>
              <p className="text-xs text-horror-muted -mt-0.5">
                恐怖故事多结局因果链设计练习工具
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-horror-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-horror-trigger" />
              已触发
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-horror-untriggered" />
              未触发
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-horror-deficient animate-pulse" />
              线索不足
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-[1800px] w-full mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 h-[calc(100vh-140px)] min-h-[700px]">
          <div className="xl:col-span-1">
            <StoryCardsPanel />
          </div>
          <div className="xl:col-span-1">
            <RouteTestPanel />
          </div>
          <div className="xl:col-span-1">
            <ReviewPanel />
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-horror-border/40 py-3 text-center text-xs text-horror-muted">
        先定规则，再写反转 · 游戏设计课程专用
      </footer>
    </div>
  );
}
