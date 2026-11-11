"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, User, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const CATEGORIES = ["History", "Geography", "Science", "GK", "SSB", "General"] as const;

type Post = {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
  userId: string;
  author: string;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: string;
};

type Row = Record<string, unknown>;

function usernameOf(value: unknown) {
  const row = Array.isArray(value) ? value[0] : value;
  if (row && typeof row === "object" && "username" in row && typeof row.username === "string" && row.username.trim()) {
    return row.username.trim();
  }
  return "";
}

function asPost(row: Row, authors: Map<string, string>): Post | null {
  const id = row.id == null ? "" : String(row.id);
  const title = typeof row.title === "string" ? row.title.trim() : "";
  const content = typeof row.content === "string" ? row.content : "";
  if (!id || !title) return null;
  const userId = row.user_id == null ? "" : String(row.user_id);
  return {
    id,
    title,
    category: typeof row.category === "string" && row.category.trim() ? row.category : "General",
    content,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    userId,
    author: usernameOf(row.profiles) || authors.get(userId) || "Officer",
  };
}

function asComment(row: Row, authors: Map<string, string>): Comment | null {
  const id = row.id == null ? "" : String(row.id);
  const content = typeof row.content === "string" ? row.content.trim() : "";
  if (!id || !content) return null;
  const userId = row.user_id == null ? "" : String(row.user_id);
  return {
    id,
    content,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    author: usernameOf(row.profiles) || authors.get(userId) || "Officer",
  };
}

async function authorNames(ids: string[]) {
  const names = new Map<string, string>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!supabase || unique.length === 0) return names;
  const { data } = await supabase.from("profiles").select("id, username").in("id", unique);
  for (const row of data ?? []) {
    if (row.id && typeof row.username === "string" && row.username.trim()) names.set(String(row.id), row.username.trim());
  }
  return names;
}

async function currentMember() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const { data } = await supabase.from("profiles").select("username").eq("id", session.user.id).single();
  const username = typeof data?.username === "string" && data.username.trim() ? data.username.trim() : "You";
  return { id: session.user.id, username };
}

