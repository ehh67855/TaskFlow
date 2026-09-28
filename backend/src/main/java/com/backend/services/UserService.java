package com.backend.services;

import com.backend.dtos.BadgeDto;
import com.backend.dtos.CredentialsDto;
import com.backend.dtos.EdgeDto;
import com.backend.dtos.SignUpDto;
import com.backend.dtos.UserDto;
import com.backend.dtos.UserProgressDto;
import com.backend.entites.ActivationToken;
import com.backend.entites.Edge;
import com.backend.entites.User;
import com.backend.enums.Role;
import com.backend.exceptions.AppException;
import com.backend.mappers.UserMapper;
import com.backend.repositories.ActivationTokenRepository;
import com.backend.repositories.UserRepository;

import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.CharBuffer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final UserMapper userMapper;

    private final ActivationTokenRepository activationTokenRepository;

    private final EmailService emailService;

    public UserDto login(CredentialsDto credentialsDto) {
        User user = userRepository.findByLogin(credentialsDto.getLogin())
                .orElseThrow(() -> new AppException("Unknown user", HttpStatus.NOT_FOUND));

        if(!user.isActive()) {
            throw new AppException("User account not active", HttpStatus.FORBIDDEN);
        }

        if (user.getPassword() == null) {
            throw new AppException("This account uses Google Sign-In - please log in with Google", HttpStatus.BAD_REQUEST);
        }

        if (passwordEncoder.matches(CharBuffer.wrap(credentialsDto.getPassword()), user.getPassword())) {
            return userMapper.toUserDto(user);
        }
        throw new AppException("Invalid password", HttpStatus.BAD_REQUEST);
    }

    public UserDto register(SignUpDto userDto) {
        Optional<User> optionalUser = userRepository.findByLogin(userDto.getLogin());

        if (optionalUser.isPresent()) {
            throw new AppException("Login already exists", HttpStatus.BAD_REQUEST);
        }

        User user = userMapper.signUpToUser(userDto);
        user.setRole(Role.USER);
        user.setPassword(passwordEncoder.encode(CharBuffer.wrap(userDto.getPassword())));
        user.setActive(false);


        User savedUser = userRepository.save(user);

        return userMapper.toUserDto(savedUser);
    }

    // Google verifies the email for us, so a Google sign-in either logs into the existing
    // account with that email (activating it if it was still pending email confirmation) or
    // creates a brand new, already-active account - no password, no activation email needed.
    public UserDto findOrCreateOAuthUser(String email, String firstName, String lastName) {
        User user = userRepository.findByLogin(email).orElseGet(() -> User.builder()
                .login(email)
                .firstName(firstName)
                .lastName(lastName != null && !lastName.isBlank() ? lastName : "")
                .role(Role.USER)
                .isActive(true)
                .build());

        if (!user.isActive()) {
            user.setActive(true);
        }

        User savedUser = userRepository.save(user);
        return userMapper.toUserDto(savedUser);
    }

    public UserDto findByLogin(String login) {
        User user = userRepository.findByLogin(login)
                .orElseThrow(() -> new AppException("Unknown user", HttpStatus.NOT_FOUND));
        return userMapper.toUserDto(user);
    }

    public User getUser(String login) {
        return userRepository.findByLogin(login)
                .orElseThrow(() -> new AppException("Unknown user", HttpStatus.NOT_FOUND));
    }

    public boolean activateAccount(String token) {
        ActivationToken activationToken = activationTokenRepository.findByToken(token);
        if (activationToken != null && !activationToken.isExpired()) {
            User user = activationToken.getUser();
            user.setActive(true);
            userRepository.save(user);
            activationTokenRepository.delete(activationToken); 
            return true;
        }
        return false;
    }

    public void sendActivationEmail(String email, String token) {
        String activationLink = "http://localhost:4200/activate-account";
        emailService.sendSimpleMessage(email, "Activate Your Account", "Please click on the following link to activate your account: " + activationLink + ".\n Use the following activation token: " + token);
    }

    
    public void createActivationToken(User user, String token) {
        ActivationToken newToken = new ActivationToken();
        newToken.setUser(user);
        newToken.setToken(token);
        newToken.setExpiryDate(LocalDateTime.now().plusDays(1)); // Expires in 1 day
        activationTokenRepository.save(newToken);
    }
    
    public UserDto editProfile(SignUpDto userDto) {
        User updatedUser = getUser(userDto.getLogin());
    
        if (userDto.getFirstName() != null && !userDto.getFirstName().isEmpty()) {
            updatedUser.setFirstName(userDto.getFirstName());
        }
    
        if (userDto.getLastName() != null && !userDto.getLastName().isEmpty()) {
            updatedUser.setLastName(userDto.getLastName());
        }

        // Unlike name/password, an empty string is a meaningful value here (clearing the bio
        // or removing the profile picture), so these are only skipped when the field is
        // missing from the request entirely, not just blank.
        if (userDto.getBio() != null) {
            updatedUser.setBio(userDto.getBio());
        }

        if (userDto.getProfilePicture() != null) {
            updatedUser.setProfilePicture(userDto.getProfilePicture());
        }

        if (userDto.getPassword() != null && userDto.getPassword().length > 0
            && userDto.getConfirmPassword() != null && !userDto.getConfirmPassword().isEmpty()) {
            String newPassword = new String(userDto.getPassword());
            String confirmPassword = userDto.getConfirmPassword();

            // A Google-only account has no stored password yet, so there's nothing to confirm
            // against - anyone reaching this point is already authenticated as this user, so
            // let them set an initial local password directly.
            if (updatedUser.getPassword() != null) {
                // Check if the confirm password (current password) matches the stored password
                if (!passwordEncoder.matches(confirmPassword, updatedUser.getPassword())) {
                    throw new AppException("Inputted password did not match stored password", HttpStatus.FORBIDDEN);
                }

                // Check if the new password is different from the old password
                if (passwordEncoder.matches(newPassword, updatedUser.getPassword())) {
                    throw new AppException("New password cannot be equal to old password", HttpStatus.CONFLICT);
                }
            }
    
            // Update the password
            updatedUser.setPassword(passwordEncoder.encode(newPassword));
        }
    
        User savedUser = userRepository.save(updatedUser);
        return userMapper.toUserDto(savedUser);
    }

    // Called once per completed practice session (from NetworkService.saveRoutine) - the
    // TaskFlow equivalent of Duolingo's "finish a lesson today". Same-day repeats don't
    // double-count; a gap of more than one day resets the streak back to 1 rather than 0,
    // since the day that just happened is itself a day of activity.
    @Transactional
    public void recordDailyActivity(User user) {
        LocalDate today = LocalDate.now();
        LocalDate lastActive = user.getLastActiveDate();

        if (today.equals(lastActive)) {
            return;
        }

        if (lastActive != null && lastActive.equals(today.minusDays(1))) {
            user.setCurrentStreak(user.getCurrentStreak() + 1);
        } else {
            user.setCurrentStreak(1);
        }

        user.setLastActiveDate(today);
        user.setLongestStreak(Math.max(user.getLongestStreak(), user.getCurrentStreak()));
        userRepository.save(user);
    }

    // Badges are computed fresh from current stats rather than persisted as "earned" rows -
    // simpler, and means there's nothing to backfill or get out of sync. Streak badges check
    // against the *longest* streak (not the current one) so a badge already earned doesn't
    // disappear just because today's streak later resets - matching how real achievement
    // badges behave elsewhere (Duolingo included).
    public UserProgressDto getUserProgress(String login) {
        User user = getUser(login);
        int routinesCompleted = user.getRoutines().size();
        int networksCreated = user.getNetworks().size();
        // "Ever published" (publishedAt survives unpublishing - see NetworkService.
        // setNetworkPublished) rather than "currently published", so this badge's progress
        // can't regress just because a network was later taken down from the marketplace.
        int networksPublished = (int) user.getNetworks().stream().filter(n -> n.getPublishedAt() != null).count();

        List<BadgeDto> badges = new ArrayList<>();
        badges.add(buildBadge("first-practice", "First Steps", "Complete your first routine", "🎯", routinesCompleted, 1));
        badges.add(buildBadge("practice-10", "Prolific Practicer", "Complete 10 routines", "🏋️", routinesCompleted, 10));
        badges.add(buildBadge("practice-50", "Practice Master", "Complete 50 routines", "🏆", routinesCompleted, 50));
        badges.add(buildBadge("streak-3", "Consistent", "Reach a 3-day streak", "🔥", user.getLongestStreak(), 3));
        badges.add(buildBadge("streak-7", "Dedicated", "Reach a 7-day streak", "🔥", user.getLongestStreak(), 7));
        badges.add(buildBadge("streak-30", "Unstoppable", "Reach a 30-day streak", "🔥", user.getLongestStreak(), 30));
        badges.add(buildBadge("network-builder", "Network Architect", "Create 5 networks", "🕸️", networksCreated, 5));
        badges.add(buildBadge("first-publish", "Sharing is Caring", "Publish a network to the marketplace", "📦", networksPublished, 1));
        badges.add(buildBadge("publish-3", "Community Builder", "Publish 3 networks to the marketplace", "🌟", networksPublished, 3));

        return UserProgressDto.builder()
            .currentStreak(user.getCurrentStreak())
            .longestStreak(user.getLongestStreak())
            .badges(badges)
            .build();
    }

    private BadgeDto buildBadge(String id, String name, String description, String icon, int current, int target) {
        return BadgeDto.builder()
            .id(id)
            .name(name)
            .description(description)
            .icon(icon)
            .current(Math.min(current, target))
            .target(target)
            .unlocked(current >= target)
            .build();
    }


}
