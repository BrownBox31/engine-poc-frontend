export interface ICreateModelChecklist {
  modelId: number;
  checklist: IModelCheckList[];
}
export interface IModelCheckList {
  itemName: string;
  itemDescription: string;
  view: string;
  isParent: boolean;
  parentId: number;
  group: string;
  order: number;
}
