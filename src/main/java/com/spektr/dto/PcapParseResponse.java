package com.spektr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PcapParseResponse {
    private List<RadiusPacketData> accessRequests;
    private List<RadiusPacketData> accountingStarts;
    private List<RadiusPacketData> accountingUpdates;
    private List<RadiusPacketData> accountingStops;
    private int totalPacketsProcessed;
    private int radiusPacketsFound;
    private String message;
}
