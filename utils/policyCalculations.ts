import { PolicyData, Client } from '../types';

const USD_TO_HKD = 7.8;

const PAYMENT_FREQUENCY: Record<string, number> = {
    Monthly: 12,
    Quarterly: 4,
    'Half-Yearly': 2,
    Yearly: 1,
};

export const isClientInsured = (policy: PolicyData, clientName: string) => {
    const pName = policy.insuredName?.trim().toLowerCase();
    const cName = clientName.trim().toLowerCase();
    // If no insured name is specified, or it matches the client's name, the client is the insured.
    return !pName || pName === '' || pName === cName;
};

export const calculateTotalAnnualPremiumHKD = (policies: PolicyData[]) => {
    return policies.reduce((sum, p) => {
        let amount = p.premiumAmount || 0;
        // Annualize based on payment frequency
        const freq = PAYMENT_FREQUENCY[p.paymentMode] ?? 1;
        amount = amount * freq;
        if (p.currency === 'USD') amount = amount * USD_TO_HKD;
        return sum + amount;
    }, 0);
};

const calculateSumInsuredByTypeHKD = (policies: PolicyData[], clientName: string, baseTypes: string[], riderType: string) => {
    return policies.reduce((sum, p) => {
        if (!isClientInsured(p, clientName)) return sum; // Exclude if client is not the insured person

        let val = 0;
        // Base Plan
        if (p.type && baseTypes.includes(p.type)) {
            val += p.sumInsured || 0;
        }
        // Riders
        if (p.riders) {
            val += p.riders
                .filter(r => r.type === riderType)
                .reduce((rSum, r) => rSum + (r.sumInsured || 0), 0);
        }
        // Currency conversion
        if (p.currency === 'USD') val = val * USD_TO_HKD;
        return sum + val;
    }, 0);
};

export const calculateTotalCISumInsuredHKD = (policies: PolicyData[], clientName: string) => {
    return calculateSumInsuredByTypeHKD(policies, clientName, ['Critical Illness'], 'Critical Illness');
};

export const calculateTotalLifeSumInsuredHKD = (policies: PolicyData[], clientName: string) => {
    return calculateSumInsuredByTypeHKD(policies, clientName, ['Life'], 'Life');
};
