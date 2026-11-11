"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { BookText } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type TheoryChapter = {
  id: string;
  subject: string;
  orderIndex: number;
  chapterTitle: string;
  content: string;
};

type ChapterGroup = {
  subject: string;
  chapters: TheoryChapter[];
};

function groupChapters(chapters: TheoryChapter[]) {
  const groups: ChapterGroup[] = [];
  for (const chapter of chapters) {
    const current = groups[groups.length - 1];
    if (!current || current.subject !== chapter.subject) groups.push({ subject: chapter.subject, chapters: [chapter] });
    else current.chapters.push(chapter);
  }
  return groups;
}

export default function TheoryBoard() {
  const [chapters, setChapters] = useState<TheoryChapter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) {
        if (!cancelled) {
          setError("Supabase is not configured.");
          setLoading(false);
        }
        return;
      }
      const { data, error: queryError } = await supabase
        .from("theory_modules")
        .select("id, subject, order_index, chapter_title, content")
        .order("subject", { ascending: true })
        .order("order_index", { ascending: true });
      if (cancelled) return;
      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }
      setChapters(
        (data ?? [])
          .filter((row) => typeof row.chapter_title === "string" && row.chapter_title.trim())
          .map((row) => ({
            id: String(row.id),
            subject: typeof row.subject === "string" && row.subject.trim() ? row.subject.trim() : "General",
            orderIndex: typeof row.order_index === "number" ? row.order_index : 0,
            chapterTitle: row.chapter_title.trim(),
            content: typeof row.content === "string" ? row.content : "",
          })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = chapters.find((chapter) => chapter.id === selectedId) ?? null;
  const groups = groupChapters(chapters);

  return (
    <div className="mx-auto grid min-h-[36rem] w-full max-w-6xl grid-cols-[minmax(11rem,16rem)_minmax(0,1fr)] overflow-hidden rounded-3xl border border-premium-border dark:border-premium-borderDark">
      <aside className="max-h-[44rem] overflow-y-auto border-r border-premium-border bg-premium-beige/50 dark:border-premium-borderDark dark:bg-zinc-900/50">
        <div className="flex items-center gap-2 px-4 py-5 text-sm font-semibold text-premium-charcoal dark:text-zinc-200">
          <BookText className="h-4 w-4 text-premium-accent" />
          Chapters
        </div>
        {loading && <p className="px-4 pb-5 text-sm text-zinc-500 dark:text-zinc-400">Loading chapters...</p>}
        {!loading && groups.length === 0 && (
          <p className="px-4 pb-5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            No chapters are visible yet. Add subject, order_index, chapter_title, and content rows, then allow public read access with the policy in scripts/theory_modules.sql.
          </p>
        )}
        <nav aria-label="Theory chapters" className="flex flex-col gap-5 px-3 pb-5">
          {groups.map((group) => (
            <div key={group.subject}>
              <p className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{group.subject}</p>
              <div className="mt-1 flex flex-col">
                {group.chapters.map((chapter) => {
                  const active = chapter.id === selectedId;
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => setSelectedId(chapter.id)}
                      className={`rounded-lg px-2 py-2 text-left text-sm transition ${
                        active
                          ? "bg-white font-semibold text-premium-charcoal dark:bg-zinc-900 dark:text-zinc-100"
                          : "text-zinc-500 hover:text-premium-charcoal dark:text-zinc-400 dark:hover:text-zinc-100"
                      }`}
                    >
                      {chapter.chapterTitle}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <section className="max-h-[44rem] overflow-y-auto bg-white text-premium-charcoal dark:bg-zinc-900 dark:text-zinc-200">
        {selected ? (
          <article className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-accent">{selected.subject}</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{selected.chapterTitle}</h1>
            <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-premium-accent prose-p:leading-relaxed">
              <ReactMarkdown>{selected.content}</ReactMarkdown>
            </div>
          </article>
        ) : (
          <div className="flex h-full min-h-[24rem] items-center justify-center px-6 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Select a topic to begin reading.</p>
          </div>
        )}
        {error && (
          <p role="status" className="mx-6 mb-6 rounded-2xl border border-rose-700/30 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
