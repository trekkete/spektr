package com.spektr.service;

import com.spektr.dto.PcapParseResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

import static org.junit.jupiter.api.Assertions.*;

class PcapParserServiceTest {

    private PcapParserService pcapParserService;

    @BeforeEach
    void setUp() {
        pcapParserService = new PcapParserService();
    }

    @Test
    void testParseSampleRadiusPcap() throws IOException {
        // Load the sample PCAP file from test resources
        File pcapFile = new File("src/test/resources/sample-radius.pcap");
        assertTrue(pcapFile.exists(), "Sample PCAP file should exist");

        byte[] content = Files.readAllBytes(pcapFile.toPath());
        MultipartFile multipartFile = new MockMultipartFile(
                "file",
                "sample-radius.pcap",
                "application/vnd.tcpdump.pcap",
                content
        );

        // Parse without filters
        PcapParseResponse response = pcapParserService.parsePcapFile(multipartFile, null, null);

        // Verify results
        assertNotNull(response);
        assertTrue(response.getTotalPacketsProcessed() > 0, "Should process packets");
        assertTrue(response.getRadiusPacketsFound() > 0, "Should find RADIUS packets");

        // Verify packet types
        assertEquals(2, response.getAccessRequests().size(),
                    "Should have 2 Access-Request packets");
        assertEquals(2, response.getAccountingStarts().size(),
                    "Should have 2 Accounting-Start packets");
        assertEquals(1, response.getAccountingUpdates().size(),
                    "Should have 1 Accounting-Interim-Update packet");
        assertEquals(1, response.getAccountingStops().size(),
                    "Should have 1 Accounting-Stop packet");

        // Verify packet details
        assertFalse(response.getAccessRequests().isEmpty());
        var accessRequest = response.getAccessRequests().get(0);
        assertEquals("Access-Request", accessRequest.getPacketType());
        assertEquals("192.168.1.100", accessRequest.getSourceIp());
        assertEquals("192.168.1.1", accessRequest.getDestinationIp());
        assertNotNull(accessRequest.getAttributes());
        assertTrue(accessRequest.getAttributes().containsKey("User-Name"));

        System.out.println("\n=== Parse Results ===");
        System.out.println("Total Packets: " + response.getTotalPacketsProcessed());
        System.out.println("RADIUS Packets: " + response.getRadiusPacketsFound());
        System.out.println("Access-Request: " + response.getAccessRequests().size());
        System.out.println("Accounting-Start: " + response.getAccountingStarts().size());
        System.out.println("Accounting-Update: " + response.getAccountingUpdates().size());
        System.out.println("Accounting-Stop: " + response.getAccountingStops().size());
        System.out.println("\n=== First Access-Request Packet ===");
        System.out.println(accessRequest.getRawData());
    }

    @Test
    void testParseWithSourceIpFilter() throws IOException {
        File pcapFile = new File("src/test/resources/sample-radius.pcap");
        byte[] content = Files.readAllBytes(pcapFile.toPath());
        MultipartFile multipartFile = new MockMultipartFile(
                "file",
                "sample-radius.pcap",
                "application/vnd.tcpdump.pcap",
                content
        );

        // Parse with source IP filter
        PcapParseResponse response = pcapParserService.parsePcapFile(
                multipartFile,
                "192.168.1.101",
                null
        );

        assertNotNull(response);

        // Should only find packets from 192.168.1.101
        assertEquals(1, response.getAccessRequests().size());
        assertEquals(1, response.getAccountingStarts().size());
        assertEquals(0, response.getAccountingUpdates().size());
        assertEquals(0, response.getAccountingStops().size());

        // Verify all packets are from the filtered IP
        response.getAccessRequests().forEach(packet ->
            assertEquals("192.168.1.101", packet.getSourceIp())
        );
        response.getAccountingStarts().forEach(packet ->
            assertEquals("192.168.1.101", packet.getSourceIp())
        );

        System.out.println("\n=== Filtered by IP 192.168.1.101 ===");
        System.out.println("Access-Request: " + response.getAccessRequests().size());
        System.out.println("Accounting-Start: " + response.getAccountingStarts().size());
    }

    @Test
    void testParseWithTextFilter() throws IOException {
        File pcapFile = new File("src/test/resources/sample-radius.pcap");
        byte[] content = Files.readAllBytes(pcapFile.toPath());
        MultipartFile multipartFile = new MockMultipartFile(
                "file",
                "sample-radius.pcap",
                "application/vnd.tcpdump.pcap",
                content
        );

        // Parse with text filter
        PcapParseResponse response = pcapParserService.parsePcapFile(
                multipartFile,
                null,
                "user2"
        );

        assertNotNull(response);

        // Should only find packets containing "user2"
        assertEquals(1, response.getAccessRequests().size());
        assertEquals(1, response.getAccountingStarts().size());

        // Verify packets contain the search text
        response.getAccessRequests().forEach(packet -> {
            String rawData = packet.getRawData().toLowerCase();
            String attributes = packet.getAttributes().toString().toLowerCase();
            assertTrue(rawData.contains("user2") || attributes.contains("user2"));
        });

        System.out.println("\n=== Filtered by text 'user2' ===");
        System.out.println("Access-Request: " + response.getAccessRequests().size());
        System.out.println("Accounting-Start: " + response.getAccountingStarts().size());
    }

    @Test
    void testParseWithBothFilters() throws IOException {
        File pcapFile = new File("src/test/resources/sample-radius.pcap");
        byte[] content = Files.readAllBytes(pcapFile.toPath());
        MultipartFile multipartFile = new MockMultipartFile(
                "file",
                "sample-radius.pcap",
                "application/vnd.tcpdump.pcap",
                content
        );

        // Parse with both filters
        PcapParseResponse response = pcapParserService.parsePcapFile(
                multipartFile,
                "192.168.1.100",
                "testuser"
        );

        assertNotNull(response);

        // Should find packets from 192.168.1.100 containing "testuser"
        assertTrue(response.getAccessRequests().size() > 0);

        // Verify all constraints
        response.getAccessRequests().forEach(packet -> {
            assertEquals("192.168.1.100", packet.getSourceIp());
            String data = (packet.getRawData() + packet.getAttributes().toString()).toLowerCase();
            assertTrue(data.contains("testuser"));
        });

        System.out.println("\n=== Filtered by IP and text ===");
        System.out.println("Results: " + response.getRadiusPacketsFound());
    }
}
