import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Truck } from 'lucide-react';
import { checkPincodeRequest, DeliveryCheckResult } from '@/api/delivery';

export function DeliveryChecker() {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<DeliveryCheckResult | null>(null);

  const mutation = useMutation({
    mutationFn: checkPincodeRequest,
    onSuccess: setResult,
  });

  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
        <Truck size={16} /> Check Delivery
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pincode.trim()) mutation.mutate(pincode.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter Delivery Pincode"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={mutation.isPending || pincode.length !== 6}
          className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Check
        </button>
      </form>

      {result && (
        <div className={`mt-3 flex items-start gap-2 text-sm ${result.serviceable ? 'text-brand-700' : 'text-red-600'}`}>
          {result.serviceable ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}
