export const teamKeys = {
  all: ['team'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  detail: (id: string) => [...teamKeys.all, 'detail', id] as const,
};
