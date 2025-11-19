package com.spektr.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShareConfigurationRequest {

    @NotNull(message = "Configuration ID is required")
    private Long configurationId;

    @NotEmpty(message = "At least one username is required")
    private Set<String> usernames;
}
