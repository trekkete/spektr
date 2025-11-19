package com.spektr.model;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

public class Vendor implements Serializable {

    public enum QueryStringParameter {
        AP_MAC,
        CLIENT_MAC,
        CLIENT_IP,
        LOGIN_URL,
        LOGOUT_URL,
        SSID,
        NAS_ID
    }

    public enum RadiusParameter {
        CLIENT_IP,
        SSID,
        NAS_ID,
        TERMINATION_CAUSE,
        CALLED_STATION_ID,
        CALLING_STATION_ID
    }

    public enum RoamingBehaviour {
        SUB_STOP_AND_START,
        STOP_AND_START,
        AUTH,
        OTHER
    }

    public enum PasswordAuthenticationMask {
        PAP(1),
        CHAP(2),
        MS_CHAP_V2(4);

        final int flag;

        PasswordAuthenticationMask(int mask) {
            this.flag = mask;
        }

        public int getFlag() {
            return flag;
        }
    }

    public enum WalledGardenMask {
        BY_IP(1),
        BY_DOMAIN(2),
        WITH_WILDCARD(4),
        BY_PROTOCOL(8),
        BY_PORT(16);

        final int flag;

        WalledGardenMask(int flag) {
            this.flag = flag;
        }

        public int getFlag() {
            return flag;
        }
    }

    private static class LoginMethods {

        private Boolean supportHttps;

        private Boolean supportLogout;

        private Boolean supportMailSurf;

        private Boolean supportSmsSurf;

        private Boolean supportSocial;

        public Boolean getSupportHttps() {
            return supportHttps;
        }

        public void setSupportHttps(Boolean supportHttps) {
            this.supportHttps = supportHttps;
        }

        public Boolean getSupportLogout() {
            return supportLogout;
        }

        public void setSupportLogout(Boolean supportLogout) {
            this.supportLogout = supportLogout;
        }

        public Boolean getSupportMailSurf() {
            return supportMailSurf;
        }

        public void setSupportMailSurf(Boolean supportMailSurf) {
            this.supportMailSurf = supportMailSurf;
        }

        public Boolean getSupportSmsSurf() {
            return supportSmsSurf;
        }

        public void setSupportSmsSurf(Boolean supportSmsSurf) {
            this.supportSmsSurf = supportSmsSurf;
        }

        public Boolean getSupportSocial() {
            return supportSocial;
        }

        public void setSupportSocial(Boolean supportSocial) {
            this.supportSocial = supportSocial;
        }
    }

    public static class WalledGarden {

        private Integer mask;

        private Boolean welcomePage;

        public Integer getMask() {
            return mask;
        }

        public void setMask(Integer mask) {
            this.mask = mask;
        }

        public Boolean getWelcomePage() {
            return welcomePage;
        }

        public void setWelcomePage(Boolean welcomePage) {
            this.welcomePage = welcomePage;
        }
    }

    public static class CaptivePortal {

        private String redirectionUrl;

        private Map<String, String> queryStringParameters;

        private Map<String, String> queryStringMapping;

        private String loginUrl;

        private String logoutUrl;

        private String notes;

        public String getRedirectionUrl() {
            return redirectionUrl;
        }

        public void setRedirectionUrl(String redirectionUrl) {
            this.redirectionUrl = redirectionUrl;
        }

        public Map<String, String> getQueryStringParameters() {
            return queryStringParameters;
        }

        public void setQueryStringParameters(Map<String, String> queryStringParameters) {
            this.queryStringParameters = queryStringParameters;
        }

        public Map<String, String> getQueryStringMapping() {
            return queryStringMapping;
        }

        public void setQueryStringMapping(Map<String, String> queryStringMapping) {
            this.queryStringMapping = queryStringMapping;
        }

        public String getLoginUrl() {
            return loginUrl;
        }

        public void setLoginUrl(String loginUrl) {
            this.loginUrl = loginUrl;
        }

        public String getLogoutUrl() {
            return logoutUrl;
        }

