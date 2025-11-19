package com.spektr.controller;

import com.spektr.dto.ShareConfigurationRequest;
import com.spektr.dto.VendorConfigurationRequest;
import com.spektr.dto.VendorConfigurationResponse;
import com.spektr.model.User;
import com.spektr.service.UserService;
import com.spektr.service.VendorConfigurationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorConfigurationController {

    private final VendorConfigurationService vendorConfigurationService;
    private final UserService userService;

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
}
