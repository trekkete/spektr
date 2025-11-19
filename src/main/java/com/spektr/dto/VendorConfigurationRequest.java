package com.spektr.dto;

import com.spektr.model.Vendor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorConfigurationRequest {

    @NotBlank(message = "Vendor name is required")
    private String vendorName;

    @NotNull(message = "Vendor data is required")
    private Vendor vendorData;

    private String description;

    private Long parentVersionId; // For creating new version based on existing
}
