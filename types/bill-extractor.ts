export interface PDFFileMetadata {
  name: string;
  size: number;
  lastModified: number;
  type: string;
  url?: string;
}

export interface ContainerDetail {
  container_number: string;
  container_seal_number: string;
  container_size_type: string;
  carton_amount: number;
}

export interface FreightRateItem {
  item_name: string;
  amount: string;
  currency: string;
}

export interface BillInfo {
  bl_number: string;
  total_cartons: number;
  container_detail: ContainerDetail[];
  hts_code: string;
  is_port_of_arrival_door: boolean;
  place_of_delivery: string;
  port_of_discharge: string;
  port_of_loading: string;
  freight_payment_type: string;
  freight_rate_item: FreightRateItem[];
  service_contract_number: string;
  shipped_on_board_date: string;
  freight_charge_total: number;
  freight_charge_currency: string;
  total_measurement: number;
  total_shipment_weight: number;
}

export interface APIConfig {
  temperature: number;
  top_p: number;
  max_tokens: number | null;
  presence_penalty: number | null;
  frequency_penalty: number | null;
} 
