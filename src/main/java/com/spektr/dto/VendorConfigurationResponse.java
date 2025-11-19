package com.spektr.dto;

import com.spektr.model.Vendor;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorConfigurationResponse {

    private Long id;
    private String vendorName;
    private Integer version;
    private Vendor vendorData;
    private String ownerUsername;
    private Long ownerId;
    private Long parentVersionId;
    private Set<String> sharedWithUsernames;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String description;
}
