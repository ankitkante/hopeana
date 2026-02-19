"use client";

import { useState, useEffect } from "react";
import Icon from "@mdi/react";
import {
  mdiEmailOutline,
  mdiFormatQuoteClose,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiClockOutline,
} from "@mdi/js";

interface SentMessage {
  id: string;
  sentAt: string;
  channel: string;
  status: string;
  quote: {
    content: string;
    author: string | null;
  };
}

interface SentMessagesData {
  messages: SentMessage[];
  total: number;
  page: number;
  totalPages: number;
}

function formatDate(dateStr: string): { label: string; time: string } {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (msgDate.getTime() === today.getTime()) {
    return { label: "Today", time };
  } else if (msgDate.getTime() === yesterday.getTime()) {
    return { label: "Yesterday", time };
  } else {
    const label = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return { label, time };
  }
}

function StatusBadge({ status }: { status: string }) {
  const config =
    status === "sent"
      ? { icon: mdiCheckCircle, text: "Sent", cls: "text-green-600 dark:text-green-400" }
      : status === "delivered"
      ? { icon: mdiCheckCircle, text: "Delivered", cls: "text-green-600 dark:text-green-400" }
      : { icon: mdiAlertCircle, text: "Failed", cls: "text-red-500 dark:text-red-400" };

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.cls}`}>
      <Icon path={config.icon} size={0.55} />
      {config.text}
    </span>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        path={mdiEmailOutline}
        size={0.7}
        className="text-gray-400 dark:text-gray-500"
      />
      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
        {channel}
      </span>
    </div>
  );
}

export default function SentMessagesTable() {
  const [data, setData] = useState<SentMessagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/messages?page=${page}&limit=5`)
      .then((res) => res.json())
      .then((json) => setData(json.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-gray-900 dark:text-white border-b-2 border-green-500 pb-2 px-1">
            Sent Messages
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : !data || data.messages.length === 0 ? (
        <div className="text-center py-12 px-5">
          <Icon
            path={mdiClockOutline}
            size={2}
            className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
          />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No messages sent yet
          </p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="col-span-6 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Quote Content
            </span>
            <span className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Channel
            </span>
            <span className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Sent At
            </span>
            <span className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Status
            </span>
          </div>

          {/* Rows */}
          {data.messages.map((msg) => {
            const { label, time } = formatDate(msg.sentAt);
            return (
              <div
                key={msg.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
              >
                {/* Quote */}
                <div className="sm:col-span-6 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Icon
                      path={mdiFormatQuoteClose}
                      size={0.6}
                      className="text-purple-500 dark:text-purple-400"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      &quot;{msg.quote.content.length > 40
                        ? msg.quote.content.slice(0, 40) + "..."
                        : msg.quote.content}&quot;
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {msg.quote.author || "Unknown"}
                    </p>
                  </div>
                </div>

                {/* Channel */}
                <div className="sm:col-span-2 flex items-center">
                  <ChannelIcon channel={msg.channel} />
                </div>

                {/* Date */}
                <div className="sm:col-span-2 flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {time}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="sm:col-span-2 flex items-center">
                  <StatusBadge status={msg.status} />
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Page {data.page} of {data.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="px-5 py-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-2 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
