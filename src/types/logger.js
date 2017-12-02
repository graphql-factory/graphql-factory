export type ExecutionLogger = (
  type: string,
  data: mixed
) => void;

export const LoggerDetailType = {
  DIRECTIVE: 'DIRECTIVE',
  FIELD: 'FIELD',
  LIST_FIELD: 'LIST_FIELD',
  LIST_ITEM: 'LIST_ITEM'
};
