export interface ICreateModelVinMapping {
  modelId: string;
  vins: string[];
}

export interface IModelVinMaps{
    modelVinMaps: ICreateModelVinMapping[];
}