import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (dataUrlOrUrl: string) => void;
  maxSize?: number;
  previewClassName?: string;
}

async function compressImageToDataUrl(file: File, maxSize = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagem inválida"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxSize) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          }
        } else if (h > maxSize) {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas indisponível"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ImageUploadField({
  label,
  value,
  onChange,
  maxSize = 512,
  previewClassName = "w-14 h-14 rounded-xl object-cover border border-[#EAEBEF]",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const dataUrl = await compressImageToDataUrl(file, maxSize);
      onChange(dataUrl);
    } catch {
      // ignore invalid file
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-extrabold uppercase text-[#6B7280]">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {value && (
          <img src={value} alt={label} className={previewClassName} />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold text-[#111317] hover:border-[#FF5500] transition"
        >
          <ImagePlus className="w-4 h-4 text-[#FF5500]" />
          {loading ? "Processando..." : value ? "Trocar imagem" : "Anexar imagem"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
