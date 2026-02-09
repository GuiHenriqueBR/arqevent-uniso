import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "../../../supabaseClient";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  previewHeight?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder = "geral",
  label = "Imagem de Capa (opcional)",
  hint = "Arraste ou clique para enviar. JPG, PNG ou WebP até 5MB.",
  previewHeight = "h-40",
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setError(null);

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Formato não suportado. Use JPG, PNG, WebP ou GIF.");
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("imagens")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("imagens")
        .getPublicUrl(fileName);

      onChange(urlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRemove = async () => {
    // Try to delete from storage if it's a supabase URL
    if (value.includes("/storage/v1/object/public/imagens/")) {
      try {
        const path = value.split("/storage/v1/object/public/imagens/")[1];
        if (path) {
          await supabase.storage
            .from("imagens")
            .remove([decodeURIComponent(path)]);
        }
      } catch {
        // Ignore delete errors - just clear the URL
      }
    }
    onChange("");
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      {value ? (
        /* Preview with remove button */
        <div
          className={`relative rounded-xl overflow-hidden border border-slate-200 ${previewHeight}`}
        >
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "";
            }}
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <button
              type="button"
              onClick={handleRemove}
              className="bg-white/90 hover:bg-red-50 text-red-500 p-2 rounded-full shadow-lg transition-colors"
              title="Remover imagem"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Small remove badge */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 p-1.5 rounded-full text-slate-400 hover:text-red-500 shadow transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Upload drop zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">
                Enviando imagem...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Clique para escolher ou arraste aqui
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 p-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Also allow pasting a URL directly */}
      {!value && !uploading && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ImageIcon className="w-3 h-3" />
          <span>Ou cole uma URL direta:</span>
          <input
            type="url"
            placeholder="https://..."
            className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) onChange(val);
              }
            }}
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (val) onChange(val);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
