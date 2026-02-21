import { PolicyData, Client } from '../types';

export const isClientInsured = (policy: PolicyData, clientName: string) => {
    const pName = policy.insuredName?.trim().toLowerCase();
    const cName = clientName.trim().toLowerCase();
    // If no insured name is specified, or it matches the client's name, the client is the insured.
    return !pName || pName === '' || pName === cName;
};

export const calculateTotalAnnualPremiumHKD = (policies: PolicyData[]) => {
    return policies.reduce((sum, p) => {
        let amount = p.premiumAmount || 0;
        if (p.currency === 'USD') amount = amount * 7.8;
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
        if (p.currency === 'USD') val = val * 7.8;
        return sum + val;
    }, 0);
};

export const calculateTotalCISumInsuredHKD = (policies: PolicyData[], clientName: string) => {
    return calculateSumInsuredByTypeHKD(policies, clientName, ['Critical Illness'], 'Critical Illness');
};

export const calculateTotalLifeSumInsuredHKD = (policies: PolicyData[], clientName: string) => {
    return calculateSumInsuredByTypeHKD(policies, clientName, ['Life', 'Savings'], 'Life');
};
