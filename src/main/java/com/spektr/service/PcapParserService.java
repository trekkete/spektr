package com.spektr.service;

import com.spektr.dto.PcapParseResponse;
import com.spektr.dto.RadiusPacketData;
import org.pcap4j.core.*;
import org.pcap4j.packet.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.EOFException;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.util.*;
import java.util.concurrent.TimeoutException;

@Service
public class PcapParserService {

    private static final int RADIUS_AUTH_PORT = 1812;
    private static final int RADIUS_ACCT_PORT = 1813;
    private static final int RADIUS_OLD_AUTH_PORT = 1645;
    private static final int RADIUS_OLD_ACCT_PORT = 1646;

    // RADIUS packet codes
    private static final int ACCESS_REQUEST = 1;
    private static final int ACCOUNTING_REQUEST = 4;

    // RADIUS Acct-Status-Type values
    private static final int ACCT_STATUS_START = 1;
    private static final int ACCT_STATUS_STOP = 2;
    private static final int ACCT_STATUS_INTERIM_UPDATE = 3;

    public PcapParseResponse parsePcapFile(MultipartFile file, String sourceIpFilter, String textFilter) throws IOException {
        // Create temporary file
        File tempFile = File.createTempFile("upload-", ".pcap");
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(file.getBytes());
        }

        PcapParseResponse response = new PcapParseResponse();
        response.setAccessRequests(new ArrayList<>());
        response.setAccountingStarts(new ArrayList<>());
        response.setAccountingUpdates(new ArrayList<>());
        response.setAccountingStops(new ArrayList<>());

        int totalPackets = 0;
        int radiusPackets = 0;

        try {
            PcapHandle handle;
            try {
                handle = Pcaps.openOffline(tempFile.getAbsolutePath(), PcapHandle.TimestampPrecision.MICRO);
            } catch (UnsatisfiedLinkError e) {
                // Native library not available (likely ARM Mac without libpcap)
                Files.deleteIfExists(tempFile.toPath());
                throw new IOException(
                    "PCAP parsing requires native libpcap libraries. " +
                    "On ARM Mac: Run in Docker container or install libpcap: brew install libpcap. " +
                    "Error: " + e.getMessage()
                );
            }

            Packet packet;
            while ((packet = handle.getNextPacketEx()) != null) {
                totalPackets++;

                // Extract IP and UDP layers
                IpV4Packet ipPacket = packet.get(IpV4Packet.class);
                if (ipPacket == null) continue;

                UdpPacket udpPacket = packet.get(UdpPacket.class);
                if (udpPacket == null) continue;

                String srcIp = ipPacket.getHeader().getSrcAddr().getHostAddress();
                String dstIp = ipPacket.getHeader().getDstAddr().getHostAddress();

                // Apply source IP filter
                if (sourceIpFilter != null && !sourceIpFilter.isEmpty() && !srcIp.equals(sourceIpFilter)) {
                    continue;
                }

                // Check if it's a RADIUS packet
                int srcPort = udpPacket.getHeader().getSrcPort().valueAsInt();
                int dstPort = udpPacket.getHeader().getDstPort().valueAsInt();

                boolean isRadiusAuth = dstPort == RADIUS_AUTH_PORT || srcPort == RADIUS_AUTH_PORT ||
                                        dstPort == RADIUS_OLD_AUTH_PORT || srcPort == RADIUS_OLD_AUTH_PORT;
                boolean isRadiusAcct = dstPort == RADIUS_ACCT_PORT || srcPort == RADIUS_ACCT_PORT ||
                                        dstPort == RADIUS_OLD_ACCT_PORT || srcPort == RADIUS_OLD_ACCT_PORT;

                if (!isRadiusAuth && !isRadiusAcct) continue;

                radiusPackets++;

                // Parse RADIUS packet
                byte[] radiusData = udpPacket.getPayload().getRawData();
                if (radiusData == null || radiusData.length < 20) continue; // Minimum RADIUS packet size

                RadiusPacketData radiusPacketData = parseRadiusPacket(radiusData, srcIp, dstIp, handle.getTimestamp().getTime());

                // Apply text filter
                if (textFilter != null && !textFilter.isEmpty()) {
                    boolean matchesFilter = radiusPacketData.getRawData().toLowerCase().contains(textFilter.toLowerCase()) ||
                                            radiusPacketData.getAttributes().values().stream()
                                                    .anyMatch(v -> v.toLowerCase().contains(textFilter.toLowerCase()));
                    if (!matchesFilter) continue;
                }

                // Categorize packet
                if (radiusPacketData != null) {
                    switch (radiusPacketData.getPacketType()) {
                        case "Access-Request":
                            response.getAccessRequests().add(radiusPacketData);
                            break;
                        case "Accounting-Start":
                            response.getAccountingStarts().add(radiusPacketData);
                            break;
                        case "Accounting-Interim-Update":
                            response.getAccountingUpdates().add(radiusPacketData);
                            break;
                        case "Accounting-Stop":
                            response.getAccountingStops().add(radiusPacketData);
                            break;
                    }
                }
            }

            handle.close();

        } catch (PcapNativeException | NotOpenException | TimeoutException e) {
            throw new IOException("Failed to parse PCAP file: " + e.getMessage(), e);
        } catch (EOFException e) {
            // End of file reached, this is normal
        } finally {
            // Clean up temporary file
            Files.deleteIfExists(tempFile.toPath());
        }

        response.setTotalPacketsProcessed(totalPackets);
        response.setRadiusPacketsFound(radiusPackets);
        response.setMessage("Successfully parsed PCAP file");

