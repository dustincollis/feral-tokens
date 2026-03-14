"use client";

import { useState } from "react";

interface ScriptPanelProps {
  script: string;
  onScriptChange: (script: string) => void;
}

export function ScriptPanel({ script, onScriptChange }: ScriptPanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feral-tokens-script-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Script</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={!script}
            className="text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-40 px-3 py-1.5 rounded"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!script}
            className="text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-40 px-3 py-1.5 rounded"
          >
            Download
          </button>
        </div>
      </div>

      {!script ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Add posts to the episode builder and click Generate Script
        </div>
      ) : (
        <textarea
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
          spellCheck={false}
        />
      )}
    </div>
  );
}