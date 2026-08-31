import { Plus, Trash2 } from 'lucide-react';
import { ProductImage, ProductVariant } from '@/types';

interface VariantEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  galleryImages: ProductImage[];
}

function emptyVariant(): ProductVariant {
  return { sku: '', attributes: {}, mrp: 0, salePrice: 0, stock: 0, images: [] };
}

export function VariantEditor({ variants, onChange, galleryImages }: VariantEditorProps) {
  function updateVariant(index: number, patch: Partial<ProductVariant>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    onChange([...variants, emptyVariant()]);
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  function updateAttribute(index: number, key: string, value: string) {
    updateVariant(index, { attributes: { ...variants[index].attributes, [key]: value } });
  }

  function addAttribute(index: number) {
    let attrKey = 'attribute';
    let n = 1;
    while (variants[index].attributes[attrKey]) {
      attrKey = `attribute${n}`;
      n += 1;
    }
    updateVariant(index, { attributes: { ...variants[index].attributes, [attrKey]: '' } });
  }

  function renameAttributeKey(index: number, oldKey: string, newKey: string) {
    if (!newKey || newKey === oldKey) return;
    const attrs = { ...variants[index].attributes };
    const value = attrs[oldKey];
    delete attrs[oldKey];
    attrs[newKey] = value;
    updateVariant(index, { attributes: attrs });
  }

  function removeAttribute(index: number, key: string) {
    const attrs = { ...variants[index].attributes };
    delete attrs[key];
    updateVariant(index, { attributes: attrs });
  }

  function toggleVariantImage(index: number, url: string) {
    const current = variants[index].images;
    const next = current.includes(url) ? current.filter((u) => u !== url) : [...current, url];
    updateVariant(index, { images: next });
  }

  return (
    <div className="sm:col-span-2 flex flex-col gap-3">
      {variants.map((variant, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              <input
                placeholder="SKU"
                value={variant.sku}
                onChange={(e) => updateVariant(index, { sku: e.target.value })}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                placeholder="MRP"
                value={variant.mrp}
                onChange={(e) => updateVariant(index, { mrp: Number(e.target.value) })}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                placeholder="Sale Price"
                value={variant.salePrice}
                onChange={(e) => updateVariant(index, { salePrice: Number(e.target.value) })}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                placeholder="Stock"
                value={variant.stock}
                onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <button type="button" onClick={() => removeVariant(index)} className="text-gray-400 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Attributes (e.g. Size, Color)</span>
            {Object.entries(variant.attributes).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1.5">
                <input
                  defaultValue={key}
                  onBlur={(e) => renameAttributeKey(index, key, e.target.value.trim())}
                  placeholder="Key"
                  className="w-28 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                />
                <input
                  value={value}
                  onChange={(e) => updateAttribute(index, key, e.target.value)}
                  placeholder="Value"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                />
                <button type="button" onClick={() => removeAttribute(index, key)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addAttribute(index)} className="w-fit text-xs font-medium text-brand-600 hover:underline">
              + Add attribute
            </button>
          </div>

          {galleryImages.length > 0 && (
            <div className="mt-2">
              <span className="text-xs font-medium text-gray-500">Image override (optional)</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {galleryImages.map((image) => (
                  <button
                    type="button"
                    key={image.key || image.url}
                    onClick={() => toggleVariantImage(index, image.url)}
                    className={`overflow-hidden rounded border-2 ${variant.images.includes(image.url) ? 'border-brand-600' : 'border-transparent'}`}
                  >
                    <img src={image.url} alt="" className="h-10 w-10 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={addVariant} className="flex w-fit items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        <Plus size={14} /> Add Variant
      </button>
    </div>
  );
}
