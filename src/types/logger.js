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

export type LoggerDetailTypeEnum = 'DIRECTIVE' | 'FIELD';

export type ExecutionDetails = {

};

/**

const executionDetails = {
  resolves: [
    {
      type: 'directive',
      name: 'test',
      resolver: 'resolveRequest',
      start: 2090430493043904,
      end: 2030329039203920392,
      duration: 303030
    },
    {
      type: 'field',
      name: 'foo',
      resolver: 'resolveFoo',
      start: 03402490,
      end: 443434343,
      duration: 32323,
      resolves: [
        {
          type: 'field',
        }
      ]
    }
  ]
}
 */