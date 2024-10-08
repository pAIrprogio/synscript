export interface Cache {
  fn: <TFnArgs extends any[], TFnOutput>(
    fn: (...args: TFnArgs) => Promise<TFnOutput> | TFnOutput,
  ) => (...args: TFnArgs) => Promise<TFnOutput>;
}
