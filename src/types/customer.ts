export enum CustomerStatus {
  ACTIVE = "active",
  ON_VACATION = "on_vacation",
  INACTIVE = "inactive",
}

export interface Customer {
  _id: string;
  customerNumber: string;
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  mobileNumber: string;
  email: string;
  status: CustomerStatus;
  vacationStartDate: string | null;
  vacationEndDate: string | null;
  createdAt: string;
  updatedAt: string;
}
