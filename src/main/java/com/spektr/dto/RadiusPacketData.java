package com.spektr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RadiusPacketData {
    private String packetType; // Access-Request, Accounting-Start, Accounting-Update, Accounting-Stop
    private String sourceIp;
    private String destinationIp;
    private Long timestamp;
    private Map<String, String> attributes; // RADIUS attributes as key-value pairs
    private String rawData; // Raw packet data for display
}
