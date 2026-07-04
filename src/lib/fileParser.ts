import { PDFParse } from "pdf-parse";

const SUPPORTED_EXTENSIONS = [".txt", ".md", ".pdf"];

export function validateFile(file: File): string | null {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return `Unsupported file type: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`;
  }
  if (file.size > 10 * 1024 * 1024) {
    return "File too large. Maximum size is 10 MB.";
  }
  return null;
}

async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

async function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export async function parseFile(file: File): Promise<string> {
  const error = validateFile(file);
  if (error) throw new Error(error);

  const ext = "." + file.name.split(".").pop()?.toLowerCase();

  if (ext === ".pdf") {
    const buffer = await readAsArrayBuffer(file);
    const uint8 = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8 });
    const textResult = await parser.getText();
    const text = textResult.text;
    if (!text || text.trim().length === 0) {
      throw new Error("PDF contains no extractable text. It may be a scanned image.");
    }
    return text;
  }

  // TXT, MD
  return readAsText(file);
}
