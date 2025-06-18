export enum UnitOfMeasure {
  MM = "mm",
  CM = "cm",
  M = "m",
}

export interface Item {
  _id: string;
  filterType: string;
  length: number;
  width: number;
  depth: number;
  unitOfMeasure: UnitOfMeasure;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
