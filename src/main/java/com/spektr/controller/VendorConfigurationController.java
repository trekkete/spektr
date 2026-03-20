package com.spektr.controller;

import com.spektr.dto.EnumMaskValue;
import com.spektr.dto.ShareConfigurationRequest;
import com.spektr.dto.VendorConfigurationRequest;
import com.spektr.dto.VendorConfigurationResponse;
import com.spektr.model.User;
import com.spektr.model.Vendor;
import com.spektr.model.VendorConfiguration;
import com.spektr.service.PdfGeneratorService;
import com.spektr.service.UserService;
import com.spektr.service.VendorConfigurationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorConfigurationController {

    private final VendorConfigurationService vendorConfigurationService;
    private final UserService userService;
    private final PdfGeneratorService pdfGeneratorService;

    @PostMapping
    public ResponseEntity<?> createConfiguration(@Valid @RequestBody VendorConfigurationRequest request) {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            VendorConfigurationResponse response =
                    vendorConfigurationService.createConfiguration(request, currentUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error creating configuration: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyConfigurations() {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            List<VendorConfigurationResponse> configurations =
                    vendorConfigurationService.getMyConfigurations(currentUser);
            return ResponseEntity.ok(configurations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching configurations: " + e.getMessage());
        }
    }

    @GetMapping("/shared")
    public ResponseEntity<?> getSharedConfigurations() {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            List<VendorConfigurationResponse> configurations =
                    vendorConfigurationService.getSharedConfigurations(currentUser);
            return ResponseEntity.ok(configurations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching shared configurations: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllAccessibleConfigurations() {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            List<VendorConfigurationResponse> configurations =
                    vendorConfigurationService.getAllAccessibleConfigurations(currentUser);
            return ResponseEntity.ok(configurations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching configurations: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getConfiguration(@PathVariable Long id) {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            VendorConfigurationResponse configuration =
                    vendorConfigurationService.getConfiguration(id, currentUser);
            return ResponseEntity.ok(configuration);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Configuration not found: " + e.getMessage());
        }
    }

    @GetMapping("/history/{vendorName}")
    public ResponseEntity<?> getVersionHistory(@PathVariable String vendorName) {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            List<VendorConfigurationResponse> versions =
                    vendorConfigurationService.getVersionHistory(vendorName, currentUser);
            return ResponseEntity.ok(versions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching version history: " + e.getMessage());
        }
    }

    @PostMapping("/share")
    public ResponseEntity<?> shareConfiguration(@Valid @RequestBody ShareConfigurationRequest request) {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            VendorConfigurationResponse response =
                    vendorConfigurationService.shareConfiguration(request, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error sharing configuration: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> exportConfigurationToPdf(@PathVariable Long id) {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            // Get the configuration
            VendorConfigurationResponse response =
                    vendorConfigurationService.getConfiguration(id, currentUser);

            // Convert response to VendorConfiguration entity for PDF generation
            VendorConfiguration config = vendorConfigurationService.getConfigurationEntity(id, currentUser);

            // Generate PDF
            byte[] pdfBytes = pdfGeneratorService.generateVendorConfigurationPdf(config);

            // Create filename
            String filename = String.format("%s_v%d.pdf",
                    config.getVendorName().replaceAll("[^a-zA-Z0-9]", "_"),
                    config.getVersion());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating PDF: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConfiguration(@PathVariable Long id) {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            vendorConfigurationService.deleteConfiguration(id, currentUser);
            return ResponseEntity.ok("Configuration deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error deleting configuration: " + e.getMessage());
        }
    }

    @GetMapping("/enums/roaming-behaviour")
    public ResponseEntity<List<String>> getRoamingBehaviourValues() {
        List<String> values = Arrays.stream(Vendor.RoamingBehaviour.values())
                .map(Enum::name)
                .collect(Collectors.toList());
        return ResponseEntity.ok(values);
    }

    @GetMapping("/enums/password-authentication-mask")
    public ResponseEntity<List<EnumMaskValue>> getPasswordAuthenticationMaskValues() {
        List<EnumMaskValue> values = Arrays.stream(Vendor.PasswordAuthenticationMask.values())
                .map(e -> new EnumMaskValue(e.name(), e.getFlag()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(values);
    }

    @GetMapping("/enums/walled-garden-mask")
    public ResponseEntity<List<EnumMaskValue>> getWalledGardenMaskValues() {
        List<EnumMaskValue> values = Arrays.stream(Vendor.WalledGardenMask.values())
                .map(e -> new EnumMaskValue(e.name(), e.getFlag()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(values);
    }

    @GetMapping("/enums/radius-attributes-mask")
    public ResponseEntity<List<EnumMaskValue>> getRadiusAttributesMask() {
        List<EnumMaskValue> values = Arrays.stream(Vendor.RadiusAttributes.values())
                                           .map(e -> new EnumMaskValue(e.name(), e.getFlag()))
                                           .collect(Collectors.toList());
        return ResponseEntity.ok(values);
    }
}
