export const subscriptionKeys = {
  all: ['subscription'] as const,
  usage: () => [...subscriptionKeys.all, 'usage'] as const,
};
