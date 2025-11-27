export interface VendorConfiguration {
  id: number;
  vendorName: string;
  version: number;
  vendorData: Vendor;
  ownerUsername: string;
  ownerId: number;
  parentVersionId?: number;
  sharedWithUsernames: string[];
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface Vendor {
  name: string;
  revisionsCount?: number;
  revisions?: { [key: string]: VendorIntegrationSnapshot };
}

export interface VendorIntegrationSnapshot {
  operator: string;
  timestamp: number;
  model: string;
  firmwareVersion: string;
  radius?: RadiusConfig;
  captivePortal?: CaptivePortalConfig;
  walledGarden?: WalledGardenConfig;
  loginMethods?: LoginMethods;
}

export interface RadiusConfig {
  accessRequest?: string;
  accountingStart?: string;
  accountingUpdate?: string;
  accountingStop?: string;
  authAttributes?: { [key: string]: string };
  acctAttributes?: { [key: string]: string };
  supportCoa?: boolean;
  packetSource?: string;
  authenticationMask?: number;
  supportMacAuthentication?: boolean;
  supportRoaming?: boolean;
  notes?: string;
}

export interface CaptivePortalConfig {
  redirectionUrl?: string;
  queryStringParameters?: { [key: string]: string };
  queryStringMapping?: { [key: string]: string }; // Maps actual param name to standard param name
  loginUrl?: string;
  logoutUrl?: string;
  notes?: string;
}

export interface WalledGardenConfig {
  mask?: number;
  welcomePage?: boolean;
  notes?: string;
}

export interface LoginMethods {
  supportHttps?: boolean;
  supportLogout?: boolean;
  supportMailSurf?: boolean;
  supportSmsSurf?: boolean;
  supportSocial?: boolean;
  notes?: string;
}

export interface VendorConfigurationRequest {
  vendorName: string;
  vendorData: Vendor;
  description?: string;
  parentVersionId?: number;
}

export interface VendorSummary {
  vendorName: string;
  versionCount: number;
  latestVersion: VendorConfiguration;
}