        public void setLogoutUrl(String logoutUrl) {
            this.logoutUrl = logoutUrl;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    public static class Radius {

        private String accessRequest;

        private String accountingStart;

        private String accountingUpdate;

        private String accountingStop;

        private Map<String, String> authAttributes;

        private Map<String, String> acctAttributes;

        private Boolean supportCoa;

        private String packetSource;

        private Integer authenticationMask;

        private Boolean supportMacAuthentication;

        private Boolean supportRoaming;

        private String notes;

        public String getAccessRequest() {
            return accessRequest;
        }

        public void setAccessRequest(String accessRequest) {
            this.accessRequest = accessRequest;
        }

        public String getAccountingStart() {
            return accountingStart;
        }

        public void setAccountingStart(String accountingStart) {
            this.accountingStart = accountingStart;
        }

        public String getAccountingUpdate() {
            return accountingUpdate;
        }

        public void setAccountingUpdate(String accountingUpdate) {
            this.accountingUpdate = accountingUpdate;
        }

        public String getAccountingStop() {
            return accountingStop;
        }

        public void setAccountingStop(String accountingStop) {
            this.accountingStop = accountingStop;
        }

        public Map<String, String> getAuthAttributes() {
            return authAttributes;
        }

        public void setAuthAttributes(Map<String, String> authAttributes) {
            this.authAttributes = authAttributes;
        }

        public Map<String, String> getAcctAttributes() {
            return acctAttributes;
        }

        public void setAcctAttributes(Map<String, String> acctAttributes) {
            this.acctAttributes = acctAttributes;
        }

        public Boolean getSupportCoa() {
            return supportCoa;
        }

        public void setSupportCoa(Boolean supportCoa) {
            this.supportCoa = supportCoa;
        }

        public String getPacketSource() {
            return packetSource;
        }

        public void setPacketSource(String packetSource) {
            this.packetSource = packetSource;
        }

        public Integer getAuthenticationMask() {
            return authenticationMask;
        }

        public void setAuthenticationMask(Integer authenticationMask) {
            this.authenticationMask = authenticationMask;
        }

        public Boolean getSupportMacAuthentication() {
            return supportMacAuthentication;
        }

        public void setSupportMacAuthentication(Boolean supportMacAuthentication) {
            this.supportMacAuthentication = supportMacAuthentication;
        }

        public Boolean getSupportRoaming() {
            return supportRoaming;
        }

        public void setSupportRoaming(Boolean supportRoaming) {
            this.supportRoaming = supportRoaming;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    public static class VendorIntegrationSnapshot {

        private String operator;

        private Long timestamp;

        private String model;

        private String firmwareVersion;

        private Radius radius;

        private CaptivePortal captivePortal;

        private WalledGarden walledGarden;

        private LoginMethods loginMethods;

        public String getOperator() {
            return operator;
        }

        public void setOperator(String operator) {
            this.operator = operator;
        }

        public Long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(Long timestamp) {
            this.timestamp = timestamp;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }

        public String getFirmwareVersion() {
            return firmwareVersion;
        }

        public void setFirmwareVersion(String firmwareVersion) {
            this.firmwareVersion = firmwareVersion;
        }

        public Radius getRadius() {
            return radius;
        }

        public void setRadius(Radius radius) {
            this.radius = radius;
        }

        public CaptivePortal getCaptivePortal() {
            return captivePortal;
        }

        public void setCaptivePortal(CaptivePortal captivePortal) {
            this.captivePortal = captivePortal;
        }

        public WalledGarden getWalledGarden() {
            return walledGarden;
        }

        public void setWalledGarden(WalledGarden walledGarden) {
            this.walledGarden = walledGarden;
        }

        public LoginMethods getLoginMethods() {
            return loginMethods;
        }

        public void setLoginMethods(LoginMethods loginMethods) {
            this.loginMethods = loginMethods;
        }
    }

    private String name;

    private Long revisionsCount;

    private Map<String, VendorIntegrationSnapshot> revisions;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getRevisionsCount() {
        return revisionsCount;
    }

    public void setRevisionsCount(Long revisionsCount) {
        this.revisionsCount = revisionsCount;
    }

    public Map<String, VendorIntegrationSnapshot> getRevisions() {

        if (revisions == null) {
            revisions = new HashMap<>();
        }

        return revisions;
    }

    public void setRevisions(Map<String, VendorIntegrationSnapshot> revisions) {
        this.revisions = revisions;
    }
}
