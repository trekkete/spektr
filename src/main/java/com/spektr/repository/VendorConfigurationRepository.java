package com.spektr.repository;

import com.spektr.model.User;
import com.spektr.model.VendorConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorConfigurationRepository extends JpaRepository<VendorConfiguration, Long> {

    // Find all configurations owned by a user (not deleted)
    List<VendorConfiguration> findByOwnerAndDeletedFalseOrderByCreatedAtDesc(User owner);

    // Find all configurations shared with a user
    @Query("SELECT vc FROM VendorConfiguration vc JOIN vc.sharedWith u WHERE u = :user AND vc.deleted = false ORDER BY vc.createdAt DESC")
    List<VendorConfiguration> findSharedWithUser(@Param("user") User user);

    // Find all accessible configurations (owned + shared)
    @Query("SELECT DISTINCT vc FROM VendorConfiguration vc LEFT JOIN vc.sharedWith u WHERE (vc.owner = :user OR u = :user) AND vc.deleted = false ORDER BY vc.createdAt DESC")
    List<VendorConfiguration> findAllAccessibleByUser(@Param("user") User user);

    // Find by vendor name and owner
    List<VendorConfiguration> findByVendorNameAndOwnerAndDeletedFalseOrderByVersionDesc(String vendorName, User owner);

    // Find latest version by vendor name and owner
    Optional<VendorConfiguration> findFirstByVendorNameAndOwnerAndDeletedFalseOrderByVersionDesc(String vendorName, User owner);

    // Find by ID and check access (owner or shared)
    @Query("SELECT vc FROM VendorConfiguration vc LEFT JOIN vc.sharedWith u WHERE vc.id = :id AND (vc.owner = :user OR u = :user) AND vc.deleted = false")
    Optional<VendorConfiguration> findByIdAndAccessibleByUser(@Param("id") Long id, @Param("user") User user);

    // Get version history for a vendor (following parent chain)
    @Query("SELECT vc FROM VendorConfiguration vc WHERE vc.vendorName = :vendorName AND vc.owner = :owner AND vc.deleted = false ORDER BY vc.version DESC")
    List<VendorConfiguration> findVersionHistory(@Param("vendorName") String vendorName, @Param("owner") User owner);
}
