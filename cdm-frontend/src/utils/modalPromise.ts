type ResolverMap = Record<string, (value: unknown) => void>;

const resolvers: ResolverMap = {};

export const createModalPromise = (key: string) => {
  return new Promise((resolve) => {
    resolvers[key] = resolve;
  });
};

export const resolveModal = (key: string, value: unknown) => {
  if (resolvers[key]) {
    resolvers[key](value);
    delete resolvers[key];
  }
};
