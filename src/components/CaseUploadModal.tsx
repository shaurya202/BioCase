import { useState, useRef, useCallback } from "react";
import type { CaseDefinition } from "@/types/case";
import { parseFile } from "@/lib/fileParser";
import { extractCaseFromText } from "@/lib/caseExtractor";
import { useCaseStore } from "@/stores/caseStore";
import { CaseEditor } from "./CaseEditor";

type ModalState = "upload" | "extracting" | "preview" | "error";

interface CaseUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export function CaseUploadModal({ open, onClose }: CaseUploadModalProps) {
  const { addCustomCase } = useCaseStore();
  const [state, setState] = useState<ModalState>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [extractedCase, setExtractedCase] = useState<CaseDefinition | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setState("upload");
    setFile(null);
    setExtractedCase(null);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setState("extracting");
    setError("");

    try {
      const rawText = await parseFile(f);
      if (rawText.trim().length < 50) {
        throw new Error("File too short. Please upload a file with meaningful clinical content.");
      }
      const extracted = await extractCaseFromText(rawText);
      setExtractedCase(extracted);
      setState("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
      setState("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleSave = (caseDef: CaseDefinition) => {
    addCustomCase(caseDef);
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border rounded-2xl shadow-2xl w-[900px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold">Upload Custom Case</h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              Upload a text or PDF file and let AI extract a structured case
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-muted transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {state === "upload" && (
            <div className="p-8">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-accent bg-accent/5"
                    : "border-border/60 hover:border-text-muted/50 hover:bg-bg-hover/30"
                }`}
              >
                <div className="text-4xl mb-4 opacity-20">📄</div>
                <p className="text-sm font-medium text-text-secondary">
                  Drop a case file here or click to browse
                </p>
                <p className="text-xs text-text-muted mt-2">
                  Supports .txt, .md, and .pdf files (max 10 MB)
                </p>
                <p className="text-xs text-text-muted/70 mt-5">
                  The AI will extract structured case data including diagnosis, clues, actions, and scoring rubric.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="hidden"
              />
            </div>
          )}

          {state === "extracting" && (
            <div className="p-14 text-center">
              <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-text-secondary mt-5">
                Analyzing {file?.name}...
              </p>
              <p className="text-xs text-text-muted mt-2">
                AI is extracting clinical case structure from your file
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="p-8">
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-5 mb-5">
                <p className="text-sm text-danger font-medium">Extraction Failed</p>
                <p className="text-xs text-danger/80 mt-1 leading-relaxed">{error}</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={reset}
                  className="px-5 py-2.5 text-sm bg-bg-panel border border-border rounded-lg hover:bg-bg-hover transition-colors"
                >
                  Try Another File
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm text-text-muted hover:bg-bg-hover rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {state === "preview" && extractedCase && (
            <div className="h-full">
              <CaseEditor
                initialCase={extractedCase}
                onSave={handleSave}
                onCancel={handleClose}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