        return response;
    }

    private RadiusPacketData parseRadiusPacket(byte[] data, String srcIp, String dstIp, long timestamp) {
        if (data.length < 20) return null;

        // RADIUS packet structure:
        // 0: Code (1 byte)
        // 1: Identifier (1 byte)
        // 2-3: Length (2 bytes)
        // 4-19: Authenticator (16 bytes)
        // 20+: Attributes

        int code = data[0] & 0xFF;
        int identifier = data[1] & 0xFF;
        int length = ((data[2] & 0xFF) << 8) | (data[3] & 0xFF);

        String packetType = getRadiusPacketType(code, data);
        if (packetType == null) return null; // Not a packet type we're interested in

        Map<String, String> attributes = new HashMap<>();
        StringBuilder rawDataBuilder = new StringBuilder();

        rawDataBuilder.append(String.format("Code: %d, Identifier: %d, Length: %d\n", code, identifier, length));

        // Parse attributes starting at offset 20
        int offset = 20;
        while (offset < data.length && offset < length) {
            if (offset + 2 > data.length) break;

            int attrType = data[offset] & 0xFF;
            int attrLength = data[offset + 1] & 0xFF;

            if (attrLength < 2 || offset + attrLength > data.length) break;

            byte[] attrValue = new byte[attrLength - 2];
            System.arraycopy(data, offset + 2, attrValue, 0, attrLength - 2);

            String attrName = getRadiusAttributeName(attrType);
            String attrValueStr = parseRadiusAttributeValue(attrType, attrValue);

            attributes.put(attrName, attrValueStr);
            rawDataBuilder.append(String.format("  %s: %s\n", attrName, attrValueStr));

            offset += attrLength;
        }

        RadiusPacketData packetData = new RadiusPacketData();
        packetData.setPacketType(packetType);
        packetData.setSourceIp(srcIp);
        packetData.setDestinationIp(dstIp);
        packetData.setTimestamp(timestamp);
        packetData.setAttributes(attributes);
        packetData.setRawData(rawDataBuilder.toString());

        return packetData;
    }

    private String getRadiusPacketType(int code, byte[] data) {
        if (code == ACCESS_REQUEST) {
            return "Access-Request";
        } else if (code == ACCOUNTING_REQUEST) {
            // For accounting, check Acct-Status-Type attribute (type 40)
            int acctStatusType = getAcctStatusType(data);
            switch (acctStatusType) {
                case ACCT_STATUS_START:
                    return "Accounting-Start";
                case ACCT_STATUS_STOP:
                    return "Accounting-Stop";
                case ACCT_STATUS_INTERIM_UPDATE:
                    return "Accounting-Interim-Update";
                default:
                    return "Accounting-Request"; // Generic
            }
        }
        return null; // Not interested in other codes
    }

    private int getAcctStatusType(byte[] data) {
        // Find Acct-Status-Type attribute (type 40)
        int offset = 20;
        while (offset < data.length - 2) {
            int attrType = data[offset] & 0xFF;
            int attrLength = data[offset + 1] & 0xFF;

            if (attrLength < 2 || offset + attrLength > data.length) break;

            if (attrType == 40 && attrLength >= 6) {
                // Acct-Status-Type is 4 bytes (integer)
                return ((data[offset + 2] & 0xFF) << 24) |
                       ((data[offset + 3] & 0xFF) << 16) |
                       ((data[offset + 4] & 0xFF) << 8) |
                       (data[offset + 5] & 0xFF);
            }

            offset += attrLength;
        }
        return -1;
    }

    private String getRadiusAttributeName(int type) {
        // Common RADIUS attributes
        Map<Integer, String> attributeNames = new HashMap<>();
        attributeNames.put(1, "User-Name");
        attributeNames.put(2, "User-Password");
        attributeNames.put(4, "NAS-IP-Address");
        attributeNames.put(5, "NAS-Port");
        attributeNames.put(6, "Service-Type");
        attributeNames.put(7, "Framed-Protocol");
        attributeNames.put(8, "Framed-IP-Address");
        attributeNames.put(30, "Called-Station-Id");
        attributeNames.put(31, "Calling-Station-Id");
        attributeNames.put(32, "NAS-Identifier");
        attributeNames.put(40, "Acct-Status-Type");
        attributeNames.put(41, "Acct-Delay-Time");
        attributeNames.put(42, "Acct-Input-Octets");
        attributeNames.put(43, "Acct-Output-Octets");
        attributeNames.put(44, "Acct-Session-Id");
        attributeNames.put(45, "Acct-Authentic");
        attributeNames.put(46, "Acct-Session-Time");
        attributeNames.put(49, "Acct-Terminate-Cause");
        attributeNames.put(61, "NAS-Port-Type");
        attributeNames.put(79, "EAP-Message");
        attributeNames.put(80, "Message-Authenticator");
        attributeNames.put(87, "NAS-Port-Id");

        return attributeNames.getOrDefault(type, "Attribute-" + type);
    }

    private String parseRadiusAttributeValue(int type, byte[] value) {
        // Integer types (4 bytes)
        if ((type >= 4 && type <= 6) || type == 40 || type == 41 || type == 46 || type == 49 || type == 61) {
            if (value.length >= 4) {
                int intValue = ((value[0] & 0xFF) << 24) |
                              ((value[1] & 0xFF) << 16) |
                              ((value[2] & 0xFF) << 8) |
                              (value[3] & 0xFF);
                return String.valueOf(intValue);
            }
        }

        // IP Address types
        if (type == 4 || type == 8) {
            if (value.length >= 4) {
                return String.format("%d.%d.%d.%d",
                        value[0] & 0xFF, value[1] & 0xFF, value[2] & 0xFF, value[3] & 0xFF);
            }
        }

        // String types (default)
        try {
            return new String(value, "UTF-8").replaceAll("[^\\p{Print}]", "");
        } catch (Exception e) {
            return bytesToHex(value);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }
}
