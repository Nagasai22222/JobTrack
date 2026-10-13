package com.jobtrack.config;

import com.jobtrack.entity.Role;
import com.jobtrack.entity.User;
import com.jobtrack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminProvisioningConfig {

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${admin.email:admin@jobtrack.local}")
    private String adminEmail;

    @Value("${admin.password:}")
    private String adminPassword;

    @Bean
    public CommandLineRunner provisionAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (adminPassword != null && !adminPassword.isBlank()) {
                if (!userRepository.existsByUsername(adminUsername) && !userRepository.existsByEmail(adminEmail)) {
                    User adminUser = new User();
                    adminUser.setUsername(adminUsername);
                    adminUser.setEmail(adminEmail);
                    adminUser.setPassword(passwordEncoder.encode(adminPassword));
                    adminUser.setRole(Role.ADMIN);
                    userRepository.save(adminUser);
                    // Outputting safe startup message
                    System.out.println("Development ADMIN provisioned successfully: " + adminUsername);
                }
            }
        };
    }
}
