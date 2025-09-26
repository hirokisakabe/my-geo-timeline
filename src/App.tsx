import { useState } from "react";
import { toPng } from "html-to-image";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type TimelineEvent } from "./db";

export default function App() {
  const [year, setYear] = useState<number | "">("");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingNote, setEditingNote] = useState("");

  // dexie-react-hooksを使用してデータベースからイベントをリアルタイムで取得
  const events =
    useLiveQuery(
      () => db.events.orderBy("createdAt").reverse().toArray(),
      []
    ) || [];

  const formatYear = (yearNumber: number): string => {
    if (yearNumber >= 100000000) {
      // 億年前
      const oku = Math.floor(yearNumber / 100000000);
      const remainder = yearNumber % 100000000;
      if (remainder === 0) {
        return `${oku}億年前`;
      } else if (remainder >= 10000) {
        const mannen = Math.floor(remainder / 10000);
        const yearRemainder = remainder % 10000;
        if (yearRemainder === 0) {
          return `${oku}億${mannen}万年前`;
        } else {
          return `${oku}億${mannen}万${yearRemainder}年前`;
        }
      } else {
        return `${oku}億${remainder}年前`;
      }
    } else if (yearNumber >= 10000) {
      // 万年前
      const mannen = Math.floor(yearNumber / 10000);
      const remainder = yearNumber % 10000;
      if (remainder === 0) {
        return `${mannen}万年前`;
      } else {
        return `${mannen}万${remainder}年前`;
      }
    }
    return `${yearNumber}年前`;
  };

  const handleAdd = async () => {
    if (year === "" || !label.trim()) return;

    try {
      const newEvent = {
        year: formatYear(year as number),
        yearNumber: year as number,
        label: label.trim(),
        note: note.trim() || undefined,
        createdAt: new Date(),
      };

      await db.events.add(newEvent);
      setLabel("");
      setNote("");
    } catch (error) {
      console.error("Failed to add event:", error);
    }
  };

  const handleDelete = async (eventId: number) => {
    try {
      await db.events.delete(eventId);
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleEdit = (event: TimelineEvent) => {
    if (!event.id) return;
    setEditingId(event.id);
    setEditingLabel(event.label);
    setEditingNote(event.note || "");
  };

  const handleSaveEdit = async () => {
    if (editingId === null || !editingLabel.trim()) return;

    try {
      await db.events.update(editingId, {
        label: editingLabel.trim(),
        note: editingNote.trim() || undefined,
      });

      setEditingId(null);
      setEditingLabel("");
      setEditingNote("");
    } catch (error) {
      console.error("Failed to save edit:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingLabel("");
    setEditingNote("");
  };

  const handleExport = async () => {
    const el = document.getElementById("timeline");
    if (!el) return;

    // 元の要素のサイズを取得
    const rect = el.getBoundingClientRect();
    const padding = 32;

    const dataUrl = await toPng(el, {
      backgroundColor: "#ffffff",
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      style: {
        transform: `translate(${padding}px, ${padding}px)`,
      },
    });
    const link = document.createElement("a");
    link.download = "timeline.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🌍 地球史年表ジェネレーター
          </h1>
          <p className="text-gray-600">
            地球の歴史を美しいタイムラインで可視化
          </p>
        </div>

        {/* 入力フォーム */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            ✏️ イベントを追加
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年代
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="input input-bordered w-full pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例: 60000（6万年前）、4600000000（46億年前）"
                  value={year}
                  onChange={(e) =>
                    setYear(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  年前
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                イベント
              </label>
              <input
                type="text"
                className="input input-bordered w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="北アルプスの氷河が最も拡大する"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                補足情報 <span className="text-gray-400 text-xs">(任意)</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="詳細な説明や関連情報"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary w-full text-white font-semibold py-3 hover:shadow-lg transition-all duration-200"
              onClick={handleAdd}
              disabled={year === "" || !label.trim()}
            >
              📅 タイムラインに追加
            </button>
          </div>
        </div>

        {/* タイムライン */}
        {events.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                🕐 タイムライン
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {events.length} イベント
              </span>
            </div>
            <div id="timeline" className="space-y-6">
              {(() => {
                // 年代でグループ化
                const groupedEvents = events.reduce((groups, event) => {
                  const year = event.year;
                  if (!groups[year]) {
                    groups[year] = [];
                  }
                  groups[year].push(event);
                  return groups;
                }, {} as Record<string, TimelineEvent[]>);

                // 年代順でソート（yearNumberを使用）
                const sortedYears = Object.keys(groupedEvents).sort((a, b) => {
                  // 各グループの最初のイベントのyearNumberを取得してソート
                  const aNum = groupedEvents[a][0]?.yearNumber || 0;
                  const bNum = groupedEvents[b][0]?.yearNumber || 0;
                  return bNum - aNum; // 古い順（数値が大きい順）
                });

                return sortedYears.map((year, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* 年代ヘッダー */}
                    <div className="bg-blue-600 text-white p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xl">{year}</h3>
                        <span className="text-blue-200 text-sm">
                          {groupedEvents[year].length} イベント
                        </span>
                      </div>
                    </div>

                    {/* イベントリスト */}
                    <div className="divide-y divide-blue-100">
                      {groupedEvents[year].map((event, eventIdx) => {
                        return (
                          <div
                            key={event.id || eventIdx}
                            className="flex items-start gap-4 p-4 group hover:bg-blue-25"
                          >
                            {editingId === event.id ? (
                              // 編集モード
                              <>
                                {/* イベント編集 */}
                                <div className="flex-grow space-y-2">
                                  <input
                                    type="text"
                                    className="input input-bordered w-full text-lg font-semibold"
                                    value={editingLabel}
                                    onChange={(e) =>
                                      setEditingLabel(e.target.value)
                                    }
                                    placeholder="イベント名"
                                  />
                                </div>

                                {/* 補足編集 */}
                                <div className="flex-shrink-0 w-64">
                                  <input
                                    type="text"
                                    className="input input-bordered w-full text-sm"
                                    value={editingNote}
                                    onChange={(e) =>
                                      setEditingNote(e.target.value)
                                    }
                                    placeholder="補足（任意）"
                                  />
                                </div>

                                {/* 保存・キャンセルボタン */}
                                <div className="flex-shrink-0 flex gap-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full"
                                    title="保存"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full"
                                    title="キャンセル"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </>
                            ) : (
                              // 表示モード
                              <>
                                {/* イベント */}
                                <div className="flex-grow">
                                  <div className="font-semibold text-gray-800 text-lg leading-tight">
                                    {event.label}
                                  </div>
                                </div>

                                {/* 補足 */}
                                <div className="flex-shrink-0 w-64">
                                  {event.note ? (
                                    <div className="bg-white p-3 rounded border-l-4 border-amber-400 text-sm text-gray-700">
                                      <div className="flex items-start gap-2">
                                        <span className="text-amber-500 text-lg">
                                          💡
                                        </span>
                                        <span className="leading-relaxed">
                                          {event.note}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-sm italic p-3">
                                      補足なし
                                    </div>
                                  )}
                                </div>

                                {/* 編集・削除ボタン */}
                                <div className="flex-shrink-0 flex gap-2">
                                  <button
                                    onClick={() => handleEdit(event)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                                    title="編集"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      event.id && handleDelete(event.id)
                                    }
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                    title="削除"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              まだイベントが追加されていません
            </h3>
            <p className="text-gray-500">
              上のフォームからイベントを追加してタイムラインを作成しましょう
            </p>
          </div>
        )}

        {/* 出力ボタン */}
        {events.length > 0 && (
          <div className="text-center">
            <button
              className="btn btn-secondary btn-lg text-white font-semibold px-8 py-3 hover:shadow-lg transition-all duration-200"
              onClick={handleExport}
            >
              💾 画像として保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
