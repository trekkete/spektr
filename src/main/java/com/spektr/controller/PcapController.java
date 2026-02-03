package com.spektr.controller;

import com.spektr.dto.PcapParseResponse;
import com.spektr.service.PcapParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/pcap")
public class PcapController {

    @Autowired
    private PcapParserService pcapParserService;

    @PostMapping("/parse")
    public ResponseEntity<?> parsePcapFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "sourceIpFilter", required = false) String sourceIpFilter,
            @RequestParam(value = "textFilter", required = false) String textFilter) {

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".pcap") && !filename.endsWith(".cap"))) {
            return ResponseEntity.badRequest().body("Invalid file format. Please upload a .pcap or .cap file");
        }

        try {
            PcapParseResponse response = pcapParserService.parsePcapFile(file, sourceIpFilter, textFilter);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            String errorMsg = e.getMessage();
            if (errorMsg.contains("libpcap") || errorMsg.contains("UnsatisfiedLinkError")) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("PCAP parsing unavailable on this system. Please use Docker or x86 environment. " + errorMsg);
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to parse PCAP file: " + errorMsg);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unexpected error: " + e.getMessage());
        }
    }
}
