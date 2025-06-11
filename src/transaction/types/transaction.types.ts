import { BillType } from '../../bill-payment/enums/bill.enum';


export interface TransactionMetadata {
  reference?: string;
  description?: string;
  source?: string;
  billType?: BillType;
  meterNumber?: string;
  customerName?: string;
  externalReference?: string;
}
