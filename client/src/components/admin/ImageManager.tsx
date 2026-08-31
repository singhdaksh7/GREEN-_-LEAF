import { useRef, useState } from 'react';
import { UploadCloud, Star, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadProductImagesRequest, uploadedImageToProductImage } from '@/api/admin';
import { getErrorMessage } from '@/api/axios';
import { ProductImage } from '@/types';
import { cn } from '@/utils/cn';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 8;

interface ImageManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

export function ImageManager({ images, onChange }: ImageManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reindex(list: ProductImage[]): ProductImage[] {
    return list.map((image, index) => ({ ...image, sortOrder: index }));
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images per product`);
      return;
    }

    const invalid = files.find((f) => !ACCEPTED_TYPES.includes(f.type));
    if (invalid) {
      toast.error('Only JPG, PNG or WebP images are allowed');
      return;
    }

    const oversized = files.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      toast.error('Maximum 8 MB per image');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadProductImagesRequest(files);
      const startIndex = images.length;
      const newImages = uploaded.map((img, i) =>
        uploadedImageToProductImage(img, startIndex + i, images.length === 0 && i === 0)
      );
      onChange(reindex([...images, ...newImages]));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Image upload failed'));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeAt(index: number) {
    const next = images.filter((_, i) => i !== index);
    if (images[index].isPrimary && next.length > 0) next[0].isPrimary = true;
    onChange(reindex(next));
  }

  function setPrimary(index: number) {
    onChange(images.map((image, i) => ({ ...image, isPrimary: i === index })));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(reindex(next));
  }

  return (
    <div className="sm:col-span-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm text-gray-500 transition-colors',
          isDragging ? 'border-brand-500 bg-brand-50' : 'border-gray-300'
        )}
      >
        {isUploading ? (
          <Loader2 className="animate-spin text-brand-600" size={28} />
        ) : (
          <UploadCloud className="text-gray-400" size={28} />
        )}
        <p>Drag and drop images here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Choose Files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-xs text-gray-400">JPG, PNG or WebP · Maximum {MAX_IMAGES} images · 8 MB each</p>
      </div>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <div key={image.key || image.url} className="group relative overflow-hidden rounded-lg border border-gray-200">
              <img src={image.url} alt={image.alt || ''} className="h-24 w-full object-cover" />
              {image.isPrimary && (
                <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Primary
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" title="Set as primary" onClick={() => setPrimary(index)} className="rounded p-1 text-white hover:bg-white/20">
                  <Star size={14} fill={image.isPrimary ? 'currentColor' : 'none'} />
                </button>
                <button type="button" title="Move earlier" onClick={() => move(index, -1)} className="rounded p-1 text-white hover:bg-white/20">
                  <ChevronUp size={14} />
                </button>
                <button type="button" title="Move later" onClick={() => move(index, 1)} className="rounded p-1 text-white hover:bg-white/20">
                  <ChevronDown size={14} />
                </button>
                <button type="button" title="Remove" onClick={() => removeAt(index)} className="rounded p-1 text-white hover:bg-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
