package com.spektr.util;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.time.Instant;

/**
 * Utility class to generate fake RADIUS PCAP files for testing.
 * Creates a PCAP file with sample RADIUS packets (Access-Request, Accounting-Start, etc.)
 */
public class RadiusPcapGenerator {

    private static final int PCAP_MAGIC = 0xa1b2c3d4;
    private static final short VERSION_MAJOR = 2;
    private static final short VERSION_MINOR = 4;
    private static final int SNAPLEN = 65535;
    private static final int LINKTYPE_ETHERNET = 1;

    public static void main(String[] args) {
        String outputPath = "src/test/resources/sample-radius.pcap";
        try {
            generateRadiusPcap(outputPath);
            System.out.println("Generated RADIUS PCAP file: " + outputPath);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void generateRadiusPcap(String outputPath) throws IOException {
        try (FileOutputStream fos = new FileOutputStream(outputPath)) {
            // Write PCAP global header
            writePcapGlobalHeader(fos);

            long timestamp = Instant.now().getEpochSecond();

            // Generate different RADIUS packets
            writeRadiusPacket(fos, timestamp, 1, "192.168.1.100", "192.168.1.1",
                             createAccessRequestPacket());

            writeRadiusPacket(fos, timestamp + 1, 2, "192.168.1.100", "192.168.1.1",
                             createAccountingStartPacket());

            writeRadiusPacket(fos, timestamp + 30, 3, "192.168.1.100", "192.168.1.1",
                             createAccountingUpdatePacket());

            writeRadiusPacket(fos, timestamp + 60, 4, "192.168.1.100", "192.168.1.1",
                             createAccountingStopPacket());

            // Add more packets from different source IP
            writeRadiusPacket(fos, timestamp + 5, 5, "192.168.1.101", "192.168.1.1",
                             createAccessRequestPacket("user2@example.com"));

            writeRadiusPacket(fos, timestamp + 6, 6, "192.168.1.101", "192.168.1.1",
                             createAccountingStartPacket("user2@example.com"));
        }
    }

    private static void writePcapGlobalHeader(FileOutputStream fos) throws IOException {
        ByteBuffer buffer = ByteBuffer.allocate(24);
        buffer.order(ByteOrder.LITTLE_ENDIAN);

        buffer.putInt(PCAP_MAGIC);           // magic number
        buffer.putShort(VERSION_MAJOR);      // version major
        buffer.putShort(VERSION_MINOR);      // version minor
        buffer.putInt(0);                    // timezone offset
        buffer.putInt(0);                    // timestamp accuracy
        buffer.putInt(SNAPLEN);              // snapshot length
        buffer.putInt(LINKTYPE_ETHERNET);    // data link type

        fos.write(buffer.array());
    }

    private static void writeRadiusPacket(FileOutputStream fos, long timestamp, int id,
                                          String srcIp, String dstIp, byte[] radiusData) throws IOException {
        // Build Ethernet + IP + UDP + RADIUS packet
        byte[] ethernetHeader = createEthernetHeader();
        byte[] ipHeader = createIpHeader(srcIp, dstIp, radiusData.length + 8); // +8 for UDP header
        byte[] udpHeader = createUdpHeader(12345, 1812, radiusData.length); // src port 12345, dst port 1812 (RADIUS auth)

        // Calculate total packet size
        int packetSize = ethernetHeader.length + ipHeader.length + udpHeader.length + radiusData.length;

        // Write PCAP packet header (16 bytes)
        ByteBuffer packetHeader = ByteBuffer.allocate(16);
        packetHeader.order(ByteOrder.LITTLE_ENDIAN);
        packetHeader.putInt((int) timestamp);        // timestamp seconds
        packetHeader.putInt(0);                      // timestamp microseconds
        packetHeader.putInt(packetSize);             // captured length
        packetHeader.putInt(packetSize);             // original length
        fos.write(packetHeader.array());

        // Write packet data
        fos.write(ethernetHeader);
        fos.write(ipHeader);
        fos.write(udpHeader);
        fos.write(radiusData);
    }

    private static byte[] createEthernetHeader() {
        byte[] header = new byte[14];
        // Destination MAC (00:11:22:33:44:55)
        header[0] = 0x00; header[1] = 0x11; header[2] = 0x22;
        header[3] = 0x33; header[4] = 0x44; header[5] = 0x55;
        // Source MAC (AA:BB:CC:DD:EE:FF)
        header[6] = (byte)0xAA; header[7] = (byte)0xBB; header[8] = (byte)0xCC;
        header[9] = (byte)0xDD; header[10] = (byte)0xEE; header[11] = (byte)0xFF;
        // EtherType: IPv4 (0x0800)
        header[12] = 0x08; header[13] = 0x00;
        return header;
    }

    private static byte[] createIpHeader(String srcIp, String dstIp, int payloadLength) {
        byte[] header = new byte[20];
        header[0] = 0x45; // Version 4, header length 5 (20 bytes)
        header[1] = 0x00; // DSCP/ECN
        // Total length
        int totalLength = 20 + payloadLength;
        header[2] = (byte)(totalLength >> 8);
        header[3] = (byte)(totalLength & 0xFF);
        header[4] = 0x00; header[5] = 0x01; // Identification
        header[6] = 0x00; header[7] = 0x00; // Flags/Fragment offset
        header[8] = 0x40; // TTL = 64
        header[9] = 0x11; // Protocol = UDP (17)
        header[10] = 0x00; header[11] = 0x00; // Checksum (will be calculated)

        // Source IP
        String[] srcParts = srcIp.split("\\.");
        for (int i = 0; i < 4; i++) {
            header[12 + i] = (byte)Integer.parseInt(srcParts[i]);
        }

        // Destination IP
        String[] dstParts = dstIp.split("\\.");
        for (int i = 0; i < 4; i++) {
            header[16 + i] = (byte)Integer.parseInt(dstParts[i]);
        }

        // Calculate checksum
        int checksum = calculateChecksum(header);
        header[10] = (byte)(checksum >> 8);
        header[11] = (byte)(checksum & 0xFF);

        return header;
    }

    private static byte[] createUdpHeader(int srcPort, int dstPort, int dataLength) {
        byte[] header = new byte[8];
        header[0] = (byte)(srcPort >> 8);
        header[1] = (byte)(srcPort & 0xFF);
        header[2] = (byte)(dstPort >> 8);
        header[3] = (byte)(dstPort & 0xFF);
        int length = 8 + dataLength;
        header[4] = (byte)(length >> 8);
        header[5] = (byte)(length & 0xFF);
        header[6] = 0x00; header[7] = 0x00; // Checksum (not calculated for simplicity)
        return header;
    }

    private static int calculateChecksum(byte[] data) {
        int sum = 0;
        for (int i = 0; i < data.length; i += 2) {
            int word = ((data[i] & 0xFF) << 8);
            if (i + 1 < data.length) {
                word += (data[i + 1] & 0xFF);
            }
            sum += word;
        }
        while ((sum >> 16) > 0) {
            sum = (sum & 0xFFFF) + (sum >> 16);
        }
        return ~sum & 0xFFFF;
    }

    private static byte[] createAccessRequestPacket() {
        return createAccessRequestPacket("testuser@example.com");
    }

    private static byte[] createAccessRequestPacket(String username) {
        // RADIUS Access-Request (Code=1)
        ByteBuffer buffer = ByteBuffer.allocate(256);

        buffer.put((byte)1);  // Code: Access-Request
        buffer.put((byte)1);  // Identifier

        // Length placeholder (will be updated)
        int lengthPos = buffer.position();
        buffer.putShort((short)0);

        // Authenticator (16 bytes)
        for (int i = 0; i < 16; i++) {
            buffer.put((byte)(Math.random() * 256));
        }

        // Attribute: User-Name (Type=1)
        addStringAttribute(buffer, 1, username);

        // Attribute: NAS-IP-Address (Type=4)
        addIpAttribute(buffer, 4, "10.0.0.1");

        // Attribute: NAS-Port (Type=5)
        addIntegerAttribute(buffer, 5, 0);

        // Attribute: Called-Station-Id (Type=30) - SSID
        addStringAttribute(buffer, 30, "Guest-WiFi");

        // Attribute: Calling-Station-Id (Type=31) - Client MAC
        addStringAttribute(buffer, 31, "AA-BB-CC-DD-EE-FF");

        // Attribute: NAS-Identifier (Type=32)
        addStringAttribute(buffer, 32, "AP-01");

        // Update length
        int length = buffer.position();
        buffer.putShort(lengthPos, (short)length);

        byte[] packet = new byte[length];
        buffer.flip();
        buffer.get(packet);
        return packet;
    }

    private static byte[] createAccountingStartPacket() {
        return createAccountingStartPacket("testuser@example.com");
    }

    private static byte[] createAccountingStartPacket(String username) {
        // RADIUS Accounting-Request (Code=4) with Status-Type=Start
        ByteBuffer buffer = ByteBuffer.allocate(256);

        buffer.put((byte)4);  // Code: Accounting-Request
        buffer.put((byte)2);  // Identifier

        int lengthPos = buffer.position();
        buffer.putShort((short)0);

        // Authenticator
        for (int i = 0; i < 16; i++) {
            buffer.put((byte)(Math.random() * 256));
        }

        // Attribute: User-Name (Type=1)
        addStringAttribute(buffer, 1, username);

        // Attribute: NAS-IP-Address (Type=4)
        addIpAttribute(buffer, 4, "10.0.0.1");

        // Attribute: Acct-Status-Type (Type=40) - Start=1
        addIntegerAttribute(buffer, 40, 1);

        // Attribute: Acct-Session-Id (Type=44)
        addStringAttribute(buffer, 44, "session-" + System.currentTimeMillis());

        // Attribute: Called-Station-Id (Type=30)
        addStringAttribute(buffer, 30, "Guest-WiFi");

        // Attribute: Calling-Station-Id (Type=31)
        addStringAttribute(buffer, 31, "AA-BB-CC-DD-EE-FF");

        // Attribute: NAS-Port-Type (Type=61) - Wireless=19
        addIntegerAttribute(buffer, 61, 19);

        int length = buffer.position();
        buffer.putShort(lengthPos, (short)length);

        byte[] packet = new byte[length];
        buffer.flip();
        buffer.get(packet);
        return packet;
    }

    private static byte[] createAccountingUpdatePacket() {
        // RADIUS Accounting-Request (Code=4) with Status-Type=Interim-Update
        ByteBuffer buffer = ByteBuffer.allocate(256);

        buffer.put((byte)4);  // Code: Accounting-Request
        buffer.put((byte)3);  // Identifier

        int lengthPos = buffer.position();
        buffer.putShort((short)0);

        // Authenticator
        for (int i = 0; i < 16; i++) {
            buffer.put((byte)(Math.random() * 256));
        }

        // Attribute: User-Name (Type=1)
        addStringAttribute(buffer, 1, "testuser@example.com");

        // Attribute: Acct-Status-Type (Type=40) - Interim-Update=3
        addIntegerAttribute(buffer, 40, 3);

        // Attribute: Acct-Session-Id (Type=44)
        addStringAttribute(buffer, 44, "session-" + System.currentTimeMillis());

        // Attribute: Acct-Session-Time (Type=46) - 30 seconds
        addIntegerAttribute(buffer, 46, 30);

        // Attribute: Acct-Input-Octets (Type=42)
        addIntegerAttribute(buffer, 42, 1024000);

        // Attribute: Acct-Output-Octets (Type=43)
        addIntegerAttribute(buffer, 43, 2048000);

        int length = buffer.position();
        buffer.putShort(lengthPos, (short)length);

        byte[] packet = new byte[length];
        buffer.flip();
        buffer.get(packet);
        return packet;
    }

    private static byte[] createAccountingStopPacket() {
        // RADIUS Accounting-Request (Code=4) with Status-Type=Stop
        ByteBuffer buffer = ByteBuffer.allocate(256);

        buffer.put((byte)4);  // Code: Accounting-Request
        buffer.put((byte)4);  // Identifier

        int lengthPos = buffer.position();
        buffer.putShort((short)0);

        // Authenticator
        for (int i = 0; i < 16; i++) {
            buffer.put((byte)(Math.random() * 256));
        }

        // Attribute: User-Name (Type=1)
        addStringAttribute(buffer, 1, "testuser@example.com");

        // Attribute: Acct-Status-Type (Type=40) - Stop=2
        addIntegerAttribute(buffer, 40, 2);

        // Attribute: Acct-Session-Id (Type=44)
        addStringAttribute(buffer, 44, "session-" + System.currentTimeMillis());

        // Attribute: Acct-Session-Time (Type=46) - 60 seconds total
        addIntegerAttribute(buffer, 46, 60);

        // Attribute: Acct-Input-Octets (Type=42)
        addIntegerAttribute(buffer, 42, 2048000);

        // Attribute: Acct-Output-Octets (Type=43)
        addIntegerAttribute(buffer, 43, 4096000);

        // Attribute: Acct-Terminate-Cause (Type=49) - User-Request=1
        addIntegerAttribute(buffer, 49, 1);

        int length = buffer.position();
        buffer.putShort(lengthPos, (short)length);

        byte[] packet = new byte[length];
        buffer.flip();
        buffer.get(packet);
        return packet;
    }

    private static void addStringAttribute(ByteBuffer buffer, int type, String value) {
        byte[] bytes = value.getBytes();
        buffer.put((byte)type);
        buffer.put((byte)(2 + bytes.length));
        buffer.put(bytes);
    }

    private static void addIntegerAttribute(ByteBuffer buffer, int type, int value) {
        buffer.put((byte)type);
        buffer.put((byte)6); // Type(1) + Length(1) + Integer(4) = 6
        buffer.putInt(value);
    }

    private static void addIpAttribute(ByteBuffer buffer, int type, String ipAddress) {
        String[] parts = ipAddress.split("\\.");
        buffer.put((byte)type);
        buffer.put((byte)6); // Type(1) + Length(1) + IP(4) = 6
        for (String part : parts) {
            buffer.put((byte)Integer.parseInt(part));
        }
    }
}
