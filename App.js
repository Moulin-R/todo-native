import React, { useEffect, useMemo, useRef, useState } from "react";

// シンプル＆高機能なToDo。メモリ保存 / 検索 / フィルタ / 編集 / 一括消去 / キーボード操作
export default function TodoApp() {
  const [items, setItems] = useState([
    { id: crypto.randomUUID(), text: "サンプルタスク：プロジェクトの進捗確認", done: false, createdAt: Date.now() - 86400000 },
    { id: crypto.randomUUID(), text: "会議資料の準備", done: true, createdAt: Date.now() - 172800000 }
  ]);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | completed
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((t) => {
      const fOK =
        filter === "all" ? true : filter === "active" ? !t.done : t.done;
      const qOK = !q || t.text.toLowerCase().includes(q);
      return fOK && qOK;
    });
  }, [items, filter, query]);

  const remaining = useMemo(() => items.filter((t) => !t.done).length, [items]);

  function addItem() {
    const v = text.trim();
    if (!v) return;
    setItems((prev) => [
      { id: crypto.randomUUID(), text: v, done: false, createdAt: Date.now() },
      ...prev,
    ]);
    setText("");
    inputRef.current?.focus();
  }

  function toggle(id) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id) {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  function clearCompleted() {
    setItems((prev) => prev.filter((t) => !t.done));
  }

  function update(id, newText) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, text: newText } : t)));
  }

  // Enterで追加、Ctrl/Cmd+Enterでも追加
  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addItem();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-3xl mx-auto p-6">
        {/* ヘッダー */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ToDo リスト</h1>
          <span className="text-sm text-slate-500">残り {remaining} 件</span>
        </header>

        {/* 入力ボックス */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <label htmlFor="newTodo" className="block text-sm font-medium text-slate-600 mb-2">
            タスクを追加
          </label>
          <div className="flex gap-2">
            <input
              id="newTodo"
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="例：お客さま資料のドラフト作成、16:00まで"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <button
              onClick={addItem}
              className="rounded-xl px-4 py-2 bg-indigo-600 text-white font-semibold shadow hover:opacity-95 active:opacity-90"
              aria-label="タスクを追加"
            >
              追加
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Enter で追加 / Ctrl(⌘)+Enter でも可</p>
        </div>

        {/* コントロールバー */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-3">
          <div className="inline-flex rounded-xl bg-white shadow p-1 w-fit">
            {[
              { k: "all", label: "すべて" },
              { k: "active", label: "未完了" },
              { k: "completed", label: "完了" },
            ].map((f) => (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={
                  "px-3 py-1.5 text-sm rounded-lg " +
                  (filter === f.k
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100")
                }
                aria-pressed={filter === f.k}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="検索（キーワード）"
              className="rounded-xl bg-white shadow px-3 py-2 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-200"
              aria-label="検索"
            />
            <button
              onClick={clearCompleted}
              className="rounded-xl px-3 py-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              完了を一括削除
            </button>
          </div>
        </div>

        {/* リスト */}
        <ul className="space-y-2">
          {filtered.length === 0 && (
            <li className="text-slate-500 text-sm px-2">該当タスクがありません。</li>
          )}
          {filtered.map((t) => (
            <TodoItem key={t.id} item={t} onToggle={toggle} onRemove={remove} onUpdate={update} />
          ))}
        </ul>

        {/* フッター */}
        <footer className="mt-8 text-center text-xs text-slate-400">
          <p>
            保存先: メモリ（セッション中のみ） / バージョン: v1
          </p>
        </footer>
      </div>
    </div>
  );
}

function TodoItem({ item, onToggle, onRemove, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function save() {
    const v = draft.trim();
    if (!v) {
      onRemove(item.id);
    } else if (v !== item.text) {
      onUpdate(item.id, v);
    }
    setEditing(false);
  }

  return (
    <li className="bg-white rounded-2xl shadow border border-slate-100 p-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 accent-indigo-600 cursor-pointer"
          checked={item.done}
          onChange={() => onToggle(item.id)}
          aria-label={item.done ? "完了に変更" : "未完了に変更"}
        />

        <div className="flex-1">
          {!editing ? (
            <button
              onDoubleClick={() => setEditing(true)}
              onClick={() => onToggle(item.id)}
              className={
                "text-left w-full " +
                (item.done ? "line-through text-slate-400" : "text-slate-800")
              }
            >
              <span className="block leading-relaxed whitespace-pre-wrap">{item.text}</span>
              <span className="block text-[10px] text-slate-400 mt-1">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                  if (e.key === "Escape") {
                    setDraft(item.text);
                    setEditing(false);
                  }
                }}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button onClick={save} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm">
                保存
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="shrink-0 rounded-xl px-3 py-2 text-sm bg-rose-50 text-rose-600 hover:bg-rose-100"
          aria-label="削除"
          title="削除"
        >
          削除
        </button>
      </div>
    </li>
  );
}
