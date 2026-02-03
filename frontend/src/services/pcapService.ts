export interface RadiusPacketData {
  packetType: string;
  sourceIp: string;
  destinationIp: string;
  timestamp: number;
  attributes: { [key: string]: string };
  rawData: string;
}

export interface PcapParseResponse {
  accessRequests: RadiusPacketData[];
  accountingStarts: RadiusPacketData[];
  accountingUpdates: RadiusPacketData[];
  accountingStops: RadiusPacketData[];
  totalPacketsProcessed: number;
  radiusPacketsFound: number;
  message: string;
}

export const parsePcapFile = async (
  file: File,
  sourceIpFilter?: string,
  textFilter?: string
): Promise<PcapParseResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  if (sourceIpFilter) {
    formData.append('sourceIpFilter', sourceIpFilter);
  }

  if (textFilter) {
    formData.append('textFilter', textFilter);
  }

  const response = await fetch('/api/pcap/parse', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to parse PCAP file');
  }

  return response.json();
};
