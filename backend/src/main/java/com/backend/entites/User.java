package com.backend.entites;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.backend.enums.Role;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
@Entity
@Table(name = "app_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Size(max = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    @Size(max = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    @Size(max = 100)
    private String login;

    // Free-text about-me shown on the user's profile - null/blank just means they haven't
    // written one yet, not an error state.
    @Size(max = 500)
    @Column(columnDefinition = "TEXT")
    private String bio;

    // Stored as a base64 data URI (e.g. "data:image/png;base64,...") rather than a filename/
    // path, so there's no separate file storage or static-serving setup to stand up - the
    // frontend caps the source image size before ever sending it here (see edit-profile-form),
    // so this staying unbounded in the DB isn't a practical concern for this app's scale.
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String profilePicture;

    // Null for accounts that only ever signed in via Google - they have no local password.
    @Size(max = 100)
    private String password;

    @Builder.Default
    private boolean isActive = false;

    // Consecutive calendar days (up to and including lastActiveDate) with at least one
    // completed practice session - mirrors a Duolingo-style streak. Resets to 1 (not 0) the
    // day after a gap, since that day's own activity is what re-starts it.
    @Builder.Default
    private int currentStreak = 0;

    @Builder.Default
    private int longestStreak = 0;

    // Null until the first routine is ever completed. Compared against "today" whenever a
    // routine finishes to decide whether the streak continues, resets, or is a same-day
    // repeat (which shouldn't double-count).
    private LocalDate lastActiveDate;

    @JsonManagedReference("user-network")
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Network> networks = new ArrayList<>();

    @JsonManagedReference("user-folder")
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Folder> folders = new ArrayList<>();

    @JsonManagedReference("user-routine")
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Routine> routines = new ArrayList<>();


}
