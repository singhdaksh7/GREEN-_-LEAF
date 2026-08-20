export interface DeliveryCheckResult {
  pincode: string;
  serviceable: boolean;
  estimatedDays: string;
  codAvailable: boolean;
  message: string;
}

/**
 * Mock delivery/logistics service. Swap this implementation with a real
 * logistics provider integration later without changing callers, since
 * they only depend on this function's signature.
 */
export async function checkPincodeServiceability(pincode: string): Promise<DeliveryCheckResult> {
  const isValidFormat = /^\d{6}$/.test(pincode);

  if (!isValidFormat) {
    return {
      pincode,
      serviceable: false,
      estimatedDays: '',
      codAvailable: false,
      message: 'Please enter a valid 6-digit pincode.',
    };
  }

  // Deterministic mock: derive serviceability from pincode digits so results are stable.
  const lastDigit = Number(pincode[pincode.length - 1]);
  const serviceable = lastDigit !== 0;
  const estimatedDays = lastDigit <= 3 ? '2-3 business days' : lastDigit <= 6 ? '3-5 business days' : '5-7 business days';

  return {
    pincode,
    serviceable,
    estimatedDays,
    codAvailable: serviceable,
    message: serviceable
      ? `Delivery available in ${estimatedDays}.`
      : 'Sorry, we currently do not deliver to this pincode.',
  };
}
