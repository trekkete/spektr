package com.spektr.service;

import com.spektr.dto.ShareConfigurationRequest;
import com.spektr.dto.VendorConfigurationRequest;
import com.spektr.dto.VendorConfigurationResponse;
import com.spektr.model.User;
import com.spektr.model.VendorConfiguration;
import com.spektr.repository.UserRepository;
import com.spektr.repository.VendorConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VendorConfigurationService {

    private final VendorConfigurationRepository configurationRepository;
    private final UserRepository userRepository;

    @Transactional
    public VendorConfigurationResponse createConfiguration(VendorConfigurationRequest request, User owner) {
        VendorConfiguration configuration = new VendorConfiguration();
        configuration.setVendorName(request.getVendorName());
        configuration.setVendorData(request.getVendorData());
        configuration.setDescription(request.getDescription());
        configuration.setOwner(owner);

        // Determine version number
        if (request.getParentVersionId() != null) {
            VendorConfiguration parent = configurationRepository.findById(request.getParentVersionId())
                    .orElseThrow(() -> new RuntimeException("Parent version not found"));
            configuration.setParentVersion(parent);
            configuration.setVersion(parent.getVersion() + 1);
        } else {
            // New vendor configuration, check if there are existing versions
            VendorConfiguration latest = configurationRepository
                    .findFirstByVendorNameAndOwnerAndDeletedFalseOrderByVersionDesc(
                            request.getVendorName(), owner)
                    .orElse(null);
            configuration.setVersion(latest != null ? latest.getVersion() + 1 : 1);
        }

        VendorConfiguration saved = configurationRepository.save(configuration);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<VendorConfigurationResponse> getMyConfigurations(User user) {
        List<VendorConfiguration> configurations =
                configurationRepository.findByOwnerAndDeletedFalseOrderByCreatedAtDesc(user);
        return configurations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VendorConfigurationResponse> getSharedConfigurations(User user) {
        List<VendorConfiguration> configurations =
                configurationRepository.findSharedWithUser(user);
        return configurations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VendorConfigurationResponse> getAllAccessibleConfigurations(User user) {
        List<VendorConfiguration> configurations =
                configurationRepository.findAllAccessibleByUser(user);
        return configurations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VendorConfigurationResponse getConfiguration(Long id, User user) {
        VendorConfiguration configuration = configurationRepository
                .findByIdAndAccessibleByUser(id, user)
                .orElseThrow(() -> new RuntimeException("Configuration not found or access denied"));
        return mapToResponse(configuration);
    }

    @Transactional(readOnly = true)
    public List<VendorConfigurationResponse> getVersionHistory(String vendorName, User user) {
        List<VendorConfiguration> versions =
                configurationRepository.findVersionHistory(vendorName, user);
        return versions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VendorConfigurationResponse shareConfiguration(ShareConfigurationRequest request, User owner) {
        VendorConfiguration configuration = configurationRepository.findById(request.getConfigurationId())
                .orElseThrow(() -> new RuntimeException("Configuration not found"));

        // Only owner can share
        if (!configuration.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the owner can share this configuration");
        }

        Set<User> usersToShare = new HashSet<>();
        for (String username : request.getUsernames()) {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found: " + username));
            usersToShare.add(user);
        }

        configuration.setSharedWith(usersToShare);
        VendorConfiguration saved = configurationRepository.save(configuration);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteConfiguration(Long id, User owner) {
        VendorConfiguration configuration = configurationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Configuration not found"));

        // Only owner can delete (soft delete)
        if (!configuration.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the owner can delete this configuration");
        }

        // Soft delete - versions should never be truly deleted
        configuration.setDeleted(true);
        configurationRepository.save(configuration);
    }

    private VendorConfigurationResponse mapToResponse(VendorConfiguration config) {
        VendorConfigurationResponse response = new VendorConfigurationResponse();
        response.setId(config.getId());
        response.setVendorName(config.getVendorName());
        response.setVersion(config.getVersion());
        response.setVendorData(config.getVendorData());
        response.setOwnerUsername(config.getOwner().getUsername());
        response.setOwnerId(config.getOwner().getId());
        response.setParentVersionId(config.getParentVersion() != null ?
                config.getParentVersion().getId() : null);
        response.setSharedWithUsernames(config.getSharedWith().stream()
                .map(User::getUsername)
                .collect(Collectors.toSet()));
        response.setCreatedAt(config.getCreatedAt());
        response.setUpdatedAt(config.getUpdatedAt());
        response.setDescription(config.getDescription());
        return response;
    }
}