export default function ForumBoard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("General");
  const [body, setBody] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const openPostRef = useRef<string | null>(null);

  useEffect(() => {
    openPostRef.current = openPostId;
  }, [openPostId]);

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
      const joined = await supabase
        .from("posts")
        .select("id, title, category, content, created_at, user_id, profiles(username)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (!joined.error) {
        setPosts((joined.data ?? []).map((row) => asPost(row as Row, new Map())).filter((post): post is Post => post !== null));
        setLoading(false);
        return;
      }
      const plain = await supabase.from("posts").select("id, title, category, content, created_at, user_id").order("created_at", { ascending: false }).limit(50);
      if (cancelled) return;
      if (plain.error) {
        setError(plain.error.message);
        setLoading(false);
        return;
      }
      const names = await authorNames((plain.data ?? []).map((row) => String(row.user_id ?? "")));
      if (cancelled) return;
      setPosts((plain.data ?? []).map((row) => asPost(row as Row, names)).filter((post): post is Post => post !== null));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!openPostId || !supabase) {
      setComments([]);
      return;
    }
    let cancelled = false;
    setCommentsLoading(true);
    setCommentDraft("");
    (async () => {
      const joined = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, profiles(username)")
        .eq("post_id", openPostId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (!joined.error) {
        setComments((joined.data ?? []).map((row) => asComment(row as Row, new Map())).filter((comment): comment is Comment => comment !== null));
        setCommentsLoading(false);
        return;
      }
      const plain = await supabase.from("comments").select("id, content, created_at, user_id").eq("post_id", openPostId).order("created_at", { ascending: true });
      if (cancelled) return;
      if (plain.error) {
        setError(plain.error.message);
        setCommentsLoading(false);
        return;
      }
      const names = await authorNames((plain.data ?? []).map((row) => String(row.user_id ?? "")));
      if (cancelled) return;
      setComments((plain.data ?? []).map((row) => asComment(row as Row, names)).filter((comment): comment is Comment => comment !== null));
      setCommentsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [openPostId]);

  useEffect(() => {
    if (!composerOpen) return;
    titleRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setComposerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composerOpen]);

  const publishPost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || saving) return;
    const nextTitle = title.trim();
    const nextBody = body.trim();
    if (!nextTitle || !nextBody) {
      setError("Add a title and some text before posting.");
      return;
    }
    const member = await currentMember();
    if (!member) {
      setError("Sign in to post.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("posts")
      .insert({ user_id: member.id, title: nextTitle, category, content: nextBody })
      .select("id, title, category, content, created_at, user_id")
      .single();
    setSaving(false);
    if (insertError || !data) {
      setError(insertError?.message || "The post could not be published.");
      return;
    }
    const post = asPost({ ...data, profiles: { username: member.username } }, new Map());
    if (post) setPosts((current) => [post, ...current]);
    setTitle("");
    setBody("");
    setCategory("General");
    setComposerOpen(false);
  };

  const publishComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !openPostId || commentSaving) return;
    const nextBody = commentDraft.trim();
    if (!nextBody) return;
    const member = await currentMember();
    if (!member) {
      setError("Sign in to comment.");
      return;
    }
    setCommentSaving(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({ post_id: openPostId, user_id: member.id, content: nextBody })
      .select("id, content, created_at, user_id")
      .single();
    setCommentSaving(false);
    if (insertError || !data) {
      setError(insertError?.message || "The comment could not be published.");
      return;
    }
    if (openPostRef.current !== openPostId) return;
    const comment = asComment({ ...data, profiles: { username: member.username } }, new Map());
    if (comment) setComments((current) => [...current, comment]);
    setCommentDraft("");
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 text-premium-charcoal dark:text-zinc-200">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-accent">Discussion</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Forum</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setComposerOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-premium-charcoal px-4 py-2.5 text-sm font-bold text-premium-beige transition hover:bg-premium-accent dark:bg-zinc-100 dark:text-premium-charcoal"
        >
          <MessageSquare className="h-4 w-4" />
          Create Post
        </button>
      </header>

      {loading && (
        <section className="rounded-3xl border border-premium-border bg-white px-5 py-6 text-sm text-zinc-500 dark:border-premium-borderDark dark:bg-zinc-900 dark:text-zinc-400">
          Loading discussions...
        </section>
      )}

      {!loading && posts.length === 0 && (
        <section className="rounded-3xl border border-premium-border bg-white px-5 py-6 text-sm leading-relaxed text-zinc-500 dark:border-premium-borderDark dark:bg-zinc-900 dark:text-zinc-400">
          No discussions yet. Be the first to post. If a row exists in Supabase but stays hidden, run the select policy in scripts/forum.sql.
        </section>
      )}

      <div className="flex flex-col gap-3">
        {posts.map((post) => {
          const open = openPostId === post.id;
          return (
            <article key={post.id} className="rounded-3xl border border-premium-border bg-white dark:border-premium-borderDark dark:bg-zinc-900">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenPostId(open ? null : post.id)}
                className="w-full px-5 py-4 text-left"
              >
                <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold uppercase tracking-[0.14em]">{post.category}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {post.author}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-semibold">{post.title}</h2>
                {!open && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{post.content}</p>}
              </button>
              {open && (
                <div className="border-t border-premium-border px-5 py-4 dark:border-premium-borderDark">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                  <div className="mt-6">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <MessageSquare className="h-4 w-4 text-premium-accent" />
                      Comments
                    </p>
                    {commentsLoading ? (
                      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Loading comments...</p>
                    ) : comments.length === 0 ? (
                      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No comments yet.</p>
                    ) : (
                      <ul className="mt-3 flex flex-col gap-3">
                        {comments.map((comment) => (
                          <li key={comment.id} className="rounded-2xl border border-premium-border px-4 py-3 dark:border-premium-borderDark">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                              <User className="h-3.5 w-3.5" />
                              {comment.author}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <form onSubmit={(event) => void publishComment(event)} className="mt-4 flex gap-2">
                      <input
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        placeholder="Write a comment"
                        aria-label="Write a comment"
                        className="min-w-0 flex-1 rounded-xl border border-premium-border bg-white px-3 py-2.5 text-sm text-premium-charcoal outline-none focus:border-premium-accent dark:border-premium-borderDark dark:bg-zinc-900 dark:text-zinc-200"
                      />
                      <button
                        type="submit"
                        disabled={commentSaving || !commentDraft.trim()}
                        className="rounded-xl bg-premium-charcoal px-4 py-2.5 text-sm font-bold text-premium-beige transition hover:bg-premium-accent disabled:opacity-50 dark:bg-zinc-100 dark:text-premium-charcoal"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {error && (
        <p role="status" className="rounded-2xl border border-rose-700/30 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}

      {composerOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" aria-label="Close create post" className="absolute inset-0 bg-premium-charcoal/55 backdrop-blur-sm" onClick={() => setComposerOpen(false)} />
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-post-title"
            onSubmit={(event) => void publishPost(event)}
            className="relative z-10 w-full max-w-lg rounded-3xl border border-premium-border bg-white p-6 dark:border-premium-borderDark dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="create-post-title" className="text-xl font-extrabold tracking-tight">
                Create Post
              </h2>
              <button type="button" onClick={() => setComposerOpen(false)} className="rounded-full border border-premium-border p-2 text-zinc-500 dark:border-premium-borderDark">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Title
              <input
                ref={titleRef}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-premium-border bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-premium-charcoal outline-none focus:border-premium-accent dark:border-premium-borderDark dark:bg-zinc-900 dark:text-zinc-200"
              />
            </label>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as (typeof CATEGORIES)[number])}
                className="mt-2 w-full rounded-xl border border-premium-border bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-premium-charcoal outline-none focus:border-premium-accent dark:border-premium-borderDark dark:bg-zinc-900 dark:text-zinc-200"
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Content
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
                rows={5}
                className="mt-2 w-full resize-y rounded-xl border border-premium-border bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-premium-charcoal outline-none focus:border-premium-accent dark:border-premium-borderDark dark:bg-zinc-900 dark:text-zinc-200"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-xl bg-premium-charcoal px-4 py-2.5 text-sm font-bold text-premium-beige transition hover:bg-premium-accent disabled:opacity-50 dark:bg-zinc-100 dark:text-premium-charcoal"
            >
              {saving ? "Posting..." : "Publish"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
